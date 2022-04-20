import { Command, Flags } from '@oclif/core';
import { LoginController } from '../controller/login.controller';

export class Login extends Command {
  public static description = 'Performs the login with LiveEngage Credentials';

  public static flags = {
    help: Flags.help({ char: 'h', description: 'Shows help for the login' }),
    password: Flags.string({ char: 'p', description: 'Password' }),
    username: Flags.string({ char: 'u', description: 'Username' }),
    accountId: Flags.string({ char: 'a', description: 'AccountId' }),
    token: Flags.string({
      char: 't',
      description: 'Token for the SSO flow',
      hidden: true,
    }),
    userId: Flags.string({
      char: 'i',
      description: 'UserId for the SSO flow',
      hidden: true,
    }),
  };

  public static examples = [
    '> <%= config.bin %> login',
    '> <%= config.bin %> login --accountId 123456789 --username user@liveperson.com --password p4ssw0rd',
    '> <%= config.bin %> login -a 123456789 -u user@liveperson.com -p p4ssw0rd',
  ];

  private loginController: LoginController = new LoginController();

  /**
   * Runs the login command and parses the passed flags
   * @returns {Promise<void>} - login command
   * @memberof Login
   */
  public async run(): Promise<void> {
    try {
      const { flags: inputFlags } = await this.parse(Login);
      await this.loginController.loginByCommand({ inputFlags });
    } catch (error) {
      this.exit(1);
    }
  }
}
