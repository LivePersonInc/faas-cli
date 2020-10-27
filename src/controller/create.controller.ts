// tslint:disable:no-shadowed-variable
import { CreateView as CreateViewDefault } from '../view/create.view';
import {
  DefaultStructureService,
  IFunctionConfig,
} from '../service/defaultStructure.service';

export type PackageManager = 'npm' | 'yarn';

interface ICreateControllerConfig {
  createView?: CreateViewDefault;
  defaultStructureService?: DefaultStructureService;
}

export class CreateController {
  private readonly createView: CreateViewDefault;
  private readonly defaultStructureService: DefaultStructureService;

  constructor(
    /* istanbul ignore next */ {
      createView = new CreateViewDefault(),
      defaultStructureService = new DefaultStructureService(),
    }: ICreateControllerConfig = {},
  ) {
    this.createView = createView;
    this.defaultStructureService = defaultStructureService;
  }

  /**
   *
   * @param {IFunctionCreateOptions} - Passed function name and flags
   * @returns {Promise<void>} - create view
   * @memberof CreateController
   */
  public async createFunction(functionParameters): Promise<void> {
    try {
      if (!functionParameters.name) {
        throw new Error('No function name set. Please use the --name flag.');
      }

      const functionConfig : IFunctionConfig = {
        ...functionParameters
      }

      this.defaultStructureService.createFunction(functionConfig);
      this.createView.showFunctionIsCreated(functionConfig);
    } catch (error) {
      this.createView.showErrorMessage(error.message);
    }
  }
}
