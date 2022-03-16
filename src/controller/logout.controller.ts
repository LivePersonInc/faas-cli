import { LogoutView } from '../view/logout.view';
import { FileService } from '../service/file.service';
import { ITempFile } from './login.controller';
import { IPromptAnswer } from '../view/printer/prompt';

interface ILoginFlags {
  accountId?: string;
  delete?: boolean;
}

interface ILogoutControllerConfig {
  logoutView?: LogoutView;
  fileService?: FileService;
}

export class LogoutController {
  private logoutView: LogoutView;

  private tempFile: ITempFile;

  private fileService: FileService;

  constructor({
    logoutView = new LogoutView(),
    fileService = new FileService(),
  }: ILogoutControllerConfig = {}) {
    this.logoutView = logoutView;
    this.fileService = fileService;
    this.tempFile = {};
  }

  /**
   * Performs the logout with the passed flags.
   * @param {ILoginFlags} - passed flags
   * @returns {Promise<void>} - logout view
   * @memberof LogoutController
   */
  public async logout(inputFlags: ILoginFlags = {}): Promise<void> {
    this.tempFile = await this.fileService.getTempFile();

    if (!this.tempFile) {
      this.logoutView.showNoAccountAvailableInfo();
      return;
    }

    const accountIds = Object.keys(this.tempFile);

    let selectedAccountId: string;
    if (inputFlags.accountId) {
      selectedAccountId = inputFlags.accountId;
    } else {
      const answer: IPromptAnswer =
        await this.logoutView.showAccountIdSelection(
          accountIds,
          inputFlags.delete,
        );
      selectedAccountId = answer.accountId;
    }

    if (inputFlags.delete) {
      delete this.tempFile[selectedAccountId];
      if (Object.keys(this.tempFile).length === 0) {
        this.fileService.deleteTempFile();
      } else {
        await this.fileService.writeTempFile({
          ...this.tempFile,
        });
      }
      this.logoutView.showDeleteSuccessMessage();
    } else {
      await this.fileService.writeTempFile({
        ...this.tempFile,
        [selectedAccountId]: {
          ...this.tempFile[selectedAccountId],
          token: null,
          csrf: null,
          sessionId: null,
        },
      });
      this.logoutView.showLogoutSuccessMessage();
    }
  }
}
