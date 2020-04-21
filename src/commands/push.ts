import { Command, flags } from '@oclif/command';
import { PushController } from '../controller/push.controller';
import { parseInput } from '../shared/utils';

export default class Push extends Command {
  public static description =
    'Push local functions to the LivePerson functions platform';

  public static flags = {
    help: flags.help({ char: 'h' }),
    yes: flags.boolean({
      char: 'y',
      description:
        'Agrees to the approval of the push and prevents the confirmation dialog',
    }),
    'no-watch': flags.boolean({
      char: 'w',
      description: "Don't watch push process",
    }),
    all: flags.boolean({ char: 'a', description: 'Pushes all functions' }),
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
    const { flags: inputFlags } = this.parse(Push);
    const lambdaFunctions = parseInput(Push.flags, this.argv);
    this.pushController.push({ lambdaFunctions, inputFlags });
  }
}
