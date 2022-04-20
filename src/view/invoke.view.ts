import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { LogMessage, ErrorMessage, chalk as chalkDefault } from './printer';

export class InvokeView {
  private log: LogMessage;

  private error: ErrorMessage;

  private chalk: any;

  constructor({
    log = new LogMessage(),
    error = new ErrorMessage(),
    chalk = chalkDefault,
  }: { log?: LogMessage; error?: ErrorMessage; chalk?: any } = {}) {
    this.log = log;
    this.error = error;
    this.chalk = chalk;
  }

  /**
   * Prints the console logs from the invoked function
   * @param {*} message - message
   * @returns {void}
   * @memberof InvokeView
   */
  public printConsoleLogs(message: any): void {
    this.log.print(JSON.stringify(message, null, 4));
  }

  /**
   * Shows an error message
   * @param {string|PrettyPrintableError} message - message
   * @memberof InvokeView
   */
  public showErrorMessage(message: string | PrettyPrintableError): void {
    this.error.print(message);
  }
}
