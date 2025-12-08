/* eslint-disable import/first */
import { defineFeature, loadFeature } from 'jest-cucumber';
import * as fs from 'fs-extra';
import * as os from 'os';
import { join } from 'path';

beforeAll(() => {
  jest.resetAllMocks();
});

jest.mock('../../../src/service/faas.service', () =>
  jest.requireActual('../../__mocks__/faas.service.ts'),
);
jest.mock('../../../src/service/faasFactory.service', () =>
  jest.requireActual('../../__mocks__/faasFactory.service.ts'),
);

import { InvokeController } from '../../../src/controller/invoke.controller';
import { FileService } from '../../../src/service/file.service';
import { DefaultStructureService } from '../../../src/service/defaultStructure.service';
import { InitView } from '../../../src/view/init.view';
import { InitController } from '../../../src/controller/init.controller';

const feature = loadFeature('test/commands/invoke/invoke.feature');
defineFeature(feature, (test) => {
  jest.setTimeout(100000);
  const testDir = join(__dirname, 'test');
  let consoleSpy;
  const fileService = new FileService();

  jest.spyOn(process.stdout, 'write').mockImplementation();

  beforeEach(() => {
    consoleSpy = jest.spyOn(global.console, 'log').mockImplementation();
    jest.spyOn(process, 'cwd').mockReturnValue(testDir);
    jest.spyOn(os, 'tmpdir').mockReturnValue(testDir);
    fs.ensureDirSync(testDir);
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
  });

  afterEach(() => {
    consoleSpy = undefined;
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
    fs.removeSync(testDir);
  });

  test('Invoke a function remote', ({ given, when, then }) => {
    given('I have done the local init', () => {
      fs.ensureDirSync(join(testDir, 'functions', 'InvokeFunctionRemote'));
    });

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_invoke_remote_success',
          username: 'invoke@liveperson.com',
          active: true,
        },
      });
    });

    given(
      'The function is created on the platform and I have the same local with a config.json',
      () => {
        fs.writeFileSync(
          join(testDir, 'functions', 'InvokeFunctionRemote', 'config.json'),
          JSON.stringify({
            name: 'InvokeFunctionRemote',
            event: null,
            input: {
              headers: [],
              payload: {},
            },
            environmentVariables: [
              {
                key: '',
                value: '',
              },
            ],
          }),
        );
        fs.writeFileSync(
          join(testDir, 'functions', 'InvokeFunctionRemote', 'index.js'),
          JSON.stringify({}),
        );
      },
    );

    when('I run the invoke command and pass the function name', async () => {
      const invokeController = new InvokeController();
      await invokeController.invoke({
        lambdaFunctions: ['InvokeFunctionRemote'],
      });
    });

    then(
      'It should invoke the function and print the logs to the console',
      () => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringMatching(/StatusCode: 200/),
        );
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Info/));
      },
    );
  });
  test('Invoke a function remote with no function created on the platform', ({
    given,
    when,
    then,
  }) => {
    given('I have done the local init', () => {
      fs.ensureDirSync(
        join(testDir, 'functions', 'InvokeFunctionRemoteNotFound'),
      );
    });

    given('The function is not created on the platform', () => {
      fs.writeFileSync(
        join(
          testDir,
          'functions',
          'InvokeFunctionRemoteNotFound',
          'config.json',
        ),
        JSON.stringify({
          name: 'InvokeFunctionRemoteNotFound',
          event: null,
          input: {
            headers: [],
            payload: {},
          },
          environmentVariables: [
            {
              key: '',
              value: '',
            },
          ],
        }),
      );
    });

    when('I run the invoke command and pass the function name', async () => {
      const invokeController = new InvokeController();
      await invokeController.invoke({
        lambdaFunctions: ['InvokeFunctionRemoteNotFound'],
      });
    });

    then(
      'It should print in error message which tells me that the function is not created on the platform',
      () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringMatching(
            /Function InvokeFunctionRemoteNotFound were not found on the platform/,
          ),
        );
      },
    );
  });

  test('Invoke a function local', async ({ given, when, then }) => {
    given('I have done the local init', () => {
      fs.ensureDirSync(join(testDir, 'functions', 'InvokeFunctionLocal'));
    });

    given('I have a local function with the config.json', () => {
      fs.writeFileSync(
        join(testDir, 'functions', 'InvokeFunctionLocal', 'config.json'),
        JSON.stringify({
          name: 'InvokeFunctionLocal',
          event: null,
          input: {
            headers: [],
            payload: {},
          },
          environmentVariables: [
            {
              key: 'TestKey',
              value: 'TestValue',
            },
          ],
        }),
      );
      fs.writeFileSync(
        join(testDir, 'functions', 'InvokeFunctionLocal', 'index.js'),
        `function lambda(input, callback) {
  callback(null, 'Hello World');
}
`,
      );
      fs.copySync(
        join(
          process.cwd(),
          '..',
          '..',
          '..',
          '..',
          'bin',
          'example',
          'bin',
          'rewire.js',
        ),
        join(testDir, 'bin', 'rewire.js'),
      );
    });

    when(
      'I run the invoke command and pass the function name and local flag',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const invokeController = new InvokeController();
        await invokeController.invoke({
          lambdaFunctions: ['InvokeFunctionLocal'],
          inputFlags: { local: true },
        });
      },
    );

    then('It should set the passed env variables', () => {
      const containsTestKey = Object.keys(process.env).some(
        (e) => e === 'TestKey',
      );
      expect(containsTestKey).toBeTruthy();
    });

    then(
      'It invokes the command local and print the logs to the console',
      () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringContaining('Hello World'),
        );
      },
    );
  });

  test('Invoke a function local and an update of the bin folder is required', ({
    given,
    when,
    then,
  }) => {
    fs.ensureDirSync(testDir);
    fs.writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        version: '1.0.0',
      }),
    );
    fs.ensureDirSync(join(testDir, 'bin', 'lp-faas-toolbelt'));
    fs.writeFileSync(
      join(testDir, 'bin', 'lp-faas-toolbelt', 'package.json'),
      JSON.stringify({
        version: '0.0.9',
      }),
    );

    given('I have done the local init', () => {
      fs.ensureDirSync(join(testDir, 'functions', 'InvokeFunctionLocal'));
    });

    given('I have a local function with the config.json', () => {
      fs.writeFileSync(
        join(testDir, 'functions', 'InvokeFunctionLocal', 'config.json'),
        JSON.stringify({
          name: 'InvokeFunctionLocal',
          event: null,
          input: {
            headers: [],
            payload: {},
          },
          environmentVariables: [
            {
              key: 'TestKey',
              value: 'TestValue',
            },
          ],
        }),
      );
      fs.writeFileSync(
        join(testDir, 'functions', 'InvokeFunctionLocal', 'index.js'),
        `function lambda(input, callback) {
  callback(null, 'Hello World');
}
`,
      );
      fs.copySync(
        join(
          process.cwd(),
          '..',
          '..',
          '..',
          '..',
          'bin',
          'example',
          'bin',
          'rewire.js',
        ),
        join(testDir, 'bin', 'rewire.js'),
      );
    });

    when(
      'I run the invoke command and pass the function name and local flag',
      async () => {
        process.env.DEBUG_PATH = 'true';

        const mockFileService = new FileService({
          dirname: join(testDir, 'test', 'test'),
        });

        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'lp-faas-toolbelt', 'package.json'),
          );
        });
        const initView = new InitView({ defaultStructureService });
        const initController = new InitController({
          initView,
        });

        const invokeController = new InvokeController({
          initController,
          fileService: mockFileService,
        });
        await invokeController.invoke({
          lambdaFunctions: ['InvokeFunctionLocal'],
          inputFlags: { local: true },
        });
      },
    );

    then('It should set the passed env variables', () => {
      const containsTestKey = Object.keys(process.env).some(
        (e) => e === 'TestKey',
      );
      expect(containsTestKey).toBeTruthy();
    });

    then('Bin folder gets updated', async () => {
      const toolbeltPackage = JSON.parse(
        await fs.readFile(
          join(testDir, 'bin', 'lp-faas-toolbelt', 'package.json'),
          'utf8',
        ),
      );
      expect(toolbeltPackage.version).toBe('1.31.12');
    });

    then(
      'It invokes the command local and print the logs to the console',
      () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringContaining('Hello World'),
        );
      },
    );
  });

  test('Invoke a function local with an console.error in it', ({
    given,
    when,
    then,
  }) => {
    given('I have done the local init', () => {
      fs.ensureDirSync(
        join(testDir, 'functions', 'InvokeFunctionLocalWithError'),
      );
    });

    given(
      'I have a local function with the config.json (console.error implemented)',
      () => {
        fs.writeFileSync(
          join(
            testDir,
            'functions',
            'InvokeFunctionLocalWithError',
            'config.json',
          ),
          JSON.stringify({
            name: 'InvokeFunctionLocal30Seconds',
            event: null,
            input: {
              headers: [],
              payload: {},
            },
            environmentVariables: [
              {
                key: '',
                value: '',
              },
            ],
          }),
        );
        fs.writeFileSync(
          join(
            testDir,
            'functions',
            'InvokeFunctionLocalWithError',
            'index.js',
          ),
          `function lambda(input, callback) {
    console.error('INVALID LAMBDA');
    callback(null, 'Hello World');
}
`,
        );
      },
    );

    when(
      'I run the invoke command and pass the function name and local flag',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const invokeController = new InvokeController();
        await invokeController.invoke({
          lambdaFunctions: ['InvokeFunctionLocalWithError'],
          inputFlags: { local: true },
        });
      },
    );

    then(
      'It invokes the command local and print the logs with error to the console',
      () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringContaining('Hello World'),
        );
        expect(consoleSpy).toBeCalledWith(
          expect.stringContaining('INVALID LAMBDA'),
        );
      },
    );
  });

  test('Invoke a function local which throws an error during invocation', ({
    given,
    when,
    then,
  }) => {
    given('I have done the local init', () => {
      fs.ensureDirSync(
        join(testDir, 'functions', 'InvokeFunctionLocalWithThrowError'),
      );
    });

    given(
      'I have a local function with the config.json (throw error implemented)',
      () => {
        fs.writeFileSync(
          join(
            testDir,
            'functions',
            'InvokeFunctionLocalWithThrowError',
            'config.json',
          ),
          JSON.stringify({
            name: 'InvokeFunctionLocalWithThrowError',
            event: null,
            input: {
              headers: [],
              payload: {},
            },
            environmentVariables: [
              {
                key: '',
                value: '',
              },
            ],
          }),
        );
        fs.writeFileSync(
          join(
            testDir,
            'functions',
            'InvokeFunctionLocalWithThrowError',
            'index.js',
          ),
          `function lambda(input, callback) {
    throw new Error('ERROR INSIDE FUNCTION!');
    callback(null, 'Hello World');
}
`,
        );
      },
    );

    when(
      'I run the invoke command and pass the function name and local flag',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const invokeController = new InvokeController();
        await invokeController.invoke({
          lambdaFunctions: ['InvokeFunctionLocalWithThrowError'],
          inputFlags: { local: true },
        });
      },
    );

    then(
      'It invokes the command local and print the logs with error to the console',
      () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringContaining('com.liveperson.faas.handler.custom-failure'),
        );
        expect(consoleSpy).toBeCalledWith(
          expect.stringContaining('ERROR INSIDE FUNCTION!'),
        );
      },
    );
  });

  test('Invoke a function local which has an incorrect error format', ({
    given,
    when,
    then,
  }) => {
    given('I have done the local init', () => {
      fs.ensureDirSync(
        join(
          testDir,
          'functions',
          'InvokeFunctionLocalWithIncorrectErrorFormat',
        ),
      );
    });

    given(
      'I have a local function with the config.json (incorrect error format implemented)',
      () => {
        fs.writeFileSync(
          join(
            testDir,
            'functions',
            'InvokeFunctionLocalWithIncorrectErrorFormat',
            'config.json',
          ),
          JSON.stringify({
            name: 'InvokeFunctionLocalWithIncorrectErrorFormat',
            event: null,
            input: {
              headers: [],
              payload: {},
            },
            environmentVariables: [
              {
                key: '',
                value: '',
              },
            ],
          }),
        );
        fs.writeFileSync(
          join(
            testDir,
            'functions',
            'InvokeFunctionLocalWithIncorrectErrorFormat',
            'index.js',
          ),
          `function lambda(input, callback) {
            const promise = new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve('Hello World');
              }, 1500);
              reject('ERROR DURING CALLBACK PROMISE');
            });
            callback(null, promise);
}
`,
        );
      },
    );

    when(
      'I run the invoke command and pass the function name and local flag',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const invokeController = new InvokeController();
        await invokeController.invoke({
          lambdaFunctions: ['InvokeFunctionLocalWithIncorrectErrorFormat'],
          inputFlags: { local: true },
        });
      },
    );

    then(
      'It invokes the command local and print the logs with error to the console',
      () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringContaining('com.liveperson.faas.handler.custom-failure'),
        );
        expect(consoleSpy).toBeCalledWith(
          expect.stringContaining('ERROR DURING CALLBACK PROMISE'),
        );
        expect(consoleSpy).toBeCalledWith(
          expect.stringContaining(
            'Received error in an incorrect format. Please provide an error object to the callback.',
          ),
        );
      },
    );
  });

  test('Invoke a function local with a runtime longer than 60 seconds', ({
    given,
    when,
    then,
  }) => {
    given('I have done the local init', () => {
      fs.ensureDirSync(
        join(testDir, 'functions', 'InvokeFunctionLocalExecutionTimeLimit'),
      );
    });

    given(
      'I have a local function with the config.json (runtime is longer than 60 seconds)',
      () => {
        fs.writeFileSync(
          join(
            testDir,
            'functions',
            'InvokeFunctionLocalExecutionTimeLimit',
            'config.json',
          ),
          JSON.stringify({
            name: 'InvokeFunctionLocalExecutionTimeLimit',
            event: null,
            input: {
              headers: [],
              payload: {},
            },
            environmentVariables: [
              {
                key: '',
                value: '',
              },
            ],
          }),
        );
        fs.writeFileSync(
          join(
            testDir,
            'functions',
            'InvokeFunctionLocalExecutionTimeLimit',
            'index.js',
          ),
          `function lambda(input, callback) {
  setTimeout(() => {
    callback(null, 'Hello World');
  }, 61000)
}
`,
        );
      },
    );

    when(
      'I run the invoke command and pass the function name and local flag',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const invokeController = new InvokeController();
        await invokeController.invoke({
          lambdaFunctions: ['InvokeFunctionLocalExecutionTimeLimit'],
          inputFlags: { local: true },
        });
      },
    );

    then(
      'It invokes the command local and print an error that the functions runs longer than 60 seconds',
      () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringContaining(
            'Lambda did not call callback within execution time limit',
          ),
        );
      },
    );
  });
});
