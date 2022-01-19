import { Command, flags } from '@oclif/command';
import { LogsController } from '../controller/logs.controller';
import { parseInput } from '../shared/utils';
import { ErrorMessage } from '../view/printer';

export default class Logs extends Command {
  static description =
    'Download function logs as CSV (limited to the first 500 logs of the provided timespan)';

  static flags = {
    help: flags.help({ char: 'h' }),
    start: flags.string({
      char: 's',
      description: 'start timestamp',
      required: true,
    }),
    removeHeader: flags.boolean({
      char: 'r',
      description: 'Removes the header of the logs',
      default: false,
    }),
    end: flags.string({
      char: 'e',
      description: 'end timestamp (default current timestamp)',
    }),
    levels: flags.string({
      char: 'l',
      description:
        'log-levels - for multiple levels just use levels with space separated (e.g. -l Info Warn)',
      options: ['Info', 'Warn', 'Error'],
      multiple: true,
    }),
  };

  static args = [{ name: 'function-name' }];

  public static examples = [
    '> <%= config.bin %> logs exampleFunction --start=1626156400000',
    '> <%= config.bin %> logs exampleFunction --start=1626156400000 --end=1626157400000',
    '> <%= config.bin %> logs exampleFunction --start=1626156400000 --levels=Info Warn',
    '',
    'For redirecting logs to a file:',
    'logs exampleFunction --start=1626156400000 > exampleFunction.log',
    '',
    'Fetching logs via cronjob every 10 minutes (delayed by 1 minute to be sure no logs are missed) and write it to a file:',
    'MacOS:',
    '1/10 * * * * <%= config.bin %> logs exampleFunction --start=$(date -v0S -v-11M +%s000) --end=$(date -v0S -v-1M +%s000) >> exampleFunction.log',
  ];

  private errorMessage = new ErrorMessage();

  /**
   * Runs the invoke command and parses the passed function and flag
   * @returns {Promise<void>} - invoke command
   * @memberof Invoke
   */
  public async run(): Promise<void> {
    try {
      const { flags: inputFlags } = this.parse(Logs);
      const [lambdaFunction] = parseInput(Logs.flags, this.argv);
      await LogsController.getLogs({ lambdaFunction, inputFlags });
    } catch (error) {
      this.errorMessage.print(error.message || error.errorMsg);
      this.exit(1);
    }
  }
}
