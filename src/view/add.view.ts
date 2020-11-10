import { LogMessage, ErrorMessage, chalk as chalkDefault } from './printer';

interface ICreateViewConfig {
  log?: LogMessage;
  error?: ErrorMessage;
  chalk?: any;
  prompt?: any;
}

export class AddView {
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
   * Shows an error message
   * @param {string} message - message
   * @memberof CreateView
   */
  public showErrorMessage(message: string): void {
    this.error.print(message);
  }

  /**
   * Shows a message
   * @param {string} message - message
   * @memberof CreateView
   */
  public showMessage(message: string): void {
    this.log.print(message);
  }

  /**
   * Shows a message
   * @param {string} message - message
   * @memberof CreateView
   */
  public showDomainAdded(domain: string): void {
    this.log.print(
      `Domain ${this.chalk.green(
        domain,
      )} was added to your account successfully.`,
    );
  }
}
