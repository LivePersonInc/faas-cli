/* eslint-disable @typescript-eslint/no-empty-function */
import { defineFeature, loadFeature } from 'jest-cucumber';
import * as fs from 'fs-extra';
import * as os from 'os';
import { join } from 'path';
import { UndeployController } from '../../../src/controller/deployment/undeploy.controller';
import { UndeployView } from '../../../src/view/undeploy.view';
import { FileService } from '../../../src/service/file.service';
import { Prompt, TaskList } from '../../../src/view/printer';

jest.mock('../../../src/service/faas.service', () =>
  jest.requireActual('../../__mocks__/faas.service.ts'),
);

const feature = loadFeature('test/commands/undeploy/undeploy.feature');

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

  afterAll(() => {
    jest.resetAllMocks();
  });

  test('Run the undeploy command (with passed function names)', async ({
    given,
    when,
    then,
    and,
  }) => {
    let undeployView: UndeployView;

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

    when('I run the undeploy command and pass a function name', async () => {
      const prompt = new Prompt();
      prompt.run = jest.fn(() => ({ TestFunction1: true })) as any;
      undeployView = new UndeployView({ prompt });
      const undeployController = new UndeployController({ undeployView });
      await undeployController.undeploy({ lambdaFunctions: ['TestFunction1'] });
    });

    then(
      'I will be asked if I want to approve the undeployment and I approve it',
      () => {},
    );

    and(
      "The undeployment process will start and will indicate if it's finished",
      async () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringMatching(/Undeploying following functions/),
        );
        expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
          'Undeploying TestFunction1',
        );
      },
    );
  });

  test("Run the undeploy command (with passed function names), don't want to watch the process and approve all with the yes flag", async ({
    given,
    when,
    then,
  }) => {
    given('I have a valid token', async () => {
      await await fileService.writeTempFile({
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
      'I run the undeploy command, pass a function name and the --no-watch and yes flag',
      async () => {
        const undeployController = new UndeployController();
        await undeployController.undeploy({
          lambdaFunctions: ['TestFunction2'],
          inputFlags: { 'no-watch': true, yes: true },
        });
      },
    );

    then('Nothing should be displayed', () => {});
  });

  test('Run the undeploy command (from the functions folder) and approve all with the yes flag', ({
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
      'I run the undeploy command from inside the function folder and pass the the yes flag',
      async () => {
        fs.ensureDirSync(join(testDir, 'functions'));
        fs.ensureDirSync(join(testDir, 'functions', 'TestFunction5'));
        fs.writeFileSync(
          join(testDir, 'functions', 'TestFunction5', 'config.json'),
          JSON.stringify({ name: 'TestFunction5' }),
        );
        const undeployView = new UndeployView({ tasklist });
        const fileServiceLocal = new FileService({
          cwd: join(testDir, 'functions', 'TestFunction5'),
        });
        const deployController = new UndeployController({
          fileService: fileServiceLocal,
          undeployView,
        });
        await deployController.undeploy({
          lambdaFunctions: [],
          inputFlags: { yes: true },
        });
      },
    );

    then(
      "The undeployment process will start and will indicate if it's finished",
      () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringMatching(/Undeploying following functions/),
        );
        expect(tasklist.getTasks()).toEqual([
          { task: expect.any(Function), title: 'Undeploying TestFunction5' },
        ]);
      },
    );
  });

  test('It should throw an error if I run the undeploy command with a function which is not on my logged in account', async ({
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
        const undeployController = new UndeployController();
        await expect(
          undeployController.undeploy({
            lambdaFunctions: ['TestFunction3'],
          }),
        ).rejects.toThrow('exit');
      },
    );

    when('I run the undeploy command and pass this function', () => {});

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

  test('It should skip the undeployment if I decline the confirmation', ({
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
      'I run the undeploy command, pass a functions folder name and decline the confirmation',
      async () => {
        const undeployView = new UndeployView();
        undeployView.askForConfirmation = jest.fn(() => ({
          TestFunction1: false,
        })) as any;
        const deployController = new UndeployController({ undeployView });
        await deployController.undeploy({ lambdaFunctions: ['TestFunction1'] });
      },
    );

    then('Nothing should be displayed', () => {});

    and('No function should be undeployed', () => {});
  });
});
