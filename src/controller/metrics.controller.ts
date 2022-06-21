import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { CLIErrorCodes } from '../shared/errorCodes';
import { factory } from '../service/faasFactory.service';
import {
  BUCKET_SIZES as predefinedBucketSizes,
  THIRTY_DAYS,
  FIFTEEN_MINUTES,
  BUCKET_SIZES,
} from '../shared/constants';
import { MetricsView } from '../view/metrics.view';

interface IInputFlags {
  start?: string | number;
  end?: string | number;
  last?: string;
  bucketSize?: string;
}

interface IMetricsConfig {
  lambdaFunction: string;
  inputFlags: IInputFlags;
}

export class MetricsController {
  private metricsView: MetricsView;

  private bucketSizes;

  constructor({
    bucketSizes = predefinedBucketSizes,
    metricsView = new MetricsView(),
  } = {}) {
    this.bucketSizes = bucketSizes;
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
    const { start, end = Date.now(), last, bucketSize } = inputFlags;

    const startTimestamp = MetricsController.calculateStartTimestamp({
      start,
      end,
      last,
    });

    const bucketSizeInSeconds = bucketSize
      ? this.getBucketSizeInMs(bucketSize)
      : BUCKET_SIZES['1h'];

    const faasService = await factory.get();
    let res;
    if (lambdaFunction) {
      const uuid = await MetricsController.getLambdaUUID(lambdaFunction);
      res = await faasService.getLambdaInvocationMetrics({
        uuid,
        startTimestamp,
        endTimestamp: Number(end),
        bucketSize: bucketSizeInSeconds,
      });
    } else {
      res = await faasService.getAccountInvocationMetrics({
        startTimestamp,
        endTimestamp: Number(end),
        bucketSize: bucketSizeInSeconds,
      });
    }
    this.metricsView.printConsoleLogs(res);
  }

  private static calculateStartTimestamp(inputFlags: IInputFlags) {
    const { start, end = Date.now(), last } = inputFlags;
    if (!start && !last) {
      throw new Error(
        'Please define either start and end timestamp or define the period for the last 5m, 1h, 1d since now',
      );
    }

    let startTimestamp = Number(start);

    if (last) {
      startTimestamp =
        Number(end) - MetricsController.periodStringToTimestamp(last);
    }

    if (startTimestamp > end) {
      throw new Error('Start timestamp has to be before end timestamp.');
    }

    if (Number(end) - Number(startTimestamp) > THIRTY_DAYS) {
      throw new Error('Time period cannot exceed 30 days.');
    }

    if (Number(end) - Number(startTimestamp) < FIFTEEN_MINUTES) {
      throw new Error('Time period cannot be shorter than 15 minutes.');
    }

    return startTimestamp;
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

  private getBucketSizeInMs(bucketSize: string): number {
    if (!this.bucketSizes[bucketSize]) {
      throw new Error(
        `Invalid bucket size ${bucketSize}. Use 5m, 1h, 1d instead`,
      );
    }

    return this.bucketSizes[bucketSize];
  }

  private static periodStringToTimestamp(periodString: string): number {
    const regex = /(\d{1,2})([dhm])/;
    const [amount, unit] = periodString.match(regex) || [];
    if (!amount || !unit) {
      throw new Error(
        '"Last" flag must follow the schema (1-99)(m|h|d) e.g. 33m, 12h or 7d ',
      );
    }
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
