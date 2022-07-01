import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { CLIErrorCodes } from '../shared/errorCodes';
import { factory } from '../service/faasFactory.service';
import {
  BUCKET_SIZES as predefinedBucketSizes,
  THIRTY_DAYS,
  FIFTEEN_MINUTES,
} from '../shared/constants';
import { MetricsView } from '../view/metrics.view';

interface IInputFlags {
  start?: string | number;
  end?: string | number;
  last?: string;
  output?: string;
}

interface IMetricsConfig {
  lambdaFunction: string;
  inputFlags: IInputFlags;
}

export class MetricsController {
  private metricsView: MetricsView;

  constructor({ metricsView = new MetricsView() } = {}) {
    this.metricsView = metricsView;
  }

  /**
   * Gets the logs of the passed function
   * @param {IMetricsConfig} - lambda function and flags
   * @returns {Promise<void>}
   * @memberof MetricsController
   */
  public async getMetrics({
    lambdaFunction,
    inputFlags,
  }: IMetricsConfig): Promise<void> {
    const { start, end = Date.now(), last, output = '' } = inputFlags;

    let startTimestamp: number;
    const endTimestamp = Number(end);

    if (!start && !last) {
      throw new Error(
        'Please define either start and end timestamp or define the period for the last 5m, 1h, 7d,... since now',
      );
    }

    if (start && !last) {
      startTimestamp = Number(start);
    } else {
      startTimestamp = MetricsController.calculateStartTimestamp({
        end,
        last,
      });
    }

    if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp)) {
      throw new Error('Given timestamps are not valid');
    }

    if (startTimestamp > endTimestamp) {
      throw new Error('Start timestamp has to be before end timestamp.');
    }

    if (endTimestamp - startTimestamp > THIRTY_DAYS) {
      throw new Error('Time period cannot exceed 30 days.');
    }

    if (endTimestamp - startTimestamp < FIFTEEN_MINUTES) {
      throw new Error('Time period cannot be shorter than 15 minutes.');
    }

    const bucketSizeInMS = MetricsController.getAppropriateBucketSize({
      startTimestamp,
      endTimestamp,
    });

    const faasService = await factory.get();

    const uuid = await MetricsController.getLambdaUUID(lambdaFunction);

    const res = await faasService.getLambdaInvocationMetrics({
      uuid,
      startTimestamp,
      endTimestamp,
      bucketSize: bucketSizeInMS,
    });

    if (!output) {
      this.metricsView.printMetricsTable(res.invocationStatistics);
    }

    if (output.toLowerCase() === 'csv') {
      this.metricsView.printMetricsTableAsCSV(res.invocationStatistics);
    }

    if (output.toLowerCase() === 'json') {
      this.metricsView.printMetricsTableAsJSON(res.invocationStatistics);
    }
  }

  /**
   * Returns bucket size 5m, 1h, 1d in ms depending on the size of the time period (1h, 7d, >7d)
   * @param period contains start and end timestamp
   * @returns the bucket size in ms
   */
  private static getAppropriateBucketSize({
    startTimestamp,
    endTimestamp,
  }): number {
    const period = endTimestamp - startTimestamp;
    const ONE_HOUR = 1000 * 60 * 60;
    const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

    if (period <= ONE_HOUR) {
      return predefinedBucketSizes['5m'];
    }

    if (period <= SEVEN_DAYS) {
      return predefinedBucketSizes['1h'];
    }

    return predefinedBucketSizes['1d'];
  }

  private static calculateStartTimestamp({ end, last }): number {
    return end - this.periodStringToTimestamp(last);
  }

  private static async getLambdaUUID(lambdaFunction: string): Promise<string> {
    const faasService = await factory.get();

    const [currentLambda] = (await faasService.getLambdasByNames([
      lambdaFunction,
    ])) as any;

    /* istanbul ignore next */
    if (!currentLambda) {
      const prettyError: PrettyPrintableError = {
        message: `Function ${lambdaFunction} were not found on the platform. Please make sure the function with the name ${lambdaFunction} was pushed to the LivePerson Functions platform`,
        suggestions: [
          'Use "lpf push exampleFunction" to push and "lpf deploy exampleFunction" to deploy a function',
        ],
        ref: 'https://github.com/LivePersonInc/faas-cli#invoke',
        code: CLIErrorCodes.NoLambdasFound,
      };
      throw prettyError;
    }

    return currentLambda.uuid;
  }

  private static periodStringToTimestamp(periodString: string): number {
    const regex = /(\d{1,2})([dhm])/;
    const [, amount, unit] = periodString.match(regex) || [];
    switch (unit) {
      case 'm':
        return Number(amount) * 60 * 1000;
      case 'h':
        return Number(amount) * 60 * 60 * 1000;
      case 'd':
        return Number(amount) * 24 * 60 * 60 * 1000;
      default:
        throw new Error(
          '"Last" flag unit has to be m (minutes), h (hours) or d (days) e.g. 33m, 12h or 7d',
        );
    }
  }
}
