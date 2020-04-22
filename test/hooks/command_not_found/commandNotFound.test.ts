import { commandNotFound } from '../../../src/hooks/command_not_found/commandNotFound';

const optsWithCommands = {
  id: 'logi',
  config: {
    bin: 'lpf',
    commandIDs: [
      'debug',
      'deploy',
      'get',
      'init',
      'invoke',
      'login',
      'logout',
      'pull',
      'push',
      'undeploy',
      'help',
      'autocomplete',
      'autocomplete:create',
      'autocomplete:script',
    ],
    commands: [
      {
        id: 'debug',
        description: 'Starts a debug port on 1337 for the provided function',
        pluginName: 'faas-cli',
        pluginType: 'core',
        aliases: [],
        flags: {
          help: {
            name: 'help',
            type: 'boolean',
            char: 'h',
            description: 'show CLI help',
            allowNo: false,
          },
        },
        args: [
          {
            name: '...functions',
          },
        ],
      },
      {
        id: 'deploy',
        description:
          'Deploys a function or multiple functions on the LivePerson Functions platform',
        pluginName: 'faas-cli',
        pluginType: 'core',
        aliases: [],
        flags: {
          help: {
            name: 'help',
            type: 'boolean',
            char: 'h',
            description: 'show CLI help',
            allowNo: false,
          },
          yes: {
            name: 'yes',
            type: 'boolean',
            char: 'y',
            description:
              'Agrees to the approval of the deployment and prevents the confirmation dialog',
            allowNo: false,
          },
          'no-watch': {
            name: 'no-watch',
            type: 'boolean',
            char: 'w',
            description: "Don't watch deployment process",
            allowNo: false,
          },
        },
        args: [
          {
            name: '...functions',
          },
        ],
      },
      {
        id: 'get',
        description:
          'Get information about different domains (deployments, functions and account)',
        pluginName: 'faas-cli',
        pluginType: 'core',
        aliases: [],
        flags: {
          help: {
            name: 'help',
            type: 'boolean',
            char: 'h',
            description: 'show CLI help',
            allowNo: false,
          },
        },
        args: [
          {
            name: '...functions',
          },
        ],
      },
      {
        id: 'init',
        description: 'Initialize the project with the necessary data',
        pluginName: 'faas-cli',
        pluginType: 'core',
        aliases: [],
        flags: {
          help: {
            name: 'help',
            type: 'boolean',
            char: 'h',
            description: 'Show help for the init command',
            allowNo: false,
          },
        },
        args: [
          {
            name: '...functionNames',
          },
        ],
      },
      {
        id: 'invoke',
        description: 'Invokes a function',
        pluginName: 'faas-cli',
        pluginType: 'core',
        aliases: [],
        flags: {
          help: {
            name: 'help',
            type: 'boolean',
            char: 'h',
            description: 'show CLI help',
            allowNo: false,
          },
          local: {
            name: 'local',
            type: 'boolean',
            char: 'l',
            description:
              'Invokes the function locally with the input from the config.json',
            allowNo: false,
          },
        },
        args: [
          {
            name: '...functionNames',
          },
        ],
      },
      {
        id: 'login',
        description: 'Performs the login with LiveEngage Credentials',
        pluginName: 'faas-cli',
        pluginType: 'core',
        aliases: [],
        flags: {
          help: {
            name: 'help',
            type: 'boolean',
            char: 'h',
            description: 'Shows help for the login',
            allowNo: false,
          },
          password: {
            name: 'password',
            type: 'option',
            char: 'p',
            description: 'Password',
          },
          username: {
            name: 'username',
            type: 'option',
            char: 'u',
            description: 'Username',
          },
          accountId: {
            name: 'accountId',
            type: 'option',
            char: 'a',
            description: 'AccountId',
          },
        },
        args: [],
      },
      {
        id: 'logout',
        description: 'Performs the logout of your account',
        pluginName: 'faas-cli',
        pluginType: 'core',
        aliases: [],
        flags: {
          help: {
            name: 'help',
            type: 'boolean',
            char: 'h',
            description: 'show CLI help',
            allowNo: false,
          },
          accountId: {
            name: 'accountId',
            type: 'option',
            char: 'a',
            description: 'Account which will be logged out',
          },
          delete: {
            name: 'delete',
            type: 'boolean',
            char: 'd',
            description:
              'Deletes the account credentials from the local machine',
            allowNo: false,
          },
        },
        args: [],
      },
      {
        id: 'pull',
        description: 'Pull a function from the platform to the local machine',
        pluginName: 'faas-cli',
        pluginType: 'core',
        aliases: [],
        flags: {
          help: {
            name: 'help',
            type: 'boolean',
            char: 'h',
            description: 'show CLI help',
            allowNo: false,
          },
          yes: {
            name: 'yes',
            type: 'boolean',
            char: 'y',
            description:
              'Agrees to the approval of the pull command and prevents the confirmation dialog.',
            allowNo: false,
          },
          'no-watch': {
            name: 'no-watch',
            type: 'boolean',
            char: 'n',
            description: "Don't watch pull process",
            allowNo: false,
          },
          all: {
            name: 'all',
            type: 'boolean',
            char: 'a',
            description: 'Pulls all functions from the platform',
            allowNo: false,
          },
        },
        args: [
          {
            name: '...functions',
          },
        ],
      },
      {
        id: 'push',
        description:
          'Push local functions to the LivePerson functions platform',
        pluginName: 'faas-cli',
        pluginType: 'core',
        aliases: [],
        flags: {
          help: {
            name: 'help',
            type: 'boolean',
            char: 'h',
            description: 'show CLI help',
            allowNo: false,
          },
          yes: {
            name: 'yes',
            type: 'boolean',
            char: 'y',
            description:
              'Agrees to the approval of the push and prevents the confirmation dialog',
            allowNo: false,
          },
          'no-watch': {
            name: 'no-watch',
            type: 'boolean',
            char: 'w',
            description: "Don't watch push process",
            allowNo: false,
          },
          all: {
            name: 'all',
            type: 'boolean',
            char: 'a',
            description: 'Pushes all functions',
            allowNo: false,
          },
        },
        args: [
          {
            name: '...functions',
          },
        ],
      },
      {
        id: 'undeploy',
        description:
          'Undeploys a function or multiple functions on the LivePerson Functions platform',
        pluginName: 'faas-cli',
        pluginType: 'core',
        aliases: [],
        flags: {
          help: {
            name: 'help',
            type: 'boolean',
            char: 'h',
            description: 'show CLI help',
            allowNo: false,
          },
          yes: {
            name: 'yes',
            type: 'boolean',
            char: 'y',
            description:
              'Agrees to the approval of the undeployment and prevents the confirmation dialog',
            allowNo: false,
          },
          'no-watch': {
            name: 'no-watch',
            type: 'boolean',
            char: 'w',
            description: "Don't watch undeployment process",
            allowNo: false,
          },
        },
        args: [
          {
            name: '...functions',
          },
        ],
      },
      {
        id: 'help',
        description: 'display help for <%= config.bin %>',
        pluginName: '@oclif/plugin-help',
        pluginType: 'core',
        aliases: [],
        flags: {
          all: {
            name: 'all',
            type: 'boolean',
            description: 'see all commands in CLI',
            allowNo: false,
          },
        },
        args: [
          {
            name: 'command',
            description: 'command to show help for',
            required: false,
          },
        ],
      },
      {
        id: 'autocomplete',
        description: 'display autocomplete installation instructions',
        pluginName: '@oclif/plugin-autocomplete',
        pluginType: 'core',
        aliases: [],
        examples: [
          '$ <%= config.bin %> autocomplete',
          '$ <%= config.bin %> autocomplete bash',
          '$ <%= config.bin %> autocomplete zsh',
          '$ <%= config.bin %> autocomplete --refresh-cache',
        ],
        flags: {
          'refresh-cache': {
            name: 'refresh-cache',
            type: 'boolean',
            char: 'r',
            description: 'Refresh cache (ignores displaying instructions)',
            allowNo: false,
          },
        },
        args: [
          {
            name: 'shell',
            description: 'shell type',
            required: false,
          },
        ],
      },
      {
        id: 'autocomplete:create',
        description:
          'create autocomplete setup scripts and completion functions',
        pluginName: '@oclif/plugin-autocomplete',
        pluginType: 'core',
        hidden: true,
        aliases: [],
        flags: {},
        args: [],
      },
      {
        id: 'autocomplete:script',
        description: 'outputs autocomplete config script for shells',
        pluginName: '@oclif/plugin-autocomplete',
        pluginType: 'core',
        hidden: true,
        aliases: [],
        flags: {},
        args: [
          {
            name: 'shell',
            description: 'shell type',
            required: false,
          },
        ],
      },
    ],
  },
};

describe('command not found', () => {
  const consoleSpy = jest.spyOn(global.console, 'log').mockImplementation();

  it('should show a warning message with suggestion', async () => {
    await commandNotFound(optsWithCommands);

    expect(consoleSpy).toBeCalledWith(expect.stringMatching(/Warning:/));
    expect(consoleSpy).toBeCalledWith(expect.stringMatching(/Suggestion/));
    expect(consoleSpy).toBeCalledWith(
      expect.stringMatching(/for a list of available commands/),
    );
  });
});
