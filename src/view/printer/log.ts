export class LogMessage {
  /**
   * Prints a console.log
   * @param {*} [message] - message
   * @param {...any[]} optionalParams - optionalParams
   * @memberof LogMessage
   */
  // eslint-disable-next-line class-methods-use-this
  public print(message?: any, ...optionalParams: any[]): void {
    // eslint-disable-next-line no-console
    console.log(message, ...optionalParams);
  }
}
