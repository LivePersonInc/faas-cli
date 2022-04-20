import { Command, Flags } from '@oclif/core';
import { UndeployController } from '../controller/deployment/undeploy.controller';
import { parseInput } from '../shared/utils';

export default class Undeploy extends Command {
  public static description =
    'Undeploys a function or multiple functions on the LivePerson Functions platform';

  public static flags = {
    help: Flags.help({ char: 'h' }),
    yes: Flags.boolean({
      char: 'y',
      description:
        'Agrees to the approval of the undeployment and prevents the confirmation dialog',
    }),
    'no-watch': Flags.boolean({
      char: 'w',
      description: "Don't watch undeployment process",
    }),
  };

  public static strict = false;

  public static args = [{ name: '...functions' }];

  public static examples = [
    '> <%= config.bin %> undeploy exampleFunction',
    '> <%= config.bin %> undeploy exampleFunction --yes --no-watch',
    '> <%= config.bin %> undeploy exampleFunction1 exampleFunction2 -y -w',
  ];

  private undeployController: UndeployController = new UndeployController();

  /**
   * Runs the undeploy command and parses the passed functions and flags
   * @returns {Promise<void>} - undeploy command
   * @memberof Undeploy
   */
  public async run(): Promise<void> {
    try {
      const { flags: inputFlags } = await this.parse(Undeploy);
      const lambdaFunctions = parseInput(Undeploy.flags, this.argv);
      await this.undeployController.undeploy({ lambdaFunctions, inputFlags });
    } catch (error) {
      this.exit(1);
    }
  }
}
