import { Hook, IConfig } from '@oclif/config';
import * as chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as semver from 'semver';
import latestVersion from 'latest-version';

import template = require('lodash.template');

/**
 * Parses the border so it will fit for longer or shorter version numbers
 * @param {string} message - message
 * @returns {string}
 */
function parseBorder(message: string): string {
  const [text] = message.match(/Update available .* /) as any[];
  const spaceToAdd = 70 - text.length;
  const spaces = ' '.repeat(spaceToAdd);
  return message.replace(text, text + spaces);
}

/**
 * Prints a update hint for the user if a newer version is available.
 * If the hint is displayed it will be muted for 2 days (configurable in the package.json).
 * It will save information about the versions in a version file in the cacheDir.
 * If the timeout is over, it will fetch the latest version from the repo and get the current version from the version file.
 * And if they are unequal it will print the update hint.
 * @export
 * @param {IConfig} config - passed config from the oclif framework
 * @returns {Promise<void>} - update hint
 */
export async function warnIfUpdateAvailable(config: IConfig): Promise<void> {
  const {
    timeoutInDays = 2,
    message = `
    ╔════════════════════════════════════════════════════╗
    ║                                                    ║
    ║  Update available <%= chalk.yellowBright(config.version) %> -> <%= chalk.greenBright(latest) %>.   ║
    ║  Run <%= chalk.greenBright('npm i -g liveperson-functions-cli') %> to update   ║
    ║                                                    ║
    ╚════════════════════════════════════════════════════╝
`,
    npmjsRegistry = 'liveperson-functions-cli',
  } = (config.pjson.oclif as any)['warn-if-update-available'] || {};

  const file = path.join(config.cacheDir, 'version');

  const checkVersion = async () => {
    const distTags = await fs.readJSON(file);
    /* istanbul ignore else */
    if (
      distTags &&
      distTags.latest &&
      semver.gt(distTags.latest.split('-')[0], config.version.split('-')[0])
    ) {
      const parsedTemplate = template(message)({
        chalk,
        config,
        ...distTags,
      });
      // eslint-disable-next-line no-console
      console.log(parseBorder(parsedTemplate));
    }
  };

  const refreshNeeded = async () => {
    try {
      const fileStats = await fs.stat(file);
      const { mtime } = fileStats;
      const staleAt = new Date(
        mtime.valueOf() + 1000 * 60 * 60 * 24 * timeoutInDays,
      );
      return staleAt < new Date();
    } catch (error) {
      return true;
    }
  };

  const doRefresh = async () => {
    await fs.outputJSON(file, { current: config.version });
    try {
      const response = await latestVersion(npmjsRegistry);
      const latest = semver.clean(response);
      await fs.outputJSON(file, { latest, current: config.version });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error during fetching latest npm version:', error.message);
    }
  };

  /* istanbul ignore else */
  if (await refreshNeeded()) {
    await doRefresh();
    await checkVersion();
  }
}

/**
 * Runs the a hook every time the CLI gets initialised
 * @param { config } - oclif configuration
 */
/* istanbul ignore next */
const hook: Hook<'init'> = async function ({ config }) {
  // need to seperate the function for the test,
  // because there is no context for the init command during the test
  /* istanbul ignore next */
  await warnIfUpdateAvailable(config);
};

export default hook;
