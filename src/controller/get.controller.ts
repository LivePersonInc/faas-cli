import { GetView } from '../view/get.view';
import { factory } from '../service/faasFactory.service';

interface IGetControllerConfig {
  getView?: GetView;
}

interface IGetConfig {
  domains?: string[];
}

export class GetController {
  private readonly getView: GetView;

  private readonly domains: string[];

  constructor(
    /* istanbul ignore next */ {
      getView = new GetView(),
    }: IGetControllerConfig = {},
  ) {
    this.getView = getView;
    this.domains = ['functions', 'deployments', 'account', 'events'];
  }

  /**
   * Returns the information about the passed domains.
   * @param {IGetConfig} - Passed domains
   * @returns {Promise<void>} - get view
   * @memberof GetController
   */
  public async get(
    /* istanbul ignore next */ { domains = [] }: IGetConfig = {},
  ): Promise<void> {
    try {
      if (domains.length === 0) {
        throw new Error(
          'Please provide a domain (functions, deployments and/or account)',
        );
      }

      /* istanbul ignore else */
      if (!domains.some((e) => this.domains.includes(e))) {
        throw new Error(
          'Unsupported domain found. Only functions, deployments and account are supported!',
        );
      }

      const faasService = await factory.get();

      const allLambdas = await faasService.getAllLambdas();

      /* istanbul ignore else */
      if (allLambdas.length === 0) {
        throw new Error('There are no functions created on your account!');
      }

      const updatedLambdas = allLambdas.map((func) => {
        func.eventId = func.eventId ? func.eventId : 'No Event';
        return func;
      });

      /* istanbul ignore else */
      if (domains.includes('functions')) {
        this.getView.printFunctions(updatedLambdas);
      }

      /* istanbul ignore else */
      if (domains.includes('deployments')) {
        const productiveLambdas = updatedLambdas
          .filter(
            (lambda) =>
              lambda.state === 'Productive' || lambda.state === 'Modified',
          )
          .map((lambda) => ({
            ...lambda.lastDeployment,
            name: lambda.name,
            state:
              lambda.state === 'Productive' ? 'Up to date' : lambda.updatedAt,
          }));
        this.getView.printDeployments(productiveLambdas);
      }

      /* istanbul ignore else */
      if (domains.includes('account')) {
        const accountInfo = await faasService.getAccountStatistic();
        this.getView.printAccountInformation(accountInfo);
      }

      /* istanbul ignore else */
      if (domains.includes('events')) {
        const events = await faasService.getEvents();
        this.getView.printEvents(events);
      }
    } catch (error) {
      this.getView.showErrorMessage(error.message || error.errorMsg);
    }
  }
}
