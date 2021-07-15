import { PrettyPrintableError } from '@oclif/errors';
import { CLIErrorCodes } from '../shared/errorCodes';
import { FileService } from '../service/file.service';
import { factory } from '../service/faasFactory.service';
import { LogsView } from '../view/logs.view';
import { InitController } from './init.controller';

interface ILogsConfig {
  lambdaFunction: string;
  inputFlags: {
    start?: number;
    end?: number;
    levels?: string[];
    removeHeader?: boolean;
  };
}

interface ILogsControllerConfig {
  logsView?: LogsView;
  fileService?: FileService;
  initController?: InitController;
}

export class LogsController {
  private logsView: LogsView;

  private fileService: FileService;

  private lambdaToGetLogsFrom: any;

  private initController: InitController;

  constructor({
    logsView = new LogsView(),
    fileService = new FileService(),
    initController = new InitController(),
  }: ILogsControllerConfig = {}) {
    this.logsView = logsView;
    this.fileService = fileService;
    this.lambdaToGetLogsFrom = {};
    this.initController = initController;
  }

  /**
   * Invokes the passed function remote or local depending on the --local flag.
   * @param {IInvokeConfig} - lambda function and flags
   * @returns {Promise<void>} - invocation local or remote
   * @memberof InvokeController
   */
  public async getLogs({
    lambdaFunction,
    inputFlags,
  }: ILogsConfig): Promise<void> {
    try {
      const localLambdaInformation = this.fileService.collectLocalLambdaInformation(
        [lambdaFunction],
      );
      [this.lambdaToGetLogsFrom] = localLambdaInformation;

      const faasService = await factory.get();
      const [currentLambda] = (await faasService.getLambdasByNames([
        this.lambdaToGetLogsFrom.name,
      ])) as any;

      /* istanbul ignore next */
      if (!currentLambda) {
        const prettyError: PrettyPrintableError = {
          message: `Function ${this.lambdaToGetLogsFrom.name} were not found on the platform. Please make sure the function with the name ${this.lambdaToGetLogsFrom.name} was pushed to the LivePerson Functions platform`,
          suggestions: [
            'Use "lpf push exampleFunction" to push and "lpf deploy exampleFunction" to deploy a function',
          ],
          ref: 'https://github.com/LivePersonInc/faas-cli#invoke',
          code: CLIErrorCodes.NoLambdasFound,
        };
        this.logsView.showErrorMessage(prettyError);
        throw new Error('exit');
      }
      await faasService.getLogs({
        uuid: currentLambda.uuid,
        ...inputFlags,
      });
    } catch (error) {
      this.logsView.showErrorMessage(error.message || error.errorMsg);
    }
  }
}
