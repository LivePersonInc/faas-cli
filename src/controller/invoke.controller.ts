import { join } from 'path';
import { FileService } from '../service/file.service';
import { factory } from '../service/faasFactory.service';
import { IInvokeResponse } from '../service/faas.service';
import { InvokeView } from '../view/invoke.view';
import { FaasDebugger } from '../shared/faas-debugger';

interface IInvokeConfig {
  lambdaFunctions: string[];
  inputFlags?: { local?: boolean };
}

interface IInvokeControllerConfig {
  invokeView?: InvokeView;
  fileService?: FileService;
}

interface IInvokeErrorLogs {
  errorCode: string;
  errorMsg: string;
  errorLogs: any[];
}

export class InvokeController {
  private result: IInvokeResponse;

  private errorLogs: IInvokeErrorLogs;

  private invokeView: InvokeView;

  private fileService: FileService;

  private lambdaToInvoke: any;

  constructor({
    invokeView = new InvokeView(),
    fileService = new FileService(),
  }: IInvokeControllerConfig = {}) {
    this.result = {
      result: {},
      logs: [],
    };
    this.errorLogs = {
      errorCode: '',
      errorMsg: '',
      errorLogs: [],
    };
    this.invokeView = invokeView;
    this.fileService = fileService;
    this.lambdaToInvoke = {};
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
      const localLambdaInformation = this.fileService.collectLocalLambdaInformation(
        lambdaFunctions,
      );
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
      this.invokeView.printError(error.message || error.error.errorMsg);
    }
  }

  private async invokeRemote() {
    const faasService = await factory.get();
    const [currentLambda] = (await faasService.getLambdasByNames([
      this.lambdaToInvoke.name,
    ])) as any;

    /* istanbul ignore next */
    if (!currentLambda) {
      throw new Error(
        `Function ${this.lambdaToInvoke.name} were not found on the platform.
Please make sure the function with the name ${this.lambdaToInvoke.name} was pushed to the LivePerson Functions platform`,
      );
    }

    const response = await faasService.invoke(
      currentLambda.uuid,
      this.lambdaToInvoke.input,
    );
    this.invokeView.printConsoleLogs(response);
  }
}
