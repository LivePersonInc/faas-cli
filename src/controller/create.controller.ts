// tslint:disable:no-shadowed-variable
import { CreateView as CreateViewDefault } from '../view/create.view';
import {
  DefaultStructureService,
  IFunctionConfig,
} from '../service/defaultStructure.service';
import { LoginController } from './login.controller';
import { factory } from '../service/faasFactory.service';

export interface IScheduleConfig {
  lambdaUUID?: string;
  cronExpression?: string;
  isActive?: boolean;
}

interface ICreateControllerConfig {
  createView?: CreateViewDefault;
  defaultStructureService?: DefaultStructureService;
  loginController?: LoginController;
  uuid?: string;
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
  public async createFunction(functionParameters = {}): Promise<void> {
    try {
      const missingParameters = await this.checkAndAskForMissingFunctionParameters(
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

  private async checkAndAskForMissingFunctionParameters(
    incompleteFunctionParameters: IFunctionConfig = {},
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

  /**
   * Creates a schedule. Requires login
   * @param {any} - Passed function name and flags
   * @returns {Promise<void>} - create view
   * @memberof CreateController
   */
  public async createSchedule(scheduleParameters = {}): Promise<void> {
    try {
      const missingParameters = await this.checkAndAskForMissingScheduleParameters(
        scheduleParameters,
      );

      const scheduleConfig: IScheduleConfig = {
        ...missingParameters,
        isActive: true,
      };

      const faasService = await factory.get();
      const res = await faasService.createSchedule(scheduleConfig);
      this.createView.showScheduleIsCreated(res.nextExecution);
    } catch (error) {
      this.createView.showErrorMessage(error.message || error.errorMsg);
    }
  }

  private async checkAndAskForMissingScheduleParameters({
    functionName = '',
    cronExpression = '',
  }): Promise<IScheduleConfig> {
    const scheduleConfig: IScheduleConfig = {};
    // Make sure user is logged in
    if (!(await this.isUserLoggedIn())) {
      this.createView.showMessage(
        'You need to log into an account to create schedules',
      );

      await this.loginController.getLoginInformation();
    }

    const faasService = await factory.get();
    const deployedLambdas = (
      await faasService.getAllLambdas()
    ).filter(({ state }) => ['Productive', 'Modified'].includes(state));
    scheduleConfig.lambdaUUID = deployedLambdas.find(
      ({ name }) => functionName === name,
    )?.uuid;

    if (!scheduleConfig.lambdaUUID) {
      if (functionName) {
        this.createView.showErrorMessage(
          `${functionName} was not found as a deployed lambda on the account.`,
        );
      }

      const selectedLambda = await this.createView.askForDeployedLambda(
        deployedLambdas,
      );

      const lambdaUUID = deployedLambdas.find(
        ({ name }) => selectedLambda.name === name,
      )?.uuid;

      scheduleConfig.lambdaUUID = lambdaUUID;
    }

    if (cronExpression) {
      scheduleConfig.cronExpression = cronExpression;
    } else {
      const answer = await this.createView.askForCronExpression();
      scheduleConfig.cronExpression = answer.cronExpression || '';
    }

    return { ...scheduleConfig, isActive: true };
  }

  private async isUserLoggedIn(): Promise<boolean> {
    return this.loginController.isUserLoggedIn();
  }
}
