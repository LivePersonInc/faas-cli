import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import * as Table from 'tty-table';
import { LogMessage, ErrorMessage, chalk } from './printer';
import { IFunction } from '../types';
import { formatDate } from '../shared/utils';
import { AccountStatistics } from '../service/faas.service';

require('events').EventEmitter.defaultMaxListeners = 15;

interface IDeployViewConfig {
  error?: ErrorMessage;
  log?: LogMessage;
}

export class GetView {
  private readonly log: LogMessage;

  private readonly error: ErrorMessage;

  constructor({
    log = new LogMessage(),
    error = new ErrorMessage(),
  }: IDeployViewConfig = {}) {
    this.log = log;
    this.error = error;
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
   * @param {IFunction[]} functions - functions
   * @returns {void}
   * @memberof GetView
   */
  public printFunctions(functions: IFunction[]): void {
    this.log.print('');
    const table = Table(
      [
        {
          value: 'name',
          alias: 'Name',
        },
        {
          value: 'createdAt',
          alias: 'Created at',
          formatter: (updatedAt) => (updatedAt ? formatDate(updatedAt) : '-'),
        },
        {
          value: 'createdBy',
          alias: 'Created by',
        },
        {
          value: 'state',
          alias: 'State',
        },
        {
          value: 'updatedAt',
          alias: 'Last changed at',
          formatter: (updatedAt) => (updatedAt ? formatDate(updatedAt) : '-'),
        },
        {
          value: 'updatedBy',
          alias: 'Last changed by',
        },
        {
          value: 'eventId',
          alias: 'Event',
        },
      ],
      functions,
      { defaultValue: '-' },
    ).render();
    this.log.print(table);
    this.log.print('');
  }

  /**
   * Prints all deployments (domain) as a table
   * @param {any} functions - functions
   * @returns {void}
   * @memberof GetView
   */
  public printDeployments(deployments: any): void {
    this.log.print('');
    const table = Table(
      [
        {
          value: 'name',
          alias: 'Name',
        },
        {
          value: 'state',
          alias: 'Deployment state',
        },
        {
          value: 'deployedAt',
          alias: 'Last successful deployment',
          formatter: (deployedAt) =>
            deployedAt ? formatDate(deployedAt) : 'pending ...',
        },
        {
          value: 'deployedBy',
          alias: 'Deployed By',
        },
      ],
      deployments,
      { defaultValue: '-' },
    ).render();
    this.log.print(table);
    this.log.print('');
  }

  /**
   * Prints all account informations
   * @param {*} accountInfo - account information
   * @returns {void}
   * @memberof GetView
   */
  public printAccountInformation(accountInfo: AccountStatistics): void {
    this.log.print(`
    ${chalk.bold('Total Functions:')}      ${accountInfo.numberOfFunctions}
    ${chalk.bold('Deployed Functions:')}   ${accountInfo.numberOfDeployments}
    ${chalk.bold('Total Invocations:')}    ${accountInfo.numberOfInvocations}`);
  }

  /**
   * Prints the events with the mapped names
   * @param {*} events - Events from the api
   * @returns {void}
   * @memberof GetView
   */
  public printEvents(events: any): void {
    this.log.print('');
    const table = Table(
      [
        {
          value: 'eventId',
          alias: 'Event Id',
        },
        {
          value: 'eventName',
          alias: 'Event name',
        },
      ],
      events,
      { defaultValue: '-' },
    ).render();
    this.log.print(table);
    this.log.print('');
    this.log.print('For further informations please have a look at');
    this.log.print(
      'https://developers.liveperson.com/liveperson-functions-event-sources-overview.html',
    );
    this.log.print('');
  }
}
