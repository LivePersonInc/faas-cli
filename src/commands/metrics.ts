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
      required: true,
    }),
    end: Flags.string({
      char: 'e',
      description: 'end timestamp (default current timestamp)',
    }),
    last: Flags.string({
      char: 'l',
      description:
        'metrics for the last x hours|days, alternative to start/end flags, options: xh, xd; eg. 12h, 7d',
    }),
    bucketSize: Flags.string({
      char: 'b',
      description:
        'bucket size to which the metrics will aggregate to, options: 5m, 1h, 1d (default 1d)',
    }),
  };

  static args = [
    {
      name: 'function-name',
      required: false,
      description: 'name of lambda (optional)',
      default: null,
    },
  ];

  public static examples = [
    '> <%= config.bin %> metrics --start=1626156400000',
    '> <%= config.bin %> metrics exampleFunction --start=1626156400000 --buckerSize=1d',
    '> <%= config.bin %> metrics exampleFunction --start=1626156400000 --end=1626157400000',
    '> <%= config.bin %> metrics --start=1626156400000 --end=1626157400000 --buckerSize=7d',
    '',
    'If no function name is given it is implied that you will download metrics for the entire account',
    '',
    'For redirecting metrics to a file:',
    'metrics exampleFunction --start=1626156400000 > exampleFunction.log',
    '',
    "The metrics are aggregated into buckets. These buckets' sizes can be chosen as 5m, 1h, 1d",
    '',
    'Fetching metrics via cronjob every 10 minutes (delayed by 1 minute to be sure no logs are missed) and write it to a file:',
    'MacOS:',
    '1/10 * * * * <%= config.bin %> metrics exampleFunction --start=$(date -v0S -v-11M +%s000) --end=$(date -v0S -v-1M +%s000) -b=1d >> exampleFunction.log',
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
