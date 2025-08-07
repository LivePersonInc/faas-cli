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
          const response = await faasService.deploy(entry.uuid);

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
    timeoutMs = 2000000,
    intervalMs = 3000,
  ): Promise<void> {
    const startTime = Date.now();

    return new Promise<void>((resolve, reject) => {
      const poll = async () => {
        try {
          const isDeployed = await this.checkIfLambdaIsDeployed(
            faasService,
            uuid,
          );

          if (isDeployed) {
            resolve();
            return;
          }

          const elapsed = Date.now() - startTime;
          if (elapsed >= timeoutMs) {
            reject(
              new Error(
                `Deployment timeout after ${timeoutMs}ms for function ${uuid}`,
              ),
            );
            return;
          }

          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
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
    const message = `Do you want to approve and deploy?

    AccountId:              ${this.chalk.green(lambda.accountId)}
    Description:            ${lambda.description}
    UUID:                   ${lambda.uuid}
    Event:                  ${lambda.event || 'No Event'}
    Last modified by:       ${lambda.updatedBy}
    Last modified at:       ${formatDate(lambda.updatedAt)}
    `;
    return message;
  }
}
