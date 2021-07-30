import { FileService } from '../service/file.service';
import { ILoginResponse, LoginService } from '../service/login.service';
import { LoginView } from '../view/login.view';
import { IPromptAnswer } from '../view/printer/prompt';

export interface ILoginInformation {
  accountId: string;
  token: string;
  userId: string;
  username: string;
}

interface ILoginFlags {
  inputFlags?: {
    password?: string;
    accountId?: string;
    username?: string;
    token?: string;
    userId?: string;
  };
}

export interface ITempFile {
  [key: string]: {
    token: string;
    userId: string;
    username: string;
    active: boolean;
    csrf: string;
    sessionId: string;
  };
}

interface ILoginConfig {
  loginView?: LoginView;
  loginService?: LoginService;
  fileService?: FileService;
}

export class LoginController {
  private readonly loginView: LoginView;

  private readonly loginService: LoginService;

  private tempFile: ITempFile;

  private accountId: string;

  private fileService: FileService;

  constructor({
    loginView = new LoginView(),
    loginService = new LoginService(),
    fileService = new FileService(),
  }: ILoginConfig = {}) {
    this.fileService = fileService;
    this.loginView = loginView;
    this.loginService = loginService;
    this.accountId = '';
    this.tempFile = {};
  }

  /**
   * Runs the login process if you call the login command (lpf login)
   * @param {ILoginFlags} - passed flags
   * @returns {Promise<void>} - login view
   * @memberof LoginController
   */
  public async loginByCommand({ inputFlags }: ILoginFlags = {}): Promise<void> {
    this.tempFile = await this.fileService.getTempFile();
    const accountIds = this.tempFile ? Object.keys(this.tempFile) : [];

    if (inputFlags?.token) {
      await this.performSSOLogin({ inputFlags });
      this.loginView.showWelcomeBanner(true);
      return;
    }

    if (inputFlags?.accountId) {
      this.accountId = inputFlags.accountId;
    } else {
      const answer: IPromptAnswer = await this.loginView.chooseOrEnterAccountId(
        accountIds,
      );
      this.accountId = answer.accountId;
    }

    try {
      let tokenValid;
      if (this.tempFile) {
        tokenValid = await this.loginService.isTokenValid({
          accountId: this.accountId,
          csrf: this.tempFile[this.accountId]?.csrf,
          sessionId: this.tempFile[this.accountId]?.sessionId,
        });
      }
      if (tokenValid) {
        this.updateTempFile();
        this.loginView.showWelcomeBanner(true);
      } else {
        await this.askForUsernameAndPassword({
          showBanner: true,
          username: inputFlags?.username,
          password: inputFlags?.password,
        });
      }
    } catch (error) {
      this.loginView.errorDuringLogin();
      throw new Error(error);
    }
  }

  /**
   * Run the login process if you call a command and you're token is expired.
   * Will be invoked from the factory.
   * @returns {Promise<void>} - login view
   * @memberof LoginController
   */
  private async loginByFaasFactory(): Promise<void> {
    this.tempFile = await this.fileService.getTempFile();
    const accountIds = this.tempFile ? Object.keys(this.tempFile) : [];
    const answer: IPromptAnswer = await this.loginView.chooseOrEnterAccountId(
      accountIds,
    );
    this.accountId = answer.accountId;
    await this.askForUsernameAndPassword({ showBanner: false });
  }

  private async askForUsernameAndPassword(
    /* istanbul ignore next */ {
      showBanner,
      password,
      username,
    }: {
      showBanner: boolean;
      password?: string;
      username?: string;
      displayAccountId?: boolean;
    } = { showBanner: false, displayAccountId: false },
  ): Promise<void> {
    const promptAnswer: IPromptAnswer = await this.loginView.askForUsernameAndPassword(
      {
        password,
        username,
      },
    );

    try {
      const response: ILoginResponse = await this.loginService.login({
        accountId: this.accountId,
        username: promptAnswer.username || username,
        password: promptAnswer.password || password,
      });

      await this.fileService.writeTempFile({
        ...(this.tempFile && { ...this.tempFile }),
        [this.accountId]: {
          token: response.bearer,
          userId: response.config.userId,
          username: response.config.loginName,
          csrf: response.csrf,
          sessionId: response.sessionId,
          active: true,
        },
      });
      this.tempFile = await this.fileService.getTempFile();
      await this.updateTempFile();
      this.loginView.showWelcomeBanner(showBanner);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Gets the login information from the temp file.
   * If the token is invalid, it will starts the login process.
   * @param {validToken} - used for the recursive call
   * @returns {Promise<ILoginInformation>} - login view
   * @memberof LoginController
   */
  public async getLoginInformation({
    validToken = false,
  }: {
    validToken?: boolean;
  } = {}): Promise<ILoginInformation> {
    try {
      this.tempFile = await this.fileService.getTempFile();
      const activeAccountId: string = Object.keys(this.tempFile).find(
        (e) => this.tempFile[e].active,
      ) as string;

      if (this.checkIfSSOLogin(activeAccountId)) {
        return {
          accountId: activeAccountId,
          token: this.tempFile[activeAccountId].token,
          userId: this.tempFile[activeAccountId].userId,
          username: '',
        };
      }

      const { token, userId, username, csrf, sessionId } = this.tempFile[
        activeAccountId
      ];
      if (
        validToken ||
        (await this.loginService.isTokenValid({
          accountId: activeAccountId,
          csrf,
          sessionId,
        }))
      ) {
        return {
          accountId: activeAccountId,
          token,
          userId,
          username,
        };
      }
      throw new Error('Token not valid');
    } catch {
      await this.loginByFaasFactory();
      return this.getLoginInformation({ validToken: true });
    }
  }

  private checkIfSSOLogin(activeAccountId: string) {
    return (
      this.tempFile[activeAccountId].token &&
      !this.tempFile[activeAccountId].csrf &&
      !this.tempFile[activeAccountId].sessionId
    );
  }

  private async performSSOLogin({ inputFlags }: ILoginFlags) {
    this.accountId = inputFlags?.accountId as string;
    this.tempFile = await this.fileService.getTempFile();
    await this.fileService.writeTempFile({
      ...(this.tempFile && { ...this.tempFile }),
      [this.accountId]: {
        token: inputFlags?.token,
        userId: inputFlags?.userId,
        csrf: null,
        sessionId: null,
        active: true,
      },
    });
    this.tempFile = await this.fileService.getTempFile();
    await this.updateTempFile();
  }

  private async updateTempFile(): Promise<any> {
    /* istanbul ignore else */
    if (this.tempFile) {
      Object.keys(this.tempFile).forEach((entry) => {
        this.tempFile[entry].active = false;
      });
      this.tempFile[this.accountId].active = true;
      await this.fileService.writeTempFile(this.tempFile);
    }
  }

  /**
   * Returns Promise which resolves to true/false if the user is currently logged in
   * @returns {Promise<boolean>} - isUserLoggedIn
   * @memberof LoginController
   */
  public async isUserLoggedIn(): Promise<boolean> {
    let activeAccountId: string;
    try {
      this.tempFile = await this.fileService.getTempFile();

      if (!this.tempFile) {
        return false;
      }

      activeAccountId = Object.keys(this.tempFile).find(
        (e) => this.tempFile[e].active,
      ) as string;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
      return false;
    }

    if (this.checkIfSSOLogin(activeAccountId)) {
      return true;
    }

    const { csrf, sessionId } = this.tempFile[activeAccountId];
    return this.loginService.isTokenValid({
      accountId: activeAccountId,
      csrf,
      sessionId,
    });
  }
}
