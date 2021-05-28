import { Command, flags } from '@oclif/command';
import { CreateController } from '../../controller/create.controller';

export class Schedule extends Command {
  public static flags = {
    help: flags.help({
      char: 'h',
      description: 'Show help for the create command',
    }),
    functionName: flags.string({
      char: 'f',
      description: 'name of (deployed) function which will be scheduled',
    }),
    cronExpression: flags.string({
      char: 'c',
      description: 'Cron Expression',
    }),
  };

  public static description =
    'Creates schedules on currently logged-in account';

  public static strict = false;

  public static examples = [
    '> <%= config.bin %> create:schedule',
    '> <%= config.bin %> create:schedule -f exampleFunction',
    '> <%= config.bin %> create:schedule -f exampleFunction -c "* * * * *"',
    '> <%= config.bin %> create:schedule -f exampleFunction -c "*/3 * * 0-12 *"',
  ];

  private createController: CreateController = new CreateController();

  /**
   * Runs the create command and parses the passed functions
   * @returns {Promise<void>} - create command
   * @memberof Schedule
   */
  public async run(): Promise<void> {
    try {
      const {
        flags: { functionName, cronExpression },
      } = this.parse(Schedule);
      await this.createController.createSchedule({
        functionName,
        cronExpression,
      });
    } catch (error) {
      this.error(error.message, { ...error, exit: 1 });
    }
  }
}
