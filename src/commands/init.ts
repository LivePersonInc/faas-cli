import { Command, Flags } from '@oclif/core';
import { InitController } from '../controller/init.controller';
import { parseInput } from '../shared/utils';

export class Init extends Command {
  public static flags = {
    help: Flags.help({
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
    try {
      const functionNames = parseInput(Init.flags, this.argv);
      await this.initController.init({ functionNames });
    } catch (error) {
      this.exit(1);
    }
  }
}
