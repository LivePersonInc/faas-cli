// tslint:disable:object-literal-shorthand
import {
  chalk as chalkDefault,
  emoji as emojiDefault,
  figlet,
  LogMessage,
  Prompt,
} from './printer';
import { IPromptAnswer } from './printer/prompt';

interface ILoginViewConfig {
  emoji?: any;
  log?: LogMessage;
  chalk?: any;
  prompt?: Prompt;
}

/**
 * Adds the condition if a prompt should be displayed or not.
 * Will be executed during runtime.
 * @param {*} condition - condition for execution.
 * @param {boolean} compareWithAnswer - should the condition compared with the answer.
 * @returns {{ when: (answer: { accountId: string }) => boolean }}
 */
function checkIfQuestionShouldBeDisplayed({
  condition,
  compareWithAnswer,
}: {
  condition: any;
  compareWithAnswer?: boolean;
}): { when: (answer: { accountId: string }) => boolean } {
  return {
    /* istanbul ignore next */
    when(answer: { accountId: string }): boolean {
      /* istanbul ignore next */
      return compareWithAnswer ? answer.accountId === condition : condition;
    },
  };
}

export class LoginView {
  private log: LogMessage;

  private emoji: any;

  private chalk: any;

  private prompt: Prompt;

  constructor({
    emoji = emojiDefault,
    log = new LogMessage(),
    chalk = chalkDefault,
    prompt = new Prompt(),
  }: ILoginViewConfig = {}) {
    this.log = log;
    this.emoji = emoji;
    this.chalk = chalk;
    this.prompt = prompt;
  }

  /**
   * Ask the user for selecting or enter an accountId
   * @param {string[]} accountIds - accountIds
   * @returns {Promise<IPromptAnswer[]>} - prompt answers
   * @memberof LoginView
   */
  public async chooseOrEnterAccountId(
    accountIds: string[],
  ): Promise<IPromptAnswer[]> {
    if (accountIds.length > 0) {
      this.prompt.addQuestion({
        name: 'accountId',
        type: 'list',
        message: 'Choose accountId or select other',
        choices: accountIds.concat(['other']),
      });
      this.prompt.addQuestion({
        name: 'other',
        type: 'Input',
        message: 'AccountId',
        ...checkIfQuestionShouldBeDisplayed({
          condition: 'other',
          compareWithAnswer: true,
        }),
      });
      const answer: any = await this.prompt.run();
      if (answer.accountId === 'other') {
        answer.accountId = answer.other;
      }
      return answer;
    }
    this.prompt.addQuestion({
      name: 'accountId',
      type: 'Input',
      message: 'AccountId',
    });
    return this.prompt.run();
  }

  /**
   * Asks the user for username and password
   * @param {string} username - username
   * @param {string} password - password
   * @param {string} accountId - accountId
   * @param {boolean} displayAccountId - should the account be displayed in the prompt
   * @returns {Promise<IPromptAnswer[]>}
   * @memberof LoginView
   */
  public async askForUsernameAndPassword({
    username,
    password,
  }: { username?: string; password?: string } = {}): Promise<IPromptAnswer[]> {
    this.askForuserName(!username);
    this.askForPassword(!password);

    return this.prompt.run();
  }

  /**
   * Shows the welcome banner
   * @param {boolean} showBanner - should show the welcome banner
   * @returns {void}
   * @memberof LoginView
   */
  public showWelcomeBanner(showBanner: boolean): void {
    /* istanbul ignore else */
    if (showBanner) {
      this.log.print('Welcome to');
      this.log.print(figlet.textSync('LP Functions v2'));
      this.log.print(
        `Use ${this.chalk.green('lpf help')} or ${this.chalk.green(
          'lpf <command> --help',
        )} for further informations.`,
      );
      this.log.print(
        `This is the ${this.chalk.green(
          'Functions V2 Alpha',
        )} Version of the CLI. ${this.chalk.red(
          'Only use if your account has been migrated!',
        )} !`,
      );
      this.log.print(
        `To downgrade back to use ${this.chalk.green(
          'npm install -g liveperson-functions-cli@1.31.3',
        )}`,
      );
      this.log.print(
        `If you want to use the legacy cli simultaneously try ${this.chalk.green(
          'sudo mv "$(which lpf)" "$(dirname $(which lpf))/lpf2"',
        )} and then reinstall the legacy cli ${this.chalk.green(
          'npm install -g liveperson-functions-cli@1.31.3',
        )}`,
      );
    }
  }

  /**
   * Show error message during login.
   * @returns {void}
   * @memberof LoginView
   */
  public errorDuringLogin(): void {
    this.log.print(
      `${this.emoji.red_circle} Looks like something went wrong during the login`,
    );
    this.log.print(
      `${
        this.emoji.red_circle
      } Check your credentials and try again ${this.chalk.green('lpf login')}`,
    );
  }

  private askForuserName(condition: boolean): void {
    this.prompt.addQuestion({
      name: 'username',
      type: 'input',
      message: 'username',
      ...checkIfQuestionShouldBeDisplayed({ condition }),
    });
  }

  private askForPassword(condition: boolean): void {
    this.prompt.addQuestion({
      name: 'password',
      type: 'password',
      message: 'password',
      ...checkIfQuestionShouldBeDisplayed({ condition }),
    });
  }
}
