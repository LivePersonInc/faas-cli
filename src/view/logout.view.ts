import {
  LogMessage,
  Prompt,
  emoji as emojiDefault,
  WarnMessage,
} from './printer';
import { IPromptAnswer } from './printer/prompt';

interface ILogoutViewConfig {
  prompt?: Prompt;
  log?: LogMessage;
  emoji?: any;
  warn?: WarnMessage;
}
export class LogoutView {
  private prompt: Prompt;

  private log: LogMessage;

  private warn: WarnMessage;

  private emoji: any;

  constructor({
    prompt = new Prompt(),
    log = new LogMessage(),
    emoji = emojiDefault,
    warn = new WarnMessage(),
  }: ILogoutViewConfig = {}) {
    this.prompt = prompt;
    this.log = log;
    this.emoji = emoji;
    this.warn = warn;
  }

  /**
   * Show all deletable accountIds
   * @param {string[]} accountIds - accountIds
   * @param {boolean} [deletedFlag] - Print alternative text for accountId deletion
   * @returns {Promise<IPromptAnswer[]>}
   */
  public async showAccountIdSelection(
    accountIds: string[],
    deletedFlag?: boolean,
  ): Promise<IPromptAnswer[]> {
    const message = deletedFlag
      ? 'Please select the accountId, which should be deleted locally'
      : 'Please select the accountId, which should be logged out';
    this.prompt.addQuestion({
      name: 'accountId',
      type: 'list',
      message,
      choices: accountIds,
    });

    return this.prompt.run();
  }

  /**
   * Shows logout success message
   * @returns {void}
   * @memberof LogoutView
   */
  public showLogoutSuccessMessage(): void {
    this.log.print(`${this.emoji.white_check_mark} Logout successful`);
  }

  /**
   * Show deletion success message
   * @returns {void}
   * @memberof LogoutView
   */
  public showDeleteSuccessMessage(): void {
    this.log.print(
      `${this.emoji.white_check_mark} Account was successfully deleted locally`,
    );
  }

  /**
   * Shows no account available info
   * @returns {void}
   * @memberof LogoutView
   */
  public showNoAccountAvailableInfo(): void {
    this.warn.print('No accounts were found!');
  }
}
