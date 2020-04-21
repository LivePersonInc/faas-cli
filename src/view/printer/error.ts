import * as chalkDefault from 'chalk';

export class ErrorMessage {
  private chalk: any;

  constructor(chalk: any = chalkDefault) {
    this.chalk = chalk;
  }

  /**
   * Prints an error message with bold and red
   * @param {string} message - message
   * @param {...any[]} optionalParams - optionalParams
   * @memberof ErrorMessage
   */
  public print(message: string, ...optionalParams: any[]): void {
    const errorMessage = this.chalk.red.bold(message);
    // eslint-disable-next-line no-console
    console.log(errorMessage, ...optionalParams);
  }
}
