import { Command, flags } from '@oclif/command';
import { InitController } from '../controller/init.controller';
import { parseInput } from '../shared/utils';

export class Init extends Command {
  public static flags = {
    help: flags.help({
      char: 'h',
      description: 'Show help for the init command',
    }),
  };

  public static description = 'Initialize the project with the necessary data';

  public static strict = false;

  public static args = [{ name: '...functionNames' }];

  public static examples = [
    '> <%= config.bin %> init <functionname>',
    '> <%= config.bin %> init <functionname> <functionsname>',
  ];

  private initController: InitController = new InitController();

  /**
   * Runs the init command and parses the passed functions
   * @returns {Promise<void>} - init command
   * @memberof Init
   */
  public async run(): Promise<void> {
    const functionNames = parseInput(Init.flags, this.argv);
    this.initController.init({ functionNames });
  }
}
