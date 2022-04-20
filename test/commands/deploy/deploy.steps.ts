/* eslint-disable @typescript-eslint/no-empty-function */
import { defineFeature, loadFeature } from 'jest-cucumber';
import * as fs from 'fs-extra';
import * as os from 'os';
import { join } from 'path';
import { DeployController } from '../../../src/controller/deployment/deploy.controller';
import { DeployView } from '../../../src/view/deploy.view';
import { FileService } from '../../../src/service/file.service';
import { Prompt, TaskList } from '../../../src/view/printer';

beforeAll(() => {
  jest.resetAllMocks();
});

jest.mock('../../../src/service/faas.service', () =>
  jest.requireActual('../../__mocks__/faas.service.ts'),
);
jest.mock('../../../src/service/faasFactory.service', () =>
  jest.requireActual('../../__mocks__/faasFactory.service.ts'),
);

const feature = loadFeature('test/commands/deploy/deploy.feature');

jest.setTimeout(25000);

defineFeature(feature, async (test) => {
  const testDir = join(__dirname, 'test');
  let consoleSpy;
  let stdoutSpy;
  const fileService = new FileService({ cwd: testDir });

  beforeEach(() => {
    consoleSpy = jest.spyOn(global.console, 'log');
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    jest.spyOn(process, 'cwd').mockReturnValue(testDir);
    jest.spyOn(os, 'tmpdir').mockReturnValue(testDir);
    fs.ensureDirSync(testDir);
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
  });

  afterEach(() => {
    consoleSpy = undefined;
    stdoutSpy = undefined;
    jest.resetAllMocks();
    fs.removeSync(testDir);
  });

  test('Run the deploy command (with passed function names)', async ({
    given,
    when,
    then,
    and,
  }) => {
    let deployView: DeployView;

    given('I have a valid token', async () => {
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
      'I have a function available on the LivePerson Functions platform',
      () => {},
    );

    when(
      'I run the deploy command and pass a functions folder name',
      async () => {
        const prompt = new Prompt();
        prompt.run = jest.fn(() => ({ TestFunction1: true })) as any;
        deployView = new DeployView({ prompt });
        const deployController = new DeployController({ deployView });
        await deployController.deploy({ lambdaFunctions: ['TestFunction1'] });
      },
    );

    then(
      'I will be asked if I want to approve the deployment and I approve it',
      () => {},
    );

    and(
      "The deployment process will start and will indicate if it's finished",
      async () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringMatching(/Deploying following functions/),
        );
        expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
          'Deploying TestFunction1',
        );
      },
    );
  });

  test('Run the deploy command with an alternatively defined lambda', async ({
    given,
    when,
    then,
    and,
  }) => {
    let deployView: DeployView;

    given('I have a valid token', async () => {
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
      'I have a function available on the LivePerson Functions platform',
      () => {},
    );

    when(
      'I run the deploy command and pass a functions folder name',
      async () => {
        const prompt = new Prompt();
        prompt.run = jest.fn(() => ({ TestFunction2: true })) as any;
        deployView = new DeployView({ prompt });
        const deployController = new DeployController({ deployView });
        await deployController.deploy({ lambdaFunctions: ['TestFunction2'] });
      },
    );

    then(
      'I will be asked if I want to approve the deployment and I approve it',
      () => {},
    );

    and(
      "The deployment process will start and will indicate if it's finished",
      async () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringMatching(/Deploying following functions/),
        );
        expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
          'Deploying TestFunction2',
        );
      },
    );
  });

  test("Run the deploy command (with passed function names), don't want to watch the process and approve all with the yes flag", async ({
    given,
    when,
    then,
  }) => {
    given('I have a valid token', async () => {
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
      'I have a function available on the LivePerson Functions platform',
      () => {},
    );

    when(
      'I run the deploy command, pass a functions folder name and the --no-watch and yes flag',
      async () => {
        const deployController = new DeployController();
        await deployController.deploy({
          lambdaFunctions: ['TestFunction2'],
          inputFlags: { 'no-watch': true, yes: true },
        });
      },
    );

    then('Nothing should be displayed', () => {});
  });

  test('Run the deploy command (from the function names) and approve all with the yes flag', ({
    given,
    when,
    then,
  }) => {
    const tasklist = new TaskList({ concurrent: true });

    given('I have a valid token', async () => {
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
      'I have a function available on the LivePerson Functions platform',
      () => {},
    );

    when(
      'I run the deploy command from inside the function folder and pass the the yes flag',
      async () => {
        const cwdSpy = jest
          .spyOn(process, 'cwd')
          .mockReturnValue(join(testDir, 'functions', 'TestFunction5'));
        const deployView = new DeployView({ tasklist });
        const deployController = new DeployController({ deployView });
        await deployController.deploy({
          lambdaFunctions: ['TestFunction5'],
          inputFlags: { yes: true },
        });
        cwdSpy.mockReset();
      },
    );

    then(
      "The deployment process will start and will indicate if it's finished",
      () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringMatching(/Deploying following functions/),
        );
        expect(tasklist.getTasks()).toEqual([
          { task: expect.any(Function), title: 'Deploying TestFunction5' },
        ]);
      },
    );
  });

  test('It should throw an error if I run the deploy command with a function which is not on my logged in account', async ({
    given,
    when,
    then,
  }) => {
    given('I have a valid token', async () => {
      await fileService.writeTempFile({
        '8888877777': {
          token: '454545478787',
          userId: 'userId_2222222',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    given(
      'This function is not available on the logged in account on the platform',
      async () => {
        const deployController = new DeployController();
        await expect(
          deployController.deploy({ lambdaFunctions: ['TestFunction3'] }),
        ).rejects.toThrow('exit');
      },
    );

    when('I run the deploy command and pass this function', () => {});

    then(
      'It should throw an error and tell me that this function is not available on the platform',
      () => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringMatching(
            /Function TestFunction3 were not found on the platform/,
          ),
        );
      },
    );
  });

  test('It should skip a deployment if the function is currently under deployment', async ({
    given,
    when,
    then,
  }) => {
    given('I have a valid token', async () => {
      await fileService.writeTempFile({
        '7879879875646541132564312156': {
          token: '9817298410798710239874',
          userId: 'userId_123456_under_deployment',
          username: 'testUser4@liveperson.com',
          active: true,
        },
      });
    });

    given('A function is already under deployment', () => {
      fs.ensureDirSync(join(testDir, 'functions', 'TestFunction4'));
      fileService.write(
        join(testDir, 'functions', 'TestFunction4', 'config.json'),
        {
          name: 'TestFunction4',
          event: null,
        },
      );
    });

    when(
      'I run the deploy command and pass the same function again',
      async () => {
        const deployController = new DeployController();
        await deployController.deploy({
          lambdaFunctions: ['TestFunction4'],
          inputFlags: { yes: true },
        });
      },
    );

    then('It should show me that the functions is still deploying', () => {});
  });

  test('It should skip the deployment if I decline the confirmation', ({
    given,
    when,
    then,
    and,
  }) => {
    given('I have a valid token', async () => {
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
      'I have a function available on the LivePerson Functions platform',
      () => {},
    );

    when(
      'I run the deploy command, pass a functions folder name and decline the confirmation',
      async () => {
        const deployView = new DeployView();
        deployView.askForConfirmation = jest.fn(() => ({
          TestFunction1: false,
        })) as any;
        const deployController = new DeployController({ deployView });
        await deployController.deploy({ lambdaFunctions: ['TestFunction1'] });
      },
    );

    then('Nothing should be displayed', () => {});

    and('No function should be deployed', () => {});
  });
});
