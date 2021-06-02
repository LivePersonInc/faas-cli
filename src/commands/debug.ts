import { Command, flags } from '@oclif/command';
import { DebugController } from '../controller/debug.controller';
import { parseInput } from '../shared/utils';

export default class Debug extends Command {
  public static description =
    'Starts a debug port on 1337 for the provided function';

  public static flags = {
    help: flags.help({ char: 'h' }),
  };

  public static strict = false;

  public static args = [{ name: '...functions' }];

  public static examples = ['> <%= config.bin %> debug exampleFunction'];

  private debugController: DebugController = new DebugController();

  /**
   * Runs the debug command and parses the passed functions
   * @returns {Promise<void>} - debug command
   * @memberof Debug
   */
  public async run(): Promise<void> {
    try {
      const lambdaFunctions = parseInput(Debug.flags, this.argv);
      await this.debugController.debug({ lambdaFunctions });
    } catch (error) {
      this.exit(1);
    }
  }
}
