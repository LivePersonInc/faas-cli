import { Command, flags } from '@oclif/command';
import { LoginController } from '../controller/login.controller';

export class Login extends Command {
  public static description = 'Performs the login with LiveEngage Credentials';

  public static flags = {
    help: flags.help({ char: 'h', description: 'Shows help for the login' }),
    password: flags.string({ char: 'p', description: 'Password' }),
    username: flags.string({ char: 'u', description: 'Username' }),
    accountId: flags.string({ char: 'a', description: 'AccountId' }),
    token: flags.string({
      char: 't',
      description: 'Token for the SSO flow',
      hidden: true,
    }),
    userId: flags.string({
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
    const { flags: inputFlags } = this.parse(Login);
    this.loginController.loginByCommand({ inputFlags });
  }
}
