import { Command, Flags } from '@oclif/core';
import { PushController } from '../controller/push.controller';
import { parseInput } from '../shared/utils';

export default class Push extends Command {
  public static description =
    'Push local functions to the LivePerson functions platform';

  public static flags = {
    help: Flags.help({ char: 'h' }),
    yes: Flags.boolean({
      char: 'y',
      description:
        'Agrees to the approval of the push and prevents the confirmation dialog',
    }),
    'no-watch': Flags.boolean({
      char: 'w',
      description: "Don't watch push process",
    }),
    all: Flags.boolean({ char: 'a', description: 'Pushes all functions' }),
  };

  public static strict = false;

  public static args = [{ name: '...functions' }];

  public static examples = [
    '> <%= config.bin %> push exampleFunction',
    '> <%= config.bin %> push exampleFunction --yes --no-watch',
    '> <%= config.bin %> push exampleFunction1 exampleFunction2 -y -w',
  ];

  private pushController: PushController = new PushController();

  public async run(): Promise<void> {
    try {
      const { flags: inputFlags } = await this.parse(Push);
      const lambdaFunctions = parseInput(Push.flags, this.argv);
      await this.pushController.push({ lambdaFunctions, inputFlags });
    } catch (error) {
      this.exit(1);
    }
  }
}
