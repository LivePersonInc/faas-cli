import { Command, Flags } from '@oclif/core';
import { InvokeController } from '../controller/invoke.controller';
import { parseInput } from '../shared/utils';

export default class Invoke extends Command {
  public static description = 'Invokes a function';

  public static flags = {
    help: Flags.help({ char: 'h' }),
    local: Flags.boolean({
      char: 'l',
      description:
        'Invokes the function locally with the input from the config.json',
    }),
  };

  public static strict = false;

  public static args = [{ name: '...functionNames' }];

  public static examples = [
    '> <%= config.bin %> invoke exampleFunction',
    '> <%= config.bin %> invoke exampleFunction --local',
    '> <%= config.bin %> invoke exampleFunction -l',
  ];

  private invokeController: InvokeController = new InvokeController();

  /**
   * Runs the invoke command and parses the passed function and flag
   * @returns {Promise<void>} - invoke command
   * @memberof Invoke
   */
  public async run(): Promise<void> {
    try {
      const { flags: inputFlags } = await this.parse(Invoke);
      const lambdaFunctions = parseInput(Invoke.flags, this.argv);
      await this.invokeController.invoke({ lambdaFunctions, inputFlags });
    } catch (error) {
      this.exit(1);
    }
  }
}
