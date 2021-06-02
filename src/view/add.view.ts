import { PrettyPrintableError } from '@oclif/errors';
import { LogMessage, ErrorMessage, chalk as chalkDefault } from './printer';

interface IAddViewConfig {
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
  }: IAddViewConfig = {}) {
    this.log = log;
    this.error = error;
    this.chalk = chalk;
  }

  /**
   * Shows an error message
   * @param {string|PrettyPrintableError} message - message
   * @memberof AddView
   */
  public showErrorMessage(message: string | PrettyPrintableError): void {
    this.error.print(message);
  }

  /**
   * Shows a message
   * @param {string} message - message
   * @memberof AddView
   */
  public showMessage(message: string): void {
    this.log.print(message);
  }

  /**
   * Shows a message
   * @param {string} message - message
   * @memberof AddView
   */
  public showDomainAdded(domain: string): void {
    this.log.print(
      `Domain ${this.chalk.green(
        domain,
      )} was added to your account successfully.`,
    );
  }
}
