import { LogMessage, ErrorMessage, chalk as chalkDefault } from './printer';
import { IFunctionConfig } from '../service/defaultStructure.service';

interface ICreateViewConfig {
  log?: LogMessage;
  error?: ErrorMessage;
  chalk?: any;
}

export class CreateView {
  private log: LogMessage;

  private error: ErrorMessage;

  private chalk: any;

  constructor({
    log = new LogMessage(),
    error = new ErrorMessage(),
    chalk = chalkDefault,
  }: ICreateViewConfig = {}) {
    this.log = log;
    this.error = error;
    this.chalk = chalk;
  }
  /**
   * Show when a function has been created
   * @memberof CreateView
   * @param functionParameters
   */
  public showFunctionIsCreated(functionParameters: IFunctionConfig): void {
    this.log.print(`The function "${this.chalk.green(functionParameters.name)}" has been created`);
  }

  /**
   * Shows an error message
   * @param {string} message - message
   * @memberof CreateView
   */
  public showErrorMessage(message: string): void {
    this.error.print(message);
  }
}
