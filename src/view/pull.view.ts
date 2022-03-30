import { Answers } from 'inquirer';
import { PrettyPrintableError } from '@oclif/errors/lib/errors/pretty-print';
import {
  LogMessage,
  ErrorMessage,
  TaskList,
  Prompt,
  chalk as chalkDefault,
} from './printer';
import { ILambda } from '../types';
import { DefaultStructureService } from '../service/defaultStructure.service';
import { FileService } from '../service/file.service';

interface IPullViewConfig {
  prompt?: Prompt;
  log?: LogMessage;
  error?: ErrorMessage;
  tasklist?: TaskList;
  chalk?: any;
  fileService?: FileService;
  defaultStructureService?: DefaultStructureService;
}
export class PullView {
  private readonly prompt: Prompt;

  private readonly log: LogMessage;

  private readonly error: ErrorMessage;

  private tasklist: TaskList;

  private readonly chalk: any;

  private readonly fileService: FileService;

  private readonly defaultStructureService: DefaultStructureService;

  constructor(
    /* istanbul ignore next */ {
      prompt = new Prompt(),
      log = new LogMessage(),
      error = new ErrorMessage(),
      tasklist = new TaskList({ concurrent: true }),
      fileService = new FileService(),
      defaultStructureService = new DefaultStructureService(),
      chalk = chalkDefault,
    }: IPullViewConfig = {},
  ) {
    this.prompt = prompt;
    this.log = log;
    this.error = error;
    this.tasklist = tasklist;
    this.chalk = chalk;
    this.fileService = fileService;
    this.defaultStructureService = defaultStructureService;
  }

  /**
   * Ask for confirmation the passed functions
   * @param {ILambda[]} lambdas - lambdas
   * @param {string} accountId - accountId
   * @returns {Promise<Answers>}
   * @memberof PullView
   */
  public async askForConfirmation(
    lambdas: ILambda[],
    accountId: string,
  ): Promise<Answers> {
    for (const lambda of lambdas) {
      this.prompt.addQuestion({
        name: `${lambda.name}`,
        type: 'confirm',
        message: this.preparePromptMessage(lambda, accountId),
      });
    }

    return this.prompt.run();
  }

  /**
   * Pulls functions from the platform to the local machine
   * @param {*} confirmedLambdasToPull - confirmed lambdas to pull
   * @param {boolean} [noWatch] - Changes the renderer of the tasklist, so no rendering is displayed in the console
   * @returns {Promise<void>}
   * @memberof PullView
   */
  public async showPullProcess({
    confirmedLambdasToPull,
    noWatch = false,
  }: {
    confirmedLambdasToPull: any;
    noWatch?: boolean;
  }): Promise<void> {
    if (noWatch) {
      this.tasklist = new TaskList({ renderer: 'silent', concurrent: true });
    } else {
      this.log.print('\nPulling following functions:\n');
    }

    for (const lambda of confirmedLambdasToPull) {
      this.tasklist.addTask({
        title: `Pulling ${lambda.name}`,
        task: async () => {
          this.defaultStructureService.createFunctionsFolder(lambda.name, true);
          this.fileService.write(
            `${this.fileService.getRoot()}/functions/${
              lambda.name
            }/config.json`,
            {
              name: lambda.name,
              event: lambda.eventId || 'No Event',
              description: lambda.description,
              input: lambda.samplePayload || {
                headers: [],
                payload: {},
              },
              environmentVariables:
                lambda.implementation.environmentVariables.length > 0
                  ? lambda.implementation.environmentVariables
                  : [
                      {
                        key: '',
                        value: '',
                      },
                    ],
            },
          );
          this.fileService.write(
            `${this.fileService.getRoot()}/functions/${lambda.name}/index.js`,
            lambda.implementation.code,
            false,
          );
        },
      });
    }

    await this.tasklist.run();
  }

  /**
   * Shows an error message
   * @param {string|PrettyPrintableError} message - message
   * @memberof PullView
   */
  public showErrorMessage(message: string | PrettyPrintableError): void {
    this.error.print(message);
  }

  private preparePromptMessage(lambda: any, accountId: string) {
    const message = `Do you want to pull the ${this.chalk.yellow(lambda.name)}?
  ${this.chalk.red('Caution: Local files will be overwritten!')}

    AccountId:              ${this.chalk.green(accountId)}
    Description:            ${lambda.description}
    UUID:                   ${lambda.uuid}
    Event:                  ${lambda.event || 'No Event'}

    `;
    return message;
  }
}
