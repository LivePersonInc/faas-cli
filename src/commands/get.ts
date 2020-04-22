import { Command, flags } from '@oclif/command';
import { GetController } from '../controller/get.controller';
import { parseInput } from '../shared/utils';

export default class Get extends Command {
  static description =
    'Get information about different domains (deployments, functions and account)';

  public static flags = {
    help: flags.help({ char: 'h' }),
  };

  public static strict = false;

  public static args = [{ name: '...functions' }];

  public static examples = [
    '> <%= config.bin %> get account',
    '> <%= config.bin %> get functions deployments',
    '> <%= config.bin %> get functions deployments account',
  ];

  private getController: GetController = new GetController();

  /**
   * Runs the get command and parses the passed domains
   * @returns {Promise<void>} - get command
   * @memberof Get
   */
  public async run(): Promise<void> {
    const domains = parseInput(Get.flags, this.argv);
    this.getController.get({ domains });
  }
}
