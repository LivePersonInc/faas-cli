const chalkDefault = require('chalk');

export class WarnMessage {
  private chalk: any;

  constructor(chalk: any = chalkDefault) {
    this.chalk = chalk;
  }

  /**
   * Returns a warn message with yellow and bold
   * @param {*} [message] - message
   * @param {...any[]} optionalParams - optionalParams
   * @memberof WarnMessage
   */
  public print(message?: any, ...optionalParams: any[]): void {
    const warningMessage = this.chalk.yellow.bold(message);
    // eslint-disable-next-line no-console
    console.log(warningMessage, ...optionalParams);
  }
}
