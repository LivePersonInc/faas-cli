import { Command, Flags } from '@oclif/core';
import { CreateView } from '../../view/create.view';

export class Add extends Command {
  private readonly msg =
    'Use --help to get more information on how to use the create command';

  private readonly view = new CreateView();

  public static flags = {
    help: Flags.help({
      char: 'h',
      description: 'Show help for the Add command',
    }),
  };

  public static description = 'Add and change configurations of your account';

  public static strict = false;

  public static examples = [
    '> <%= config.bin %> add:domain "*.liveperson.com"',
  ];

  /**
   * Runs the create command and parses the passed functions
   * @returns {Promise<void>} - create command
   * @memberof Add
   */
  public async run(): Promise<void> {
    this.view.showMessage(this.msg);
  }
}
