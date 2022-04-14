import * as moment from 'moment-timezone';
import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { LogMessage, ErrorMessage, cliUX, chalk } from './printer';
import { ILambda } from '../types';

require('events').EventEmitter.defaultMaxListeners = 15;

const DEFAULT_FORMAT_DATETIME_WITH_SECONDS = 'DD.MM.YYYY - HH:mm:ss z';

interface IDeployViewConfig {
  error?: ErrorMessage;
  log?: LogMessage;
  cliUx?: any;
}

function formatDate(date: string) {
  return moment(String(date))
    .tz(moment.tz.guess())
    .format(DEFAULT_FORMAT_DATETIME_WITH_SECONDS);
}

export class GetView {
  private readonly log: LogMessage;

  private readonly error: ErrorMessage;

  private readonly cliUx: any;

  constructor({
    log = new LogMessage(),
    error = new ErrorMessage(),
    cliUx = cliUX,
  }: IDeployViewConfig = {}) {
    this.log = log;
    this.error = error;
    this.cliUx = cliUx;
  }

  /**
   * Shows an error message
   * @param {string|PrettyPrintableError} message - message
   * @memberof GetView
   */
  public showErrorMessage(message: string | PrettyPrintableError): void {
    this.error.print(message);
  }

  /**
   * Prints all functions (domain) as a table
   * @param {ILambda[]} functions - functions
   * @returns {void}
   * @memberof GetView
   */
  public printFunctions(functions: ILambda[]): void {
    this.log.print('');
    this.cliUx.table(functions, {
      name: {
        minWidth: 30,
      },
      state: {
        minWidth: 15,
      },
      updatedAt: {
        minWidth: 40,
        header: 'Last changed at',
        get: (row: any) => (row.updatedAt ? formatDate(row.updatedAt) : '-'),
      },
      updatedBy: {
        minWidth: 40,
        header: 'Last changed by',
        get: (row: any) => row.updatedBy || '-',
      },
      eventId: {
        minWidth: 40,
        header: 'Event',
      },
    });
    this.log.print('');
  }

  /**
   * Prints all deployments (domain) as a table
   * @param {any} functions - functions
   * @returns {void}
   * @memberof GetView
   */
  public printDeployments(functions: any): void {
    this.log.print('');
    this.cliUx.table(functions, {
      name: {
        minWidth: 30,
      },
      state: {
        minWidth: 30,
        header: 'Undeployed changes from',
        get: (row: any) =>
          row.state === 'Up to date' ? 'Up to date' : formatDate(row.state),
      },
      deployedAt: {
        minWidth: 30,
        header: 'Last successful deployment',
        get: (row: any) =>
          row.deployedAt ? formatDate(row.deployedAt) : 'pending ...',
      },
      createdBy: {
        minWidth: 30,
        header: 'Deployed by',
      },
      deploymentState: {
        minWidth: 30,
        header: 'Deployment state',
        get: (row: any) => row.deploymentState || '-',
      },
    });
    this.log.print('');
  }

  /**
   * Prints all account informations
   * @param {*} accountInfo - account information
   * @returns {void}
   * @memberof GetView
   */
  public printAccountInformation(accountInfo: any): void {
    const totalInvocations =
      accountInfo.successfulInvocations + accountInfo.unsuccessfulInvocations;
    const fairUseQuotaPercentage = Math.ceil(
      (totalInvocations * 100) / accountInfo.invocationLimitPerMonth,
    );

    const date = new Date();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 1);
    const invocationDate = firstDayOfMonth.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    this.log.print(`
${chalk.bold('Total Functions:')}      ${accountInfo.total} / ${
      accountInfo.limitTotalLambdas
    }
${chalk.bold('Deployed Functions:')}   ${accountInfo.deployed} / ${
      accountInfo.limitDeployedLambdas
    }
${chalk.bold('Total Invocations:')}    ${totalInvocations}

${chalk.bold(
  'Fair Use Quota:',
)}       ${fairUseQuotaPercentage}% (Invocations since ${invocationDate})
                      ${totalInvocations} / ${
      accountInfo.invocationLimitPerMonth
    }
    `);
  }

  /**
   * Prints the events with the mapped names
   * @param {*} events - Events from the api
   * @returns {void}
   * @memberof GetView
   */
  public printEvents(events: any): void {
    this.log.print('');
    this.cliUx.table(events, {
      eventName: {
        header: 'Event name',
        minWidth: 40,
      },
      eventId: {
        header: 'EventId',
        minWidth: 40,
      },
    });
    this.log.print('');
    this.log.print('For further informations please have a look at');
    this.log.print(
      'https://developers.liveperson.com/liveperson-functions-development-events-templates.html',
    );
    this.log.print('');
  }
}
