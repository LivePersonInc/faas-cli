import { Answers } from 'inquirer';
import { factory } from '../service/faasFactory.service';
import { ILambda } from '../types';
import {
  chalk as chalkDefault,
  emoji as emojiDefault,
  ErrorMessage,
  LogMessage,
  Prompt,
  TaskList,
} from './printer';

interface IPushViewConfig {
  emoji?: any;
  log?: LogMessage;
  chalk?: any;
  prompt?: Prompt;
  tasklist?: TaskList;
  error?: ErrorMessage;
}

export class PushView {
  private readonly prompt: Prompt;

  private readonly log: LogMessage;

  private readonly error: ErrorMessage;

  private tasklist: TaskList;

  private readonly chalk: any;

  private readonly emoji: any;

  constructor(
    /* istanbul ignore next */ {
      chalk = chalkDefault,
      log = new LogMessage(),
      error = new ErrorMessage(),
      tasklist = new TaskList({ exitOnError: false, concurrent: true }),
      prompt = new Prompt(),
      emoji = emojiDefault,
    }: IPushViewConfig = {},
  ) {
    this.emoji = emoji;
    this.log = log;
    this.chalk = chalk;
    this.prompt = prompt;
    this.tasklist = tasklist;
    this.error = error;
  }

  /**
   * Prints an Error Message
   * @param {string} error The Error message to print
   * @returns {void}
   * @memberof PushView
   */
  public showErrorMessage(error: string): void {
    return this.error.print(error);
  }

  /**
   * Prompts the user to confirm all of the lambdas he wants to push
   * @param {ILambda[]} lambdas Lambdas the user wants to push
   * @param {string} [accountId] The account ID to display in the prompt
   * @returns {Promise<Answers>}
   * @memberof PushView
   */
  public async askForConfirmation(
    lambdas: ILambda[],
    accountId?: string,
  ): Promise<Answers> {
    lambdas.forEach((lambda: ILambda) => {
      this.prompt.addQuestion({
        name: `${lambda.name}`,
        type: 'confirm',
        message: this.preparePromptMessage(lambda, accountId),
      });
    });

    return this.prompt.run();
  }

  /**
   * Creates and runs a Listr Task List. It creates one task for each request body
   * which triggers the push request for it. Depending on the noWatch param the
   * pushing is displayed or hidden in the console.
   * @param {{ pushRequestBodies: ILambda[]; noWatch?: boolean }} { pushRequestBodies, noWatch = false }
   * @memberof PushView
   */
  public async showPushProcess({
    pushRequestBodies,
    noWatch = false,
  }: {
    pushRequestBodies: ILambda[];
    noWatch?: boolean;
  }) {
    if (noWatch) {
      this.tasklist = new TaskList({
        exitOnError: false,
        concurrent: true,
        renderer: 'silent',
      });
    } else {
      this.log.print('\nPushing following functions:\n');
    }
    pushRequestBodies.forEach((entry: any) => {
      this.tasklist.addTask({
        title: `Pushing ${entry.name}`,
        task: async () => {
          if (!entry.description) {
            throw new Error(
              'Push Error: Lambda description can not be null. Please add a description in the config.json',
            );
          }
          // tslint:disable-next-line:no-shadowed-variable
          const faasService = await factory.get();
          const isNewLambda = entry.version === -1;
          await faasService.push({
            method: isNewLambda ? 'POST' : 'PUT',
            body: entry,
            ...(!isNewLambda && { uuid: entry.uuid }),
          });
        },
      });
    });
    await this.tasklist.run();
  }

  private preparePromptMessage(pushBody, accountId) {
    const message = `Do you want to approve and ${
      pushBody.version === -1
        ? this.chalk.green('create')
        : this.chalk.red('overwrite')
    } the following lambda?
${
  pushBody.version === -1
    ? ''
    : this.chalk.red('Caution: This action can NOT be reverted!\n')
}
  AccountId:              ${this.chalk.green(accountId)}
  Name:                   ${pushBody.name}
  Description:            ${pushBody.description}
  Event:                  ${pushBody.eventId || 'No Event'}
  Dependencies:           ${
    pushBody.implementation.dependencies.length > 0
      ? pushBody.implementation.dependencies.length
      : '-'
  }
  Environment variables:  ${
    pushBody.implementation.environmentVariables.length > 0
      ? pushBody.implementation.environmentVariables
      : '-'
  }

  `;
    return message;
  }
}
