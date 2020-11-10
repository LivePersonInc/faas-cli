// tslint:disable:no-shadowed-variable
import { AddView as AddViewDefault } from '../view/add.view';
import { LoginController } from './login.controller';
import { factory } from '../service/faasFactory.service';

export type PackageManager = 'npm' | 'yarn';

interface IScheduleConfig {
  lambdaUUID?: string;
  cronExpression?: string;
  isActive?: boolean;
}

interface IAddControllerConfig {
  addView?: AddViewDefault;
  loginController?: LoginController;
}

export class AddController {
  private readonly addView: AddViewDefault;

  private loginController: LoginController;

  constructor(
    /* istanbul ignore next */ {
      addView = new AddViewDefault(),
      loginController = new LoginController(),
    }: IAddControllerConfig = {},
  ) {
    this.addView = addView;
    this.loginController = loginController;
  }

  /**
   *
   * @param {domainUrl} - Passed function name and flags
   * @returns {Promise<void>} - create view
   * @memberof AddController
   */
  public async addDomains(domains: string[] = []): Promise<void> {
    if (domains.length === 0) {
      this.addView.showErrorMessage(
        "Please add domains to the command's arguments",
      );
      return;
    }

    const isUserLoggedIn = await this.isUserLoggedIn();
    if (!isUserLoggedIn) {
      this.addView.showMessage(
        'You have to be logged-in to add domains to your account.',
      );
      await this.loginController.getLoginInformation();
    }

    const faasService = await factory.get();

    domains.forEach(async (domain) => {
      try {
        await faasService.addDomain(domain);
        this.addView.showDomainAdded(domain);
      } catch (error) {
        // TODO change when we get a 403 on duplicate
        if (error.errorCode === '400') {
          this.addView.showErrorMessage(
            `Domain ${domain} was rejected because of malformatting or it was already added to your account.`,
          );
        }
      }
    });
  }

  private async isUserLoggedIn(): Promise<boolean> {
    return this.loginController.isUserLoggedIn();
  }
}