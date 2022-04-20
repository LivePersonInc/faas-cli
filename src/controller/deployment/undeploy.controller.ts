import { Answers } from 'inquirer';
import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { ILambda } from '../../types';
import { UndeployView } from '../../view/undeploy.view';
import { DeploymentController } from './deployment.controller';
import { FileService } from '../../service/file.service';

interface IUndeployControllerConfig {
  undeployView?: UndeployView;
  fileService?: FileService;
}

interface IUndeployConfig {
  lambdaFunctions: string[];
  inputFlags?: { yes?: boolean; ['no-watch']?: boolean };
}

export class UndeployController extends DeploymentController {
  private readonly undeployView: UndeployView;

  constructor({
    undeployView = new UndeployView(),
    fileService = new FileService(),
  }: IUndeployControllerConfig = {}) {
    super(fileService);
    this.undeployView = undeployView;
  }

  /**
   * Gather informations about the passed functions depending on the flags and
   * starts the undeploy process.
   * @param {IUndeployConfig} { lambdaFunctions, inputFlags }
   * @returns {Promise<void>} - deploy view, which runs the deploy requests
   * @memberof UndeployController
   */
  public async undeploy({
    lambdaFunctions,
    inputFlags,
  }: IUndeployConfig): Promise<void> {
    try {
      const functionsToUndeploy: ILambda[] =
        await this.collectLambdaInformationForAllLambdas(lambdaFunctions);

      let confirmedFunctionsToUndeploy: ILambda[] = [];
      if (inputFlags?.yes) {
        confirmedFunctionsToUndeploy = functionsToUndeploy;
      } else {
        const answer: Answers = await this.undeployView.askForConfirmation(
          functionsToUndeploy,
        );
        confirmedFunctionsToUndeploy = functionsToUndeploy.filter(
          (entry: ILambda) => answer[entry.name],
        );

        /* istanbul ignore else */
        if (confirmedFunctionsToUndeploy.length === 0) {
          return;
        }
      }

      await this.undeployView.showDeployments({
        confirmedFunctionsToUndeploy,
        noWatch: inputFlags?.['no-watch'],
      });
    } catch (error) {
      const prettyError: PrettyPrintableError = {
        message: error.message || error.errorMsg,
        suggestions: ['Use "lpf undeploy --help" for more information'],
        ref: 'https://github.com/LivePersonInc/faas-cli#undeploy',
      };
      this.undeployView.showErrorMessage(prettyError);
      throw new Error('exit');
    }
  }
}
