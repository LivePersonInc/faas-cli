/**
 * {@link https://github.com/chalk/chalk}
 */
const chalk = require('chalk');

/**
 * {@link https://www.npmjs.com/package/figlet}
 */
const figlet = require('figlet');

/**
 * {@link https://www.npmjs.com/package/node-emoji}
 */
const { emoji } = require('node-emoji');

/**
 * {@link https://github.com/oclif/cli-ux}
 */
const cliUX = require('cli-ux').cli;

export { ErrorMessage } from './error';
export { LogMessage } from './log';
export { Prompt } from './prompt';
export { TaskList } from './tasklist';
export { WarnMessage } from './warn';
export { chalk, figlet, emoji, cliUX };
