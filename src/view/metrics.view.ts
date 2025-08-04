import * as Table from 'tty-table';
import { LogMessage, ErrorMessage } from './printer';
import { INVOCATION_STATE_LABELS } from '../shared/constants';
import { formatDate, transformToCSV } from '../shared/utils';

export class MetricsView {
  private log: LogMessage;

  private error: ErrorMessage;

  constructor({
    log = new LogMessage(),
    error = new ErrorMessage(),
  }: {
    log?: LogMessage;
    error?: ErrorMessage;
  } = {}) {
    this.log = log;
    this.error = error;
  }

  /**
   * Prints the console logs from the invoked function
   * @param {*} message - message
   * @returns {void}
   * @memberof MetricsView
   */
  public printMetricsTable(metrics: any): void {
    this.log.print('');
    const table = Table(
      [
        {
          value: 'from',
          alias: 'From',
          formatter: (from) => (from ? formatDate(from) : '-'),
        },
        {
          value: 'to',
          alias: 'To',
          formatter: (to) => (to ? formatDate(to) : '-'),
        },
        {
          value: 'SUCCEEDED',
          alias: INVOCATION_STATE_LABELS.SUCCEEDED,
        },
        {
          value: 'CODING_FAILURE',
          alias: INVOCATION_STATE_LABELS.UNKNOWN,
        },
        {
          value: 'PLATFORM_FAILURE',
          alias: INVOCATION_STATE_LABELS.CODING_FAILURE,
        },
        {
          value: 'SUCCEEDED',
          alias: INVOCATION_STATE_LABELS.PLATFORM_FAILURE,
        },
        {
          value: 'TIMEOUT',
          alias: INVOCATION_STATE_LABELS.TIMEOUT,
        },
      ],
      metrics,
      { defaultValue: '-' },
    ).render();
    this.log.print(table);
    this.log.print('');
  }

  public printMetricsTableAsCSV(metrics: any[]): void {
    this.log.print(
      transformToCSV(metrics, {
        from: 'From',
        to: 'To',
        ...INVOCATION_STATE_LABELS,
      }),
    );
  }

  public printMetricsTableAsJSON(metrics: any): void {
    this.log.print(MetricsView.transformMetricData(metrics));
  }

  private static transformMetricData(metrics) {
    const transformedMetrics = metrics.map((metric) => {
      return Object.entries(metric).reduce((entries, entry) => {
        const newLabel = INVOCATION_STATE_LABELS[entry[0]] || entry[0];
        return {
          ...entries,
          [newLabel]: entry[1],
        };
      }, {});
    });
    return transformedMetrics.flat();
  }
}
