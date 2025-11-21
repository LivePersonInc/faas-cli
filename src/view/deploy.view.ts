/* eslint-disable no-async-promise-executor */
/* eslint-disable no-shadow */
import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { Answers } from 'inquirer';
import { factory } from '../service/faasFactory.service';
import { formatDate } from '../shared/utils';
import { IFunction } from '../types';
import {
  chalk as chalkDefault,
  ErrorMessage,
  LogMessage,
  TaskList,
} from './printer';
import { Prompt } from './printer/prompt';

interface IDeployViewConfig {
  prompt?: Prompt;
  log?: LogMessage;
  error?: ErrorMessage;
  tasklist?: TaskList;
  chalk?: any;
}

export class DeployView {
  private readonly prompt: Prompt;

  private readonly log: LogMessage;

  private readonly error: ErrorMessage;

  private tasklist: TaskList;

  private readonly chalk: any;

  constructor({
    prompt = new Prompt(),
    log = new LogMessage(),
    error = new ErrorMessage(),
    tasklist = new TaskList({ concurrent: true }),
    chalk = chalkDefault,
  }: IDeployViewConfig = {}) {
    this.prompt = prompt;
    this.log = log;
    this.error = error;
    this.tasklist = tasklist;
    this.chalk = chalk;
  }

  /**
   * Runs a prompt and asks the user for confirmation about the passed lambdas
   * @param {*} lambdas - lambda functions
   * @returns {Promise<Answers>} - prompt answers
   * @memberof DeployView
   */
  public async askForConfirmation(lambdas: any): Promise<Answers> {
    lambdas.forEach((lambda: any) => {
      this.prompt.addQuestion({
        name: `${lambda.name}`,
        type: 'confirm',
        message: this.preparePromptMessage(lambda),
      });
    });

    return this.prompt.run();
  }

  /**
   * Runs a tasklist with all functions to deploy.
   * Checks every 3sec if the deployment is finished.
   * @param {IFunction[]} confirmedFunctionsToDeploy - Functions to deploy
   * @param {boolean} [noWatch] - Changes the renderer of the tasklist, so no rendering is displayed in the console
   * @returns
   * @memberof DeployView
   */
  public async showDeployments({
    confirmedFunctionsToDeploy,
    noWatch = false,
  }: {
    confirmedFunctionsToDeploy: IFunction[];
    noWatch?: boolean;
  }): Promise<void> {
    if (noWatch) {
      this.tasklist = new TaskList({ renderer: 'silent', concurrent: true });
    } else {
      this.log.print('\nDeploying following functions:\n');
    }
    confirmedFunctionsToDeploy.forEach((entry: IFunction) => {
      this.tasklist.addTask({
        title: `Deploying ${entry.name}`,
        task: async (_, task) => {
          const faasService = await factory.get();
          let response;
          if (entry.state === 'Modified') {
            response = await faasService.redeploy(entry.uuid);
          } else {
            response = await faasService.deploy(entry.uuid);
          }

          if (response.uuid) {
            return task.skip(`${response.message} (${entry.uuid})`);
          }
          if (!noWatch) {
            return this.waitForDeployment(faasService, entry.uuid);
          }
          return task.skip('Unexpected end of deploying');
        },
      });
    });

    return this.tasklist.run();
  }

  private async checkIfLambdaIsDeployed(
    faasService: any,
    uuid: string,
  ): Promise<boolean> {
    const lambdaInformation = await faasService.getFunctionByUuid(uuid);
    return lambdaInformation?.state === 'Productive';
  }

  private async waitForDeployment(
    faasService: any,
    uuid: string,
    timeoutMs = 2_000_000,
    intervalMs = 3_000,
  ): Promise<boolean> {
    const start = Date.now();

    return new Promise<boolean>((resolve, reject) => {
      const poll = async (): Promise<boolean> => {
        try {
          const deployed = await this.checkIfLambdaIsDeployed(
            faasService,
            uuid,
          );

          if (deployed) {
            resolve(true);
            return true;
          }

          if (Date.now() - start >= timeoutMs) {
            reject(
              new Error(
                `Deployment timeout after ${timeoutMs}ms for function ${uuid}`,
              ),
            );
            return false;
          }

          setTimeout(poll, intervalMs);
          return false;
        } catch (err) {
          reject(
            new Error(
              `Error while checking deployment for ${uuid}: ${err.message}`,
            ),
          );
          return false;
        }
      };

      poll();
    });
  }

  /**
   * Shows an error message
   * @param {string|PrettyPrintableError} message - message
   * @memberof DeployView
   */
  public showErrorMessage(message: string | PrettyPrintableError): void {
    this.error.print(message);
  }

  private preparePromptMessage(lambda: any) {
    const message = `Do you want to approve and (re)deploy?
    AccountId:              ${this.chalk.green(lambda.accountId)}
    Description:            ${lambda.description}
    UUID:                   ${lambda.uuid}
    UUID:                   ${lambda.state}
    Event:                  ${lambda.event || 'No Event'}
    Last modified by:       ${lambda.updatedBy}
    Last modified at:       ${formatDate(lambda.updatedAt)}
    `;
    return message;
  }
}
