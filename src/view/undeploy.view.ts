/* eslint-disable no-shadow */
/* eslint-disable no-async-promise-executor */
// tslint:disable:no-shadowed-variable
import { Answers } from 'inquirer';
import {
  clearIntervalAsync,
  setIntervalAsync,
} from 'set-interval-async/dynamic';
import { factory } from '../service/faasFactory.service';
import { ILambda } from '../types';
import {
  chalk as chalkDefault,
  ErrorMessage,
  LogMessage,
  TaskList,
} from './printer';
import { Prompt } from './printer/prompt';

interface IUndeployViewConfig {
  prompt?: Prompt;
  log?: LogMessage;
  error?: ErrorMessage;
  tasklist?: TaskList;
  chalk?: any;
}

export class UndeployView {
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
  }: IUndeployViewConfig = {}) {
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
   * @memberof UndeployView
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
   * Runs a tasklist with all functions to undeploy.
   * Checks every 3sec if the undeployment is finished.
   * @param {ILambda[]} confirmedFunctionsToUndeploy - Functions to undeploy
   * @param {boolean} [noWatch] - Changes the renderer of the tasklist, so no rendering is displayed in the console
   * @returns
   * @memberof UndeployView
   */
  public async showDeployments({
    confirmedFunctionsToUndeploy,
    noWatch = false,
  }: {
    confirmedFunctionsToUndeploy: ILambda[];
    noWatch?: boolean;
  }) {
    if (noWatch) {
      this.tasklist = new TaskList({ renderer: 'silent', concurrent: true });
    } else {
      this.log.print('\nUndeploying following functions:\n');
    }
    confirmedFunctionsToUndeploy.forEach(async (entry: any) => {
      this.tasklist.addTask({
        title: `Undeploying ${entry.name}`,
        // eslint-disable-next-line consistent-return
        task: async (_ctx, task) => {
          const faasService = await factory.get();
          const response = await faasService.undeploy(entry.uuid);
          if (response.uuid) {
            return task.skip(`${response.message} (${entry.uuid})`);
          }
          if (!noWatch) {
            return new Promise(async (resolve) => {
              // eslint-disable-next-line unicorn/consistent-function-scoping
              function waitUntilLambdaIsUndeployed(): Promise<boolean> {
                return new Promise(async (resolve) => {
                  const lambdaInformation = await faasService.getLambdaByUUID(
                    entry.uuid,
                  );
                  if (lambdaInformation.state === 'Draft') {
                    resolve(true);
                  } else {
                    resolve(false);
                  }
                });
              }

              function watchUndeployment(): Promise<any> {
                let deployed = false;
                return new Promise((resolve) => {
                  const timer = setIntervalAsync(async () => {
                    deployed = await waitUntilLambdaIsUndeployed();
                    /* istanbul ignore else */
                    if (deployed) {
                      await clearIntervalAsync(timer);
                      resolve();
                    }
                  }, 3000);
                });
              }

              watchUndeployment().then(() => resolve());
            });
          }
        },
      });
    });

    return this.tasklist.run();
  }

  public showErrorMessage(error: string) {
    this.error.print(error);
  }

  private preparePromptMessage(lambda: any) {
    const message = `Do you really want to undeploy the function ${this.chalk.yellow(
      lambda.name,
    )} for Account ${this.chalk.green(lambda.accountId)}?
  Once you confirm, the function will be undeployed within a few moments.

  ${this.chalk.red('Caution')} You cannot undo this action!

    `;
    return message;
  }
}
