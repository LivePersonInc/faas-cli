import { Hook } from '@oclif/core';
import * as semver from 'semver';
import chalk = require('chalk');
import { factory } from '../../service/faasFactory.service';

/**
 * Hook which will run if the invoke command was triggered.
 * Will display the difference of the remote and local node.js version
 * @param {*} opts - passed options from the oclif framework
 * @returns {Promise<void>} - update version hint
 */
export async function nodeVersion(
  opts,
  /* istanbul ignore next */ version = process.version,
): Promise<void> {
  /* istanbul ignore else */
  if (opts.id === 'invoke') {
    try {
      const userNodeVersion = semver.major(semver.clean(version) as string);
      // TODO get proper version of runtime
      const remoteVersion = '22.0.0';
      /* istanbul ignore else */
      if (userNodeVersion > Number.parseInt(remoteVersion, 10)) {
        // eslint-disable-next-line no-console
        console.log(
          `Please be aware that your Node.js (${chalk.yellowBright(
            `v${userNodeVersion}`,
          )}) version is higher than the one on the LivePerson functions platform (${chalk.green(
            `v${remoteVersion}`,
          )})!
  ${chalk.yellowBright('This can cause unexpected behaviour!')}
  `,
        );
      }
    } catch {
      /* eslint-disable no-console */
      /* istanbul ignore next */
      console.log(
        'Could not fetch runtime version from LivePerson Functions platform',
      );
      /* eslint-enable no-console */
    }
  }
}

/**
 * Runs the a hook every time the CLI gets initialised
 * @param { config } - oclif configuration
 */
/* istanbul ignore next */
const hook: Hook<'init'> = async function nodeVersionHook(opts) {
  // need to separate the function for the test,
  // because there is no context for the init command during the test
  /* istanbul ignore next */
  await nodeVersion(opts);
};

export default hook;
