/* eslint-disable no-async-promise-executor */
/* eslint-disable no-shadow */
import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { Answers } from 'inquirer';
import {
  clearIntervalAsync,
  setIntervalAsync,
} from 'set-interval-async/dynamic';
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
    confirmedFunctionsToDeploy.forEach((entry: any) => {
      this.tasklist.addTask({
        title: `Deploying ${entry.name}`,
        // eslint-disable-next-line consistent-return
        task: async (_, task) => {
          const faasService = await factory.get();
          const response = await faasService.deploy(entry.uuid);
          if (response.uuid) {
            return task.skip(`${response.message} (${entry.uuid})`);
          }
          if (!noWatch) {
            return new Promise<void>(async (resolve) => {
              function checkIfLambdaIsDeployed(): Promise<boolean> {
                return new Promise(async (resolve) => {
                  const lambdaInformation =
                    (await faasService.getFunctionByUuid(entry.uuid)) as any;
                  if (
                    lambdaInformation.state === 'Productive' &&
                    lambdaInformation.lastDeployment.deployedAt
                  ) {
                    resolve(true);
                  } else {
                    resolve(false);
                  }
                });
              }

              function watchDeployment(): Promise<any> {
                let deployed = false;
                return new Promise<void>((resolve) => {
                  const timer = setIntervalAsync(async () => {
                    deployed = await checkIfLambdaIsDeployed();
                    /* istanbul ignore else */
                    if (deployed) {
                      // with the update to v2 the await clearIntervalAsync(timer) requires to be wrapped inside an immediately-invoke function expression or remove the await so that it resolves the timeout it causes because of not finishing the process
                      clearIntervalAsync(timer);
                      resolve();
                    }
                  }, 3000);
                });
              }

              watchDeployment().then(() => resolve());
            });
          }
        },
      });
    });

    return this.tasklist.run();
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
    Last deployed at:       ${
      lambda.lastDeployment?.createdAt
        ? formatDate(lambda.lastDeployment?.createdAt)
        : '-'
    }
    Runtime:                ${lambda.manifest.runtime}

    `;
    return message;
  }
}
