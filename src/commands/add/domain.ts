import { Command, flags } from '@oclif/command';
import { AddController } from '../../controller/add.controller';
import { parseInput } from '../../shared/utils';

export class Domain extends Command {
  public static flags = {
    help: flags.help({
      char: 'h',
      description: 'Show help for the add:domain command',
    }),
  };

  public static description = `"Adds a domain to your account's whitelist. Domains containing * wildcards have to be enclosed in ""`;

  public static strict = false;

  public static args = [{ name: '"...domainURLs"' }];

  public static examples = [
    '> <%= config.bin %> add:domain',
    '> <%= config.bin %> add:domain "*.liveperson.com"',
    '> <%= config.bin %> add:domain "*.liveperson.com" a-domain.co.uk',
  ];

  private addController: AddController = new AddController();

  /**
   * Runs the create command and parses the passed functions
   * @returns {Promise<void>} - create command
   * @memberof Domain
   */
  public async run(): Promise<void> {
    try {
      const domains = parseInput(Domain.flags, this.argv);
      await this.addController.addDomains(domains);
    } catch (error) {
      this.exit(1);
    }
  }
}
