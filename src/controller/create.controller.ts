// tslint:disable:no-shadowed-variable
import { CreateView as CreateViewDefault } from '../view/create.view';
import {
  DefaultStructureService,
  IFunctionConfig,
} from '../service/defaultStructure.service';
import { LoginController } from './login.controller';
import { factory } from '../service/faasFactory.service';

export type PackageManager = 'npm' | 'yarn';

interface ICreateControllerConfig {
  createView?: CreateViewDefault;
  defaultStructureService?: DefaultStructureService;
}

export class CreateController {
  private readonly createView: CreateViewDefault;

  private readonly defaultStructureService: DefaultStructureService;

  private loginController: LoginController;

  constructor(
    /* istanbul ignore next */ {
      createView = new CreateViewDefault(),
      defaultStructureService = new DefaultStructureService(),
      loginController = new LoginController(),
    }: ICreateControllerConfig = {},
  ) {
    this.createView = createView;
    this.defaultStructureService = defaultStructureService;
    this.loginController = loginController;
  }

  /**
   *
   * @param {IFunctionCreateOptions} - Passed function name and flags
   * @returns {Promise<void>} - create view
   * @memberof CreateController
   */
  public async createFunction(functionParameters): Promise<void> {
    try {
      const missingParameters = await this.checkAndAskForMissingParameters(
        functionParameters,
      );

      const functionConfig: IFunctionConfig = {
        ...functionParameters,
        ...missingParameters,
      };

      this.defaultStructureService.createFunction(functionConfig);
      this.createView.showFunctionIsCreated(functionConfig);
    } catch (error) {
      this.createView.showErrorMessage(error.message);
    }
  }

  private async checkAndAskForMissingParameters(
    incompleteFunctionParameters: IFunctionConfig,
  ): Promise<any> {
    const { name, description, event } = incompleteFunctionParameters;

    let selectedFunctionParameters = {};

    if (!name) {
      selectedFunctionParameters = {
        ...selectedFunctionParameters,
        ...(await this.createView.askForFunctionName()),
      };
    }

    if (!description) {
      selectedFunctionParameters = {
        ...selectedFunctionParameters,
        ...(await this.createView.askForFunctionDescription()),
      };
    }

    if (!event) {
      let selectedEventId;

      if (await this.isUserLoggedIn()) {
        const faasService = await factory.get();
        const events = await faasService.getEvents();
        selectedEventId = await this.createView.askForEventID([
          'No Event',
          ...events.map((e) => e.eventId),
        ]);
      } else {
        selectedEventId = await this.createView.askForEventID();
      }

      selectedFunctionParameters = {
        ...selectedFunctionParameters,
        ...selectedEventId,
      };
    }
    return selectedFunctionParameters;
  }

  private async isUserLoggedIn(): Promise<boolean> {
    return this.loginController.isUserLoggedIn();
  }
}
