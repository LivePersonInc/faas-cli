import { Answers } from 'inquirer';
import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { ILambda } from '../../types';
import { DeployView } from '../../view/deploy.view';
import { DeploymentController } from './deployment.controller';
import { FileService } from '../../service/file.service';

interface IDeployControllerConfig {
  deployView?: DeployView;
  fileService?: FileService;
}

interface IDeployConfig {
  lambdaFunctions: string[];
  inputFlags?: { yes?: boolean; ['no-watch']?: boolean };
}

export class DeployController extends DeploymentController {
  private readonly deployView: DeployView;

  constructor({
    deployView = new DeployView(),
    fileService = new FileService(),
  }: IDeployControllerConfig = {}) {
    super(fileService);
    this.deployView = deployView;
  }

  /**
   * Gather informations about the passed functions depending on the flags and
   * starts the deploy process.
   * @param {IDeployConfig} { lambdaFunctions, inputFlags }
   * @returns {Promise<void>} - deploy view, which runs the deploy requests
   * @memberof DeployController
   */
  public async deploy({
    lambdaFunctions,
    inputFlags,
  }: IDeployConfig): Promise<void> {
    try {
      const functionsToDeploy: ILambda[] =
        await this.collectLambdaInformationForAllLambdas(lambdaFunctions);

      let confirmedFunctionsToDeploy: ILambda[] = [];
      if (inputFlags?.yes) {
        confirmedFunctionsToDeploy = functionsToDeploy;
      } else {
        const answer: Answers = await this.deployView.askForConfirmation(
          functionsToDeploy,
        );
        confirmedFunctionsToDeploy = functionsToDeploy.filter(
          (entry: ILambda) => answer[entry.name],
        );

        /* istanbul ignore else */
        if (confirmedFunctionsToDeploy.length === 0) {
          return;
        }
      }

      await this.deployView.showDeployments({
        confirmedFunctionsToDeploy,
        noWatch: inputFlags?.['no-watch'],
      });
    } catch (error) {
      const prettyError: PrettyPrintableError = {
        message: error.message || error.errorMsg,
        suggestions: ['Use "lpf deploy --help" for more information'],
        ref: 'https://github.com/LivePersonInc/faas-cli#deploy',
      };
      this.deployView.showErrorMessage(prettyError);
      throw new Error('exit');
    }
  }
}
