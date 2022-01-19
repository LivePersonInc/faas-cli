import { Command, flags } from '@oclif/command';
import { CreateController } from '../../controller/create.controller';

export class Function extends Command {
  public static flags = {
    help: flags.help({
      char: 'h',
      description: 'Show help for the create command',
    }),
    name: flags.string({
      char: 'n',
      description: 'name of function, allowed characters: A-Z, 0-9, _',
    }),
    description: flags.string({
      char: 'd',
      description: 'description of function, allowed characters: A-Z, 0-9, _',
    }),
    event: flags.string({
      char: 'e',
      description: 'ID of event, use <lpf get events> for more information',
    }),
  };

  public static description = 'Create functions locally';

  public static strict = false;

  public static examples = [
    '> <%= config.bin %> create:function',
    '> <%= config.bin %> create:function -n exampleFunction -d "This is an example description"',
    '> <%= config.bin %> create:function -n exampleFunction -e bot_connectors_custom_integration',
  ];

  private createController: CreateController = new CreateController();

  /**
   * Runs the create command and parses the passed functions
   * @returns {Promise<void>} - create command
   * @memberof Function
   */
  public async run(): Promise<void> {
    try {
      const {
        flags: { name, event, description },
      } = this.parse(Function);
      await this.createController.createFunction({
        name,
        event,
        description,
      });
    } catch (error) {
      this.exit(1);
    }
  }
}
