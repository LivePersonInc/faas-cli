import { PrettyPrintableError } from '@oclif/errors';
import { CLIErrorCodes } from '../shared/errorCodes';
import { factory } from '../service/faasFactory.service';

interface ILogsConfig {
  lambdaFunction: string;
  inputFlags?: {
    start?: string;
    end?: string;
    levels?: string[];
    removeHeader?: boolean;
  };
}

export class LogsController {
  /**
   * Gets the logs of the passed function
   * @param {ILogsConfig} - lambda function and flags
   * @returns {Promise<void>}
   * @memberof LogsController
   */
  public static async getLogs({
    lambdaFunction,
    inputFlags,
  }: ILogsConfig): Promise<void> {
    const faasService = await factory.get();
    const [currentLambda] = (await faasService.getLambdasByNames([
      lambdaFunction,
    ])) as any;
    /* istanbul ignore next */
    if (!currentLambda) {
      const prettyError: PrettyPrintableError = {
        message: `Function ${lambdaFunction} were not found on the platform. Please make sure the function with the name ${lambdaFunction} was pushed to the LivePerson Functions platform`,
        suggestions: [
          'Use "lpf push exampleFunction" to push and "lpf deploy exampleFunction" to deploy a function',
        ],
        ref: 'https://github.com/LivePersonInc/faas-cli#invoke',
        code: CLIErrorCodes.NoLambdasFound,
      };
      throw prettyError;
    }
    await faasService.getLogs({
      uuid: currentLambda.uuid,
      ...inputFlags,
    });
  }
}
