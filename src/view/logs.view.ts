import { PrettyPrintableError } from '@oclif/errors/lib/errors/pretty-print';
import { LogMessage, ErrorMessage, chalk as chalkDefault } from './printer';

export class LogsView {
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
   * Shows an error message
   * @param {string|PrettyPrintableError} message - message
   * @memberof InvokeView
   */
  public showErrorMessage(message: string | PrettyPrintableError): void {
    this.error.print(message);
  }
}
