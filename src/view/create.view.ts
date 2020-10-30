import {
  LogMessage,
  ErrorMessage,
  chalk as chalkDefault,
  Prompt,
} from './printer';
import { IFunctionConfig } from '../service/defaultStructure.service';
import { IPromptAnswer } from './printer/prompt';
import {
  validateFunctionName,
  validateFunctionDescription,
} from '../shared/utils';

interface ICreateViewConfig {
  log?: LogMessage;
  error?: ErrorMessage;
  chalk?: any;
  prompt?: any;
}

export class CreateView {
  private log: LogMessage;

  private error: ErrorMessage;

  private chalk: any;

  private prompt: Prompt;

  constructor({
    log = new LogMessage(),
    error = new ErrorMessage(),
    chalk = chalkDefault,
    prompt = new Prompt(),
  }: ICreateViewConfig = {}) {
    this.log = log;
    this.error = error;
    this.chalk = chalk;
    this.prompt = prompt;
  }

  /**
   * Show when a function has been created
   * @memberof CreateView
   * @param functionParameters
   */
  public showFunctionIsCreated(functionParameters: IFunctionConfig): void {
    this.log.print(
      `The function "${this.chalk.green(
        functionParameters.name,
      )}" has been created`,
    );
  }

  /**
   * Shows an error message
   * @param {string} message - message
   * @memberof CreateView
   */
  public showErrorMessage(message: string): void {
    this.error.print(message);
  }

  /**
   * Shows a message
   * @param {string} message - message
   * @memberof CreateView
   */
  public showMessage(message: string): void {
    this.log.print(message);
  }

  public async askForFunctionName(): Promise<IPromptAnswer[]> {
    this.prompt.addQuestion({
      name: 'name',
      type: 'Input',
      validate: async (value) => validateFunctionName(value),
      message: 'Name',
    });
    return this.prompt.run();
  }

  public async askForFunctionDescription(): Promise<IPromptAnswer[]> {
    this.prompt.addQuestion({
      name: 'description',
      type: 'Input',
      validate: async (value) => validateFunctionDescription(value),
      message: 'Description',
    });
    return this.prompt.run();
  }

  public async askForEventID(eventIDs?: any[]): Promise<IPromptAnswer[]> {
    if (eventIDs) {
      this.prompt.addQuestion({
        name: 'eventId',
        type: 'list',
        message: 'Choose an eventId',
        choices: eventIDs,
      });
    } else {
      this.prompt.addQuestion({
        name: 'eventId',
        type: 'Input',
        default: 'No Event',
        message: 'Event ID',
      });
    }

    return this.prompt.run();
  }
}
