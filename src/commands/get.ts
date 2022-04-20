import { Command, Flags } from '@oclif/core';
import { GetController } from '../controller/get.controller';
import { parseInput } from '../shared/utils';

export default class Get extends Command {
  static description =
    'Get information about different domains (deployments, functions, account and events)';

  public static flags = {
    help: Flags.help({ char: 'h' }),
  };

  public static strict = false;

  public static args = [{ name: '...functions' }];

  public static examples = [
    '> <%= config.bin %> get account',
    '> <%= config.bin %> get functions deployments',
    '> <%= config.bin %> get functions deployments account',
    '> <%= config.bin %> get functions deployments account events',
  ];

  private getController: GetController = new GetController();

  /**
   * Runs the get command and parses the passed domains
   * @returns {Promise<void>} - get command
   * @memberof Get
   */
  public async run(): Promise<void> {
    try {
      const domains = parseInput(Get.flags, this.argv);
      await this.getController.get({ domains });
    } catch (error) {
      this.exit(1);
    }
  }
}
