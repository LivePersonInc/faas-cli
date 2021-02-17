// tslint:disable:no-shadowed-variable
import { AddView as AddViewDefault } from '../view/add.view';
import { LoginController } from './login.controller';
import { factory } from '../service/faasFactory.service';

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
        this.addView.showErrorMessage(error.message || error.errorMsg);
      }
    });
  }

  private async isUserLoggedIn(): Promise<boolean> {
    return this.loginController.isUserLoggedIn();
  }
}
