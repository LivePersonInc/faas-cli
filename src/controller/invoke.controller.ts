import { join } from 'path';
import { PrettyPrintableError } from '@oclif/errors';
import { CLIErrorCodes } from '../shared/errorCodes';
import { FileService } from '../service/file.service';
import { factory } from '../service/faasFactory.service';
import { InvokeView } from '../view/invoke.view';
import { FaasDebugger } from '../shared/faas-debugger';
import { InitController } from './init.controller';

interface IInvokeConfig {
  lambdaFunctions: string[];
  inputFlags?: { local?: boolean };
}

interface IInvokeControllerConfig {
  invokeView?: InvokeView;
  fileService?: FileService;
  initController?: InitController;
}

export class InvokeController {
  private invokeView: InvokeView;

  private fileService: FileService;

  private lambdaToInvoke: any;

  private initController: InitController;

  constructor({
    invokeView = new InvokeView(),
    fileService = new FileService(),
    initController = new InitController(),
  }: IInvokeControllerConfig = {}) {
    this.invokeView = invokeView;
    this.fileService = fileService;
    this.lambdaToInvoke = {};
    this.initController = initController;
  }

  /**
   * Invokes the passed function remote or local depending on the --local flag.
   * @param {IInvokeConfig} - lambda function and flags
   * @returns {Promise<void>} - invocation local or remote
   * @memberof InvokeController
   */
  public async invoke({
    lambdaFunctions,
    inputFlags,
  }: IInvokeConfig): Promise<void> {
    try {
      if (this.fileService.needUpdateBinFolder()) {
        await this.initController.init({ update: true });
      }

      const localLambdaInformation =
        this.fileService.collectLocalLambdaInformation(lambdaFunctions);
      [this.lambdaToInvoke] = localLambdaInformation;
      if (inputFlags?.local) {
        const indexPath = join(
          this.fileService.getPathToFunction(lambdaFunctions[0]),
          'index.js',
        );
        const configPath = join(
          this.fileService.getPathToFunction(lambdaFunctions[0]),
          'config.json',
        );
        const invocation = new FaasDebugger({
          indexPath,
          configPath,
          lambdaToInvoke: this.lambdaToInvoke.name,
        });
        await invocation.runLocalInvocation();
      } else {
        await this.invokeRemote();
      }
    } catch (error) {
      this.invokeView.showErrorMessage(error.message || error.errorMsg);
    }
  }

  private async invokeRemote() {
    const faasService = await factory.get();
    const [currentLambda] = (await faasService.getLambdasByNames([
      this.lambdaToInvoke.name,
    ])) as any;

    /* istanbul ignore next */
    if (!currentLambda) {
      const prettyError: PrettyPrintableError = {
        message: `Function ${this.lambdaToInvoke.name} were not found on the platform. Please make sure the function with the name ${this.lambdaToInvoke.name} was pushed to the LivePerson Functions platform`,
        suggestions: [
          'Use "lpf push exampleFunction" to push and "lpf deploy exampleFunction" to deploy a function',
        ],
        ref: 'https://github.com/LivePersonInc/faas-cli#invoke',
        code: CLIErrorCodes.NoLambdasFound,
      };
      this.invokeView.showErrorMessage(prettyError);
      throw new Error('exit');
    }

    const response = await faasService.invoke(
      currentLambda.uuid,
      this.lambdaToInvoke.input,
    );
    this.invokeView.printConsoleLogs(response);
  }
}
