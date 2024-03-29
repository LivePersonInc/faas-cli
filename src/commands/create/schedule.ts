import { Command, Flags } from '@oclif/core';
import { CreateController } from '../../controller/create.controller';

export class Schedule extends Command {
  public static flags = {
    help: Flags.help({
      char: 'h',
      description: 'Show help for the create command',
    }),
    functionName: Flags.string({
      char: 'f',
      description: 'name of (deployed) function which will be scheduled',
    }),
    cronExpression: Flags.string({
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
      } = await this.parse(Schedule);
      await this.createController.createSchedule({
        functionName,
        cronExpression,
      });
    } catch (error) {
      this.exit(1);
    }
  }
}
