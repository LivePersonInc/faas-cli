/* eslint-disable no-console */
import { Hook } from '@oclif/core';
import chalk = require('chalk');
import { FileService } from '../../service/file.service';
import { ITempFile } from '../../controller/login.controller';

// Commands that can be called offline or don't have v2 information yet
const v2notRequiredCommands = ['login', 'logout', 'init'];

/**
 * Hook which will run before any command except 'login'.
 * Checks if the account is migrated to Functions v2 and displays
 * a downgrade message if not migrated.
 * @param {*} opts - passed options from the oclif framework
 * @returns {Promise<void>} - migration check
 */
export async function checkV2Migration(opts): Promise<void> {
  if (v2notRequiredCommands.includes(opts.id)) {
    return;
  }

  try {
    const fileService = new FileService();
    const tempFile = (await fileService.getTempFile()) as ITempFile;
    const activeAccountId: string = Object.keys(tempFile).find(
      (e) => tempFile[e].active,
    );

    const isV2Available = tempFile[activeAccountId].isV2;

    if (!isV2Available) {
      console.log('');
      console.log(
        `${chalk.red('⚠ Account Migration Required')}
        
Your account is not yet migrated to Functions v2. Please downgrade the CLI to be compatible with your LivePerson Functions Account. If you have recently migrated try logout and login again.

${chalk.yellowBright('To downgrade try:')} ${chalk.cyan(
          'npm install -g liveperson-functions-cli@1.31.3',
        )}

`,
      );
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  } catch (error) {
    console.log(
      chalk.yellow('Warning: Could not verify Functions v2 migration status'),
    );
  }
}

/**
 * Runs the migration check hook every time the CLI gets initialised
 * @param opts - oclif hook options
 */
const hook: Hook<'init'> = async function v2MigrationHook(opts) {
  await checkV2Migration(opts);
};

export default hook;
