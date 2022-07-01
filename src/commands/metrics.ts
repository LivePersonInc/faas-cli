import { Command, Flags } from '@oclif/core';
import { MetricsController } from '../controller/metrics.controller';
import { parseInput } from '../shared/utils';
import { ErrorMessage } from '../view/printer';

export default class Metrics extends Command {
  static description = 'Download invocation metrics';

  static flags = {
    help: Flags.help({ char: 'h' }),
    start: Flags.string({
      char: 's',
      description: 'start timestamp',
      exclusive: ['last'],
    }),
    end: Flags.string({
      char: 'e',
      description: 'end timestamp (defaults to current timestamp)',
    }),
    last: Flags.string({
      char: 'l',
      description:
        'An alternative to start flag, metrics for the period of the last x hours|days, options: xh, xd; eg. last 12h, 7d',
      exclusive: ['start'],
    }),
    output: Flags.string({
      char: 'o',
      description: 'Optional: output formatting for file saving purposes',
      options: ['csv', 'json'],
    }),
  };

  static args = [
    {
      name: 'function-name',
      required: true,
      description: 'name of lambda',
      default: null,
    },
  ];

  public static examples = [
    '> <%= config.bin %> metrics exampleFunction --last=7d',
    '> <%= config.bin %> metrics exampleFunction --start=1626156400000',
    '> <%= config.bin %> metrics exampleFunction --end=1626156400000 --last=7d',
    '> <%= config.bin %> metrics exampleFunction --start=1626156400000 --end=1626157400000',
    '> <%= config.bin %> metrics exampleFunction --start=1626156400000 --end=1626157400000',
    '',
    'For redirecting metrics to a file:',
    'lpf metrics exampleFunction --start=1626156400000 --output="csv" >> exampleFunction.csv',
    '',
    "The metrics are aggregated into buckets. These buckets' sizes can be chosen as 5m, 1h, 1d",
    '',
    'Fetching metrics via cronjob every 24 hours and write it to a file:',
    'MacOS:',
    '0 0 * * * <%= config.bin %> lpf metrics exampleFunction  -l=1d >> exampleFunction.csv',
  ];

  private errorMessage = new ErrorMessage();

  private metricsController: MetricsController = new MetricsController();

  /**
   * Runs the invoke command and parses the passed function and flag
   * @returns {Promise<void>} - invoke command
   * @memberof Invoke
   */
  public async run(): Promise<void> {
    try {
      const { flags: inputFlags } = await this.parse(Metrics);
      const [lambdaFunction] = parseInput(Metrics.flags, this.argv);
      await this.metricsController.getMetrics({ lambdaFunction, inputFlags });
    } catch (error) {
      this.errorMessage.print(error.message || error.errorMsg);
      this.exit(1);
    }
  }
}
