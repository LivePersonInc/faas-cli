import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { CLIErrorCodes } from '../shared/errorCodes';
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
    if (domains.length === 0) {
      const prettyError: PrettyPrintableError = {
        message:
          'Please provide a domain (functions, deployments and/or account)',
        suggestions: ['Functions, deployments, account or events.'],
        ref: 'https://github.com/LivePersonInc/faas-cli#get',
        code: CLIErrorCodes.DomainMissing,
      };
      this.getView.showErrorMessage(prettyError);
      throw new Error('exit');
    }

    /* istanbul ignore else */
    if (!domains.some((e) => this.domains.includes(e))) {
      const prettyError: PrettyPrintableError = {
        message:
          'Unsupported domain found. Only functions, deployments and account are supported!',
        suggestions: ['Functions, deployments, account or events.'],
        ref: 'https://github.com/LivePersonInc/faas-cli#get',
        code: CLIErrorCodes.UnsupportedDomain,
      };
      this.getView.showErrorMessage(prettyError);
      throw new Error('exit');
    }

    const faasService = await factory.get();

    try {
      const allLambdas = await faasService.getAllFunctionMetas();

      /* istanbul ignore else */
      if (allLambdas.length === 0) {
        const prettyError: PrettyPrintableError = {
          message: 'There are no functions created on your account!',
          suggestions: [
            'Use "lpf create:function exampleFunction" to create a function first.',
          ],
          ref: 'https://github.com/LivePersonInc/faas-cli#get',
          code: CLIErrorCodes.NoLambdasFound,
        };
        throw prettyError;
      }

      const updatedLambdas = allLambdas.map((func) => {
        func.eventId = func.eventId ? func.eventId : 'No Event';
        return func;
      });

      if (domains.includes('functions')) {
        this.getView.printFunctions(updatedLambdas);
      }

      if (domains.includes('deployments')) {
        const allDeployments = await faasService.getAllDeployments();
        const deployedLambdas = updatedLambdas
          .filter((fn) => {
            if (fn.state === 'Productive' || fn.state === 'Modified') {
              return !!allDeployments.find(
                ({ functionUuid }) => functionUuid === fn.uuid,
              );
            }
            return false;
          })
          .map((fn) => {
            const relatedDeployment = allDeployments.find(
              ({ functionUuid }) => functionUuid === fn.uuid,
            );
            return (
              relatedDeployment && {
                name: fn.name,
                state:
                  relatedDeployment.deploymentState === 'successful'
                    ? fn.state
                    : 'failed',
                deployedAt:
                  relatedDeployment.updatedAt || relatedDeployment.createdAt,
                deployedBy:
                  relatedDeployment.updatedBy || relatedDeployment.createdBy,
              }
            );
          });

        this.getView.printDeployments(deployedLambdas);
      }
    } catch (error) {
      this.getView.showErrorMessage(error);
      throw new Error('exit');
    }
    try {
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
      this.getView.showErrorMessage(error);
      throw new Error('exit');
    }
  }
}
