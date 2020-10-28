import { Command, flags } from '@oclif/command';
import { CreateController } from '../../controller/create.controller';

export class Create extends Command {
  public static flags = {
    help: flags.help({
      char: 'h',
      description: 'Show help for the create command',
    }),
  };

  public static description = 'Create functions and schedules locally';

  public static strict = false;

  public static examples = [
    '> <%= config.bin %> create:function exampleFunction -e new_conversation',
  ];

  /**
   * Runs the create command and parses the passed functions
   * @returns {Promise<void>} - create command
   * @memberof Function
   */
  public async run(): Promise<void> {
    console.log(
      'Use --help to get more information on how to use the create command',
    );
  };
}
