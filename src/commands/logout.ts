import { Command, Flags } from '@oclif/core';
import { LogoutController } from '../controller/logout.controller';

export default class Logout extends Command {
  public static description = 'Performs the logout of your account';

  public static flags = {
    help: Flags.help({ char: 'h' }),
    accountId: Flags.string({
      char: 'a',
      description: 'Account which will be logged out',
    }),
    delete: Flags.boolean({
      char: 'd',
      description: 'Deletes the account credentials from the local machine',
    }),
  };

  public static examples = [
    '> <%= config.bin %> logout',
    '> <%= config.bin %> logout --accountId 123456789',
    '> <%= config.bin %> logout --accountId 123456789 --delete',
    '> <%= config.bin %> logout -a 123456789 -d',
  ];

  private logoutController: LogoutController = new LogoutController();

  /**
   * Runs the logout command and parses the passed flags
   * @returns {Promise<void>} - logout command
   * @memberof Logout
   */
  async run(): Promise<void> {
    try {
      const { flags: inputFlags } = await this.parse(Logout);
      this.logoutController.logout(inputFlags);
    } catch (error) {
      this.exit(1);
    }
  }
}
