/* eslint-disable no-console, unicorn/import-style */
import * as chalkDefault from 'chalk';
import { PrettyPrintableError } from '@oclif/errors';

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
  public print(
    message: string | PrettyPrintableError,
    ...optionalParams: any[]
  ): void {
    if (ErrorMessage.isPrettyError(message)) {
      this.printPretty(message as PrettyPrintableError);
    } else {
      const errorMessage = this.chalk.red.bold(message);
      console.log(errorMessage, ...optionalParams);
    }
  }

  private printPretty(
    { code, ref, message, suggestions }: PrettyPrintableError,
    ...optionalParams
  ) {
    if (message) {
      const coloredMessage = this.chalk.red.bold(message);
      console.log(`Error: ${coloredMessage}`, ...optionalParams);
    }

    if (code) {
      console.log(`Code: ${code}`, ...optionalParams);
    }

    if (suggestions) {
      for (const suggestion of suggestions) {
        console.log(`Try this: ${suggestion}`, ...optionalParams);
      }
    }

    if (ref) {
      console.log(`Reference: ${ref}`, ...optionalParams);
    }
  }

  static isPrettyError(error: any): error is PrettyPrintableError {
    return typeof error === 'object';
  }
}
