import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { CLIErrorCodes } from '../shared/errorCodes';
import { PullView } from '../view/pull.view';
import { factory } from '../service/faasFactory.service';
import { IFunction } from '../types';
import { FileService } from '../service/file.service';
import { LPFunction } from '../types/IFunction';

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
    lambdaFunctions: functionNames,
    inputFlags,
  }: IPullConfig): Promise<void> {
    try {
      const faasService = await factory.get();

      if (functionNames.length === 0 && !inputFlags?.all) {
        functionNames = [this.fileService.getFunctionFolderName()];
      }

      const lambdasToPull = inputFlags?.all
        ? await faasService.getAllFunctions()
        : await faasService.getLambdasByNames(functionNames);
      let confirmedLambdasToPull: LPFunction[] = [];
      if (inputFlags?.yes) {
        confirmedLambdasToPull = lambdasToPull;
      } else {
        const answer = await this.pullView.askForConfirmation(
          lambdasToPull,
          faasService.accountId as string,
        );
        confirmedLambdasToPull = lambdasToPull.filter(
          (entry: IFunction) => answer[entry.name],
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
      const prettyError: PrettyPrintableError = {
        message: error.message || error.errorMsg,
        ref: 'https://github.com/LivePersonInc/faas-cli#pull',
        code: CLIErrorCodes.FailedToPull,
      };
      this.pullView.showErrorMessage(prettyError);
    }
  }
}
