import { Command, flags } from '@oclif/command';
import { PullController } from '../controller/pull.controller';
import { parseInput } from '../shared/utils';

export default class Pull extends Command {
  public static description =
    'Pull a function or multiple from the LivePerson Functions platform to the local machine';

  public static flags = {
    help: flags.help({ char: 'h' }),
    yes: flags.boolean({
      char: 'y',
      description:
        'Agrees to the approval of the pull command and prevents the confirmation dialog.',
    }),
    'no-watch': flags.boolean({
      char: 'w',
      description: "Don't watch pull process",
    }),
    all: flags.boolean({
      char: 'a',
      description: 'Pulls all functions from the platform',
    }),
  };

  public static strict = false;

  public static args = [{ name: '...functions' }];

  public static examples = [
    '> <%= config.bin %> pull exampleFunction',
    '> <%= config.bin %> pull exampleFunction --yes --no-watch',
    '> <%= config.bin %> pull exampleFunction1 exampleFunction2 -y -w',
  ];

  private pullController: PullController = new PullController();

  /**
   * Runs the debug command and parses the passed functions and flags
   * @returns {Promise<void>} - pull command
   * @memberof Pull
   */
  public async run(): Promise<void> {
    try {
      const { flags: inputFlags } = this.parse(Pull);
      const lambdaFunctions = parseInput(Pull.flags, this.argv);
      await this.pullController.pull({ lambdaFunctions, inputFlags });
    } catch (error) {
      this.exit(1);
    }
  }
}
