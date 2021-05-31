/* eslint-disable @typescript-eslint/no-empty-function */
import { defineFeature, loadFeature } from 'jest-cucumber';
import * as fs from 'fs-extra';
import * as os from 'os';
import { join } from 'path';
import { FileService } from '../../../src/service/file.service';
import { PushController } from '../../../src/controller/push.controller';
import { PushView } from '../../../src/view/push.view';
import { Prompt } from '../../../src/view/printer';
import { ILambda, ILambdaConfig } from '../../../src/types';

jest.mock('../../../src/service/faas.service', () =>
  jest.requireActual('../../__mocks__/faas.service.ts'),
);

const feature = loadFeature('test/commands/push/push.feature');

const testDir = join(__dirname, 'test');

const fileService = new FileService({ cwd: testDir });
const allLambdas: ILambda[] = fileService.read(
  join(process.cwd(), 'test', '__mocks__', 'lambdas.json'),
);
const localLambdaConfigs: ILambdaConfig[] = fileService.read(
  join(process.cwd(), 'test', '__mocks__', 'lambdaConfigs.json'),
);

const mockFileService = {
  collectLocalLambdaInformation: jest.fn((lambdaFunctions: string[]) =>
    localLambdaConfigs.filter((lambdaConfig: ILambdaConfig) =>
      lambdaFunctions.includes(lambdaConfig.name),
    ),
  ),
  getFunctionConfig: jest.fn((lambdaName: string) => {
    const [lambdaConfig] = localLambdaConfigs.filter(
      (lambdaConfigParam: ILambdaConfig) =>
        lambdaConfigParam.name === lambdaName,
    );
    return lambdaConfig;
  }),
  getPathToFunction: jest.fn((lambdaName) => lambdaName),
  read: jest.fn((lambdaName) => {
    if (
      lambdaName === 'TestFunction6' ||
      lambdaName === 'TestFunction7' ||
      lambdaName === 'TestFunction8'
    ) {
      return 'function lambda(input, callback) {\n    callback(null, `Hello World`);\n}';
    }
    const [lambda] = allLambdas.filter(
      (lambdaParam: ILambda) => lambdaParam.name === lambdaName,
    );
    return lambda.implementation.code;
  }),
  getFunctionsDirectories: jest.fn(() => [
    'TestFunction1',
    'TestFunction2',
    'TestFunction3',
    'TestFunction4',
    'TestFunction5',
    'TestFunction6',
    'TestFunction7',
    'TestFunction8',
  ]),
} as any;
const promptMock = new Prompt();

defineFeature(feature, (test) => {
  let consoleSpy;
  let stdoutSpy;

  afterEach(() => {
    fs.removeSync(testDir);
  });

  beforeEach(() => {
    fs.ensureDirSync(testDir);
    consoleSpy = jest.spyOn(global.console, 'log');
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    jest.spyOn(os, 'tmpdir').mockReturnValue(testDir);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  test('Initiating Push of a function without confirming it', ({
    given,
    when,
    then,
  }) => {
    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the push command for a function and do not confirm the push',
      async () => {
        promptMock.run = jest.fn(() => ({})) as any;
        const pushView = new PushView({ prompt: promptMock });

        const pushController = new PushController({
          pushView,
          fileService: mockFileService,
        });
        await pushController.push({ lambdaFunctions: ['TestFunction6'] });
      },
    );

    then('I expect nothing to happen', () => {});
  });
  test('Pushing a single function successfully', ({
    given,
    when,
    then,
    and,
  }) => {
    given('I am located in the respective function folder', () => {});

    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    when('I run the push command', async () => {
      promptMock.run = jest.fn(() => ({ TestFunction6: true })) as any;
      const pushView = new PushView({ prompt: promptMock });

      const pushController = new PushController({
        pushView,
        fileService: mockFileService,
      });
      await pushController.push({ lambdaFunctions: ['TestFunction6'] });
    });

    then('I see the confirmation prompt and confirm', () => {});

    and('I expect to see a progress indicator', () => {});

    and('I expect a success message', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Pushing following functions/),
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction6',
      );
    });
  });

  test('Pushing a single function successfully with no-watch and yes flag', ({
    given,
    when,
    then,
  }) => {
    given('I am located in the respective function folder', () => {});

    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    when('I run the push command', async () => {
      promptMock.run = jest.fn(() => ({ TestFunction6: true })) as any;
      const pushView = new PushView({ prompt: promptMock });
      const pushController = new PushController({
        pushView,
        fileService: mockFileService,
      });
      await pushController.push({
        lambdaFunctions: ['TestFunction6'],
        inputFlags: { 'no-watch': true, yes: true },
      });
    });

    when('The no-watch flag is set', () => {});

    when('the yes flag is set', () => {});

    then('I expect no output on the cli', () => {});
  });

  test('Updating a single function successfully', ({
    given,
    when,
    then,
    and,
  }) => {
    given('I am located in the respective function folder', () => {});

    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    given(
      'an earlier version of my function already is available on the faas platform',
      () => {},
    );

    when('I run the push command', async () => {
      promptMock.run = jest.fn(() => ({ TestFunction1: true })) as any;
      const pushView = new PushView({
        prompt: promptMock,
        fileService: mockFileService,
      });

      const pushController = new PushController({
        pushView,
        fileService: mockFileService,
      });
      await pushController.push({ lambdaFunctions: ['TestFunction1'] });
    });

    then('I see the confirmation prompt and confirm', () => {});

    and('I expect to see a progress indicator', () => {});

    and('I expect a success message', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Pushing following functions/),
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction1',
      );
    });
  });

  test('Updating a single function unsuccessfully due to no changes', ({
    given,
    when,
    then,
    and,
  }) => {
    given('I am located in the respective function folder', () => {});

    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    given(
      'the same version of my function already is available on the faas platform',
      () => {},
    );

    when('I run the push command', async () => {
      promptMock.run = jest.fn(() => ({ TestFunction1: true })) as any;
      const pushView = new PushView({
        prompt: promptMock,
        fileService: mockFileService,
      });

      const pushController = new PushController({
        pushView,
        fileService: mockFileService,
      });
      await pushController.push({ lambdaFunctions: ['TestFunction1'] });
    });

    then('I see the confirmation prompt and confirm', () => {});

    and('I expect to see a progress indicator', () => {});

    and('I expect a skip message', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Pushing following functions/),
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain('Push Skipped');
    });
  });

  test('Pushing multiple lambdas successfully', ({
    given,
    when,
    then,
    and,
  }) => {
    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    when('I run the push command naming multiple folders/lambdas', async () => {
      promptMock.run = jest.fn(() => ({
        TestFunction6: true,
        TestFunction7: true,
      })) as any;
      const pushView = new PushView({
        prompt: promptMock,
        fileService: mockFileService,
      });

      const pushController = new PushController({
        pushView,
        fileService: mockFileService,
      });
      await pushController.push({
        lambdaFunctions: ['TestFunction6', 'TestFunction7'],
      });
    });

    when('I see the confirmation prompts and confirm', () => {});

    then('I expect to see a progress indicator', () => {});

    and('I expect a success message', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Pushing following functions/),
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction6',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction7',
      );
    });
  });
  test('Pushing multiple lambdas with one failing', ({
    given,
    when,
    then,
    and,
  }) => {
    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    when('I run the push command naming multiple folders/lambdas', async () => {
      promptMock.run = jest.fn(() => ({
        TestFunction6: true,
        TestFunction7: true,
        TestFunction8: true,
      })) as any;
      const pushView = new PushView({
        prompt: promptMock,
        fileService: mockFileService,
      });
      mockFileService.read = jest.fn((lambdaName) => {
        if (lambdaName === 'TestFunction6' || lambdaName === 'TestFunction8') {
          return 'function lambda(input, callback) {\n    callback(null, `Hello World`);\n}';
        }
        return 'function lammbda(input, callback) {\n    callback(null, `Hello World`);\n}';
      });

      const pushController = new PushController({
        pushView,
        fileService: mockFileService,
      });
      await pushController.push({
        lambdaFunctions: ['TestFunction6', 'TestFunction7', 'TestFunction8'],
      });
    });

    when('I see the confirmation prompts and confirm', () => {});

    then('I expect to see a progress indicator', () => {});

    and('I expect an error message for the failing lambda', () => {
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        `Push Error: The code of function 'TestFunction7'`,
      );
    });

    and('I expect the other lambdas to succeed', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Pushing following functions/),
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction6',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction8',
      );
    });
  });
  test('Pushing all lambdas successfully', ({ given, when, then, and }) => {
    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    when("I run the push command with 'all' flag set", async () => {
      promptMock.run = jest.fn(() => ({
        TestFunction1: true,
        TestFunction2: true,
        TestFunction3: true,
        TestFunction4: true,
        TestFunction5: true,
        TestFunction6: true,
        TestFunction7: true,
        TestFunction8: true,
      })) as any;
      const pushView = new PushView({
        prompt: promptMock,
        fileService: mockFileService,
      });

      const pushController = new PushController({
        pushView,
        fileService: mockFileService,
      });
      await pushController.push({
        lambdaFunctions: [],
        inputFlags: { all: true },
      });
    });

    when('I see the confirmation prompts and confirm', () => {});

    then('I expect to see a progress indicator', () => {});

    and('I expect a success message', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Pushing following functions/),
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction1',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction2',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction3',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction4',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction5',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction6',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction7',
      );
    });
  });

  test('Pushing all lambdas with one failing', ({ given, when, then, and }) => {
    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    when("I run the push command with 'all' flag set", async () => {
      promptMock.run = jest.fn(() => ({})) as any;
      const pushView = new PushView({
        prompt: promptMock,
        fileService: mockFileService,
      });

      mockFileService.read = jest.fn((lambdaName) => {
        if (lambdaName === 'TestFunction7') {
          return 'function lammbda(input, callback) {\n    callback(null, `Hello World`);\n}';
        }
        return 'function lambda(input, callback) {\n    callback(null, `Hello World`);\n}';
      });

      const pushController = new PushController({
        pushView,
        fileService: mockFileService,
      });
      await pushController.push({
        lambdaFunctions: [],
        inputFlags: { all: true },
      });
    });

    when('I see the confirmation prompt and confirm', () => {});

    then('I expect to see a progress indicator', () => {});

    and('I expect an error message for the failing lambda', () => {
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        `Push Error: The code of function 'TestFunction7'`,
      );
    });

    and('I expect the other lambdas to succeed', () => {
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction1',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction2',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction3',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction4',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction5',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction6',
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Pushing TestFunction8',
      );
    });
  });

  test('Pushing all lambdas with all failing', ({ given, when, then }) => {
    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    when('I call the push command and all lambdas are failing', async () => {
      const pushView = new PushView({
        prompt: promptMock,
        fileService: mockFileService,
      });

      mockFileService.getFunctionsDirectories = jest.fn(() => {
        throw new Error('Will I be printed?');
      });

      const pushController = new PushController({
        pushView,
        fileService: mockFileService,
      });
      await pushController.push({
        lambdaFunctions: [],
        inputFlags: { all: true },
      });
    });

    then('I expect an error message', () => {
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        `Will I be printed?`,
      );
    });
  });

  test('Pushing a single lambda without a description', ({
    given,
    when,
    then,
  }) => {
    given('I am authorized', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the push command for a lambda without a description',
      async () => {
        promptMock.run = jest.fn(() => ({ TestFunction6: true })) as any;
        const pushView = new PushView({
          prompt: promptMock,
          fileService: mockFileService,
        });
        mockFileService.getFunctionConfig = jest.fn((lambdaName: string) => {
          // eslint-disable-next-line max-nested-callbacks
          const [lambdaConfig] = localLambdaConfigs.filter(
            (lambdaConfigParam: ILambdaConfig) =>
              lambdaConfigParam.name === lambdaName,
          );
          lambdaConfig.description = null as any;
          return lambdaConfig;
        });
        const pushController = new PushController({
          pushView,
          fileService: mockFileService,
        });
        await pushController.push({ lambdaFunctions: ['TestFunction6'] });
      },
    );

    then('I expect an error message', () => {
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        `Push Error: Lambda description can not be null`,
      );
    });
  });
});
