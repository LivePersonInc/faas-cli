import { LogMessage, ErrorMessage, cliUX } from './printer';

import { INVOCATION_STATE_LABELS } from '../shared/constants';
import { formatDate, transformToCSV } from '../shared/utils';

export class MetricsView {
  private log: LogMessage;

  private error: ErrorMessage;

  private readonly cliUx: any;

  constructor({
    log = new LogMessage(),
    error = new ErrorMessage(),
    cliUx = cliUX,
  }: {
    log?: LogMessage;
    error?: ErrorMessage;
    cliUx?: any;
  } = {}) {
    this.log = log;
    this.error = error;
    this.cliUx = cliUx;
  }

  /**
   * Prints the console logs from the invoked function
   * @param {*} message - message
   * @returns {void}
   * @memberof MetricsView
   */
  public printMetricsTable(metrics: any): void {
    this.log.print('');
    this.cliUx.table(metrics, {
      from: {
        header: 'From',
        get: (row: any) => formatDate(row.from),
      },
      to: {
        header: 'To',
        get: (row: any) => formatDate(row.to),
      },
      SUCCEEDED: {
        header: INVOCATION_STATE_LABELS.SUCCEEDED,
      },
      UNKOWN: {
        header: INVOCATION_STATE_LABELS.UNKOWN,
      },
      CODING_FAILURE: {
        header: INVOCATION_STATE_LABELS.CODING_FAILURE,
      },
      PLATFORM_FAILURE: {
        header: INVOCATION_STATE_LABELS.PLATFORM_FAILURE,
      },
      TIMEOUT: {
        header: INVOCATION_STATE_LABELS.TIMEOUT,
      },
    });
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
    return transformedMetrics;
  }
}
