/* eslint-disable @typescript-eslint/no-empty-function */
import { defineFeature, loadFeature } from 'jest-cucumber';
import * as fs from 'fs-extra';
import * as os from 'os';
import { join } from 'path';
import { PullView } from '../../../src/view/pull.view';
import { PullController } from '../../../src/controller/pull.controller';
import { FileService } from '../../../src/service/file.service';
import { Prompt } from '../../../src/view/printer';
import { DefaultStructureService } from '../../../src/service/defaultStructure.service';

jest.mock('../../../src/service/faas.service', () =>
  jest.requireActual('../../__mocks__/faas.service.ts'),
);

const feature = loadFeature('test/commands/pull/pull.feature');

const testDir = join(__dirname, 'test');
const fileService = new FileService({ cwd: testDir });

const mockFileService = {
  getRoot: jest.fn(() => {
    return testDir;
  }),
  copy: jest.fn((sourcePath, destinationPath) => {
    fs.copySync(sourcePath, destinationPath);
  }),
  write: jest.fn(
    (
      pathToWriteFile: string,
      data: any,
      stringify = true,
      encoding = 'utf8',
    ) => {
      try {
        if (stringify) {
          fs.ensureDirSync(join(testDir, 'functions', data.name));
          fs.writeFileSync(
            pathToWriteFile,
            JSON.stringify(data, null, 4),
            encoding,
          );
          return;
        }
        fs.writeFileSync(pathToWriteFile, data, encoding);
      } catch (error) {
        throw new Error(error);
      }
    },
  ),
} as any;

const promptMock = new Prompt();

defineFeature(feature, (test) => {
  let stdoutSpy;

  beforeEach(() => {
    fs.ensureDirSync(testDir);
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    jest.spyOn(os, 'tmpdir').mockReturnValue(testDir);
  });

  afterEach(() => {
    stdoutSpy = undefined;
    fs.removeSync(testDir);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  test('Pull a new function', ({ given, when, then }) => {
    const functionName = 'TestFunction2';
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
      'I run the pull command and pass a function name that is available on the platform',
      async () => {
        promptMock.run = jest.fn(() => ({ [functionName]: true })) as any;
        fs.ensureDirSync(join(testDir, 'functions'));
        fs.ensureDirSync(join(testDir, 'functions', 'TestFunction2'));
        fs.ensureFileSync(
          join(testDir, 'functions', 'TestFunction2', 'index.js'),
        );
        fs.ensureFileSync(
          join(testDir, 'functions', 'TestFunction2', 'settings.json'),
        );

        const defaultStructureService = new DefaultStructureService({
          fileService: mockFileService,
        });
        const pullView = new PullView({
          prompt: promptMock,
          fileService: mockFileService,
          defaultStructureService,
        });

        const pullController = new PullController({ pullView });
        await pullController.pull({ lambdaFunctions: [] });
      },
    );

    when('I see the confirmation prompt and confirm', () => {});

    then('I expect the lambda to be available locally', () => {
      expect(
        fs.pathExistsSync(join(testDir, 'functions', functionName, 'index.js')),
      ).toBeTruthy();
    });
  });

  test('Pull a new function without confirming', ({ given, when, then }) => {
    const functionName = 'TestFunction2';
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

    when('I run the pull command and do not confirm', async () => {
      promptMock.run = jest.fn(() => ({})) as any;
      const pullView = new PullView({
        prompt: promptMock,
        fileService: mockFileService,
      });
      const pullController = new PullController({ pullView });
      await pullController.pull({ lambdaFunctions: [functionName] });
    });

    then('I expect nothing to happen', () => {});
  });

  test('Pull an existing function', ({ given, when, then }) => {
    const functionName = 'TestFunction1';

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

    given('I have a lambda available locally', () => {
      fs.ensureFileSync(join(testDir, 'functions', functionName, 'index.js'));
    });

    when(
      'I run the pull command and pass the function name that is available on the platform and locally',
      async () => {
        promptMock.run = jest.fn(() => ({ [functionName]: true })) as any;
        const defaultStructureService = new DefaultStructureService({
          fileService: mockFileService,
        });
        const pullView = new PullView({
          prompt: promptMock,
          fileService: mockFileService,
          defaultStructureService,
        });

        const pullController = new PullController({ pullView });
        await pullController.pull({ lambdaFunctions: [functionName] });
      },
    );

    when('I see the confirmation prompt and confirm', () => {});

    then(
      'I expect a warning that the local lambda will be overwritten',
      () => {},
    );

    then('I expect the lambda to be available locally', () => {
      expect(
        fs.pathExistsSync(
          join(testDir, 'functions', functionName, 'config.json'),
        ),
      ).toBeTruthy();
    });
  });

  test('Pull all functions', ({ given, when, then }) => {
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

    when('I run the pull command with all/no-watch/confirm flag', async () => {
      const defaultStructureService = new DefaultStructureService({
        fileService: mockFileService,
      });
      const pullView = new PullView({
        prompt: promptMock,
        fileService: mockFileService,
        defaultStructureService,
      });
      const pullController = new PullController({ pullView });
      await pullController.pull({
        inputFlags: { 'no-watch': true, all: true, yes: true },
        lambdaFunctions: [''],
      });
    });

    then(
      'I expect a warning that the local lambdas will be overwritten',
      () => {},
    );

    then('I expect the lambdas to be available locally', () => {
      expect(
        fs.pathExistsSync(
          join(testDir, 'functions', 'TestFunction1', 'index.js'),
        ),
      ).toBeTruthy();
      expect(
        fs.pathExistsSync(
          join(testDir, 'functions', 'TestFunction2', 'index.js'),
        ),
      ).toBeTruthy();
      expect(
        fs.pathExistsSync(
          join(testDir, 'functions', 'TestFunction5', 'index.js'),
        ),
      ).toBeTruthy();
    });
  });

  test('Pull all functions with one failing', ({ given, when, then }) => {
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

    given('One lambda I want to pull causes an error', () => {
      mockFileService.write = jest.fn(
        (
          pathToWriteFile: string,
          data: any,
          stringify = true,
          encoding = 'utf8',
        ) => {
          try {
            if (stringify) {
              fs.ensureDirSync(join(testDir, 'functions', data.name));
              fs.writeFileSync(
                pathToWriteFile,
                JSON.stringify(data, null, 4),
                encoding,
              );
              return;
            }
            fs.writeFileSync(pathToWriteFile, data, encoding);
          } catch (error) {
            throw new Error(error);
          }
        },
      );
    });

    when('I run the pull command with all/no-watch/confirm flag', async () => {
      mockFileService.write = jest.fn(
        (
          pathToWriteFile: string,
          data: any,
          stringify = true,
          encoding = 'utf8',
        ) => {
          if (data.name === 'TestFunction2') {
            throw new Error('Pull of TestFunction2 failed');
          }

          try {
            if (stringify) {
              fs.ensureDirSync(join(testDir, 'functions', data.name));
              fs.writeFileSync(
                pathToWriteFile,
                JSON.stringify(data, null, 4),
                encoding,
              );
              return;
            }
            fs.writeFileSync(pathToWriteFile, data, encoding);
          } catch (error) {
            throw new Error(error);
          }
        },
      );
      const defaultStructureService = new DefaultStructureService({
        fileService: mockFileService,
      });
      const pullView = new PullView({
        prompt: promptMock,
        fileService: mockFileService,
        defaultStructureService,
      });

      const pullController = new PullController({ pullView });
      await pullController.pull({
        inputFlags: { 'no-watch': true, all: true, yes: true },
        lambdaFunctions: [''],
      });
    });

    then(
      'I expect a warning that the local lambdas will be overwritten',
      () => {},
    );

    then('I expect an error message for the failing lambda', () => {
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        `Pull of TestFunction2 failed`,
      );
    });

    then('I expect the other lambdas to be available locally', () => {
      expect(
        fs.pathExistsSync(
          join(testDir, 'functions', 'TestFunction1', 'index.js'),
        ),
      ).toBeTruthy();
      expect(
        fs.pathExistsSync(
          join(testDir, 'functions', 'TestFunction5', 'index.js'),
        ),
      ).toBeTruthy();
    });
  });
});
