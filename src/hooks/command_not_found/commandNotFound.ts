/* eslint-disable no-console */
import { color } from '@oclif/color';
import { Hook } from '@oclif/core';
import * as Levenshtein from 'fast-levenshtein';
import * as _ from 'lodash';

/**
 * Prints a warning to the user if the command is not found.
 * Copy of the plugin-not-found with little adjustments (Plugin doesn't work anymore)
 * {@link https://github.com/oclif/plugin-not-found}
 * @example output for lpf logi
 * Warning: logi is not a lpf command.
 * Suggestion: login
 * Run lpf help for a list of available commands.
 * @export
 * @param {*} opts - oclif config
 * @returns {Promise<void>}
 */
export async function commandNotFound(opts): Promise<void> {
  const commandIDs = [
    ...opts.config.commandIDs,
    ..._.flatten(opts.config.commands.map((c) => c.aliases)),
    'version',
  ];

  function closest(cmd: string) {
    return _.minBy(commandIDs, (c) => Levenshtein.get(cmd, c))!;
  }

  const binHelp = `${opts.config.bin} help`;

  const suggestion: string = closest(opts.id);
  console.log(`Warning: ${color.yellow(opts.id)} is not a ${
    opts.config.bin
  } command.
Suggestion: ${color.blueBright(suggestion)}
Run ${color.cmd(binHelp)} for a list of available commands.`);
}

/**
 * Runs the a hook every time the CLI cannot found a command
 * @param { opts } - oclif configuration
 */
/* istanbul ignore next */
const hook: Hook<'command_not_found'> = async function commandNotFoundHook(
  opts,
) {
  // need to separate the function for the test,
  // because there is no context for the command_not_found during the test
  /* istanbul ignore next */
  await commandNotFound(opts);
  /* istanbul ignore next */
  this.exit(0);
};

export default hook;
