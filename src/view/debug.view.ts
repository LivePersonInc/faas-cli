import { LogMessage, ErrorMessage, chalk as chalkDefault } from './printer';

interface IDebugViewConfig {
  log?: LogMessage;
  error?: ErrorMessage;

  chalk?: any;
}
export class DebugView {
  private log: LogMessage;

  private error: ErrorMessage;

  private chalk: any;

  constructor({
    log = new LogMessage(),
    error = new ErrorMessage(),
    chalk = chalkDefault,
  }: IDebugViewConfig = {}) {
    this.log = log;
    this.error = error;
    this.chalk = chalk;
  }

  /**
   * Shows an hint that the debugger is running
   * @memberof DebugView
   */
  public showDebuggerIsRunning(port: number): void {
    this.log.print(this.chalk.green(`Debugger is running on port ${port}`));
  }

  /**
   * Shows an error message
   * @param {string} message - message
   * @memberof DebugView
   */
  public showErrorMessage(message: string): void {
    this.error.print(message);
  }
}
