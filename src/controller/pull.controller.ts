// import { PrettyPrintableError } from '@oclif/errors';
// import { CLIErrorCodes } from '../shared/errorCodes';
import { PullView } from '../view/pull.view';
import { factory } from '../service/faasFactory.service';
import { ILambda } from '../types';
import { FileService } from '../service/file.service';

interface IPullControllerConfig {
  pullView?: PullView;
  fileService?: FileService;
}

interface IPullConfig {
  lambdaFunctions: string[];
  inputFlags?: { yes?: boolean; ['no-watch']?: boolean; all?: boolean };
}

export class PullController {
  private pullView: PullView;

  private fileService: FileService;

  constructor(
    /* istanbul ignore next */ {
      pullView = new PullView(),
      fileService = new FileService(),
    }: IPullControllerConfig = {},
  ) {
    this.pullView = pullView;
    this.fileService = fileService;
  }

  /**
   * Pulls the passed functions from the platform
   * @param {IPullConfig} { lambdaFunctions, inputFlags } - passed functions and flags
   * @returns {Promise<void>} - pull view
   * @memberof PullController
   */
  public async pull({
    lambdaFunctions,
    inputFlags,
  }: IPullConfig): Promise<void> {
    try {
      const faasService = await factory.get();

      if (lambdaFunctions.length === 0 && !inputFlags?.all) {
        lambdaFunctions = [this.fileService.getFunctionFolderName()];
      }

      const lambdasToPull = inputFlags?.all
        ? await faasService.getAllLambdas()
        : ((await faasService.getLambdasByNames(lambdaFunctions)) as ILambda[]);

      let confirmedLambdasToPull: ILambda[] = [];
      if (inputFlags?.yes) {
        confirmedLambdasToPull = lambdasToPull;
      } else {
        const answer = await this.pullView.askForConfirmation(
          lambdasToPull,
          faasService.accountId as string,
        );
        confirmedLambdasToPull = lambdasToPull.filter(
          (entry: ILambda) => answer[entry.name],
        );

        /* istanbul ignore else */
        if (confirmedLambdasToPull.length === 0) {
          return;
        }
      }

      await this.pullView.showPullProcess({
        confirmedLambdasToPull,
        noWatch: inputFlags?.['no-watch'],
      });
    } catch (error) {
      this.pullView.showErrorMessage(error.message || error.errorMsg);
      // const prettyError: PrettyPrintableError = {
      //   message: error.message || error.errorMsg,
      //   ref: 'https://github.com/LivePersonInc/faas-cli#pull',
      //   code: CLIErrorCodes.FailedToPull,
      // };
      // throw prettyError;
    }
  }
}
