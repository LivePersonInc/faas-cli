import * as fs from 'fs-extra';
import * as os from 'os';

import { join } from 'path';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { CreateController } from '../../../src/controller/create.controller';
import { CreateView } from '../../../src/view/create.view';
import { FileService } from '../../../src/service/file.service';
import { LoginController } from '../../../src/controller/login.controller';
import { DefaultStructureService } from '../../../src/service/defaultStructure.service';

jest.mock('../../../src/service/faas.service', () =>
  jest.requireActual('../../__mocks__/faas.service.ts'),
);
jest.mock('../../../src/service/faasFactory.service', () =>
  jest.requireActual('../../__mocks__/faasFactory.service.ts'),
);

const feature = loadFeature('test/commands/create/create.function.feature');

defineFeature(feature, (test) => {
  fs.removeSync(join(__dirname, 'faas-tmp.json'));
  const testDir = join(__dirname, 'functions');
  const consoleSpy = jest.spyOn(global.console, 'log');
  jest.spyOn(process, 'cwd').mockReturnValue(__dirname);
  jest.spyOn(os, 'tmpdir').mockReturnValue(__dirname);
  jest.setTimeout(100000);
  jest.useFakeTimers();
  const fileService = new FileService({ cwd: __dirname });

  function resetDirectory() {
    fs.removeSync(testDir);
    consoleSpy.mockReset();
  }

  beforeEach(() => {
    resetDirectory();
  });

  afterEach(() => {
    resetDirectory();
    consoleSpy.mockReset();
  });

  afterAll(() => {
    fs.remove(join(__dirname, 'faas-tmp.json'));
    jest.resetAllMocks();
  });

  test('Run the create:function command not logged in', async ({
    given,
    when,
    then,
  }) => {
    const createView = new CreateView();
    let createController: CreateController;
    given('I am not authenticated', async () => {
      fs.removeSync(join(__dirname, 'faas-tmp.json'));
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toBeUndefined();
    });

    when(
      'I run the create:function command with lpf create:function',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
    );

    then('It should prompt me to input the name of the function', async () => {
      createView.askForFunctionName = jest.fn(async () => ({
        name: 'testFunction',
      })) as any;
    });

    then(
      'It should prompt me to input the description of the function',
      async () => {
        createView.askForFunctionDescription = jest.fn(async () => ({
          description: 'this is a test',
        })) as any;
      },
    );

    then(
      'It should prompt me to input the event ID of the function',
      async () => {
        createView.askForEventID = jest.fn(async () => ({
          eventId: 'No Event',
        })) as any;
      },
    );

    then('It should tell me the function was created', async () => {
      createController = new CreateController({ createView });
      await createController.createFunction();
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/has been created/),
      );
    });

    then(
      'A folder with the appropriate files should be created on the root directory',
      () => {
        setTimeout(() => {
          expect(fs.existsSync(join(testDir, 'testFunction'))).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'testFunction', 'index.js')),
          ).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'testFunction', 'config.json')),
          ).toBeTruthy();

          const fileData = fileService.read(
            join(testDir, 'testFunction', 'config.json'),
          );
          expect(fileData.name).toEqual('testFunction');
          expect(fileData.event).toEqual('No Event');
          expect(fileData.description).toEqual('this is not a test');
        }, 250);
      },
    );
  });

  test('Run the create:function command logged in', async ({
    given,
    when,
    then,
  }) => {
    const createView = new CreateView();
    const loginController = new LoginController();
    let createController: CreateController;
    given('I am authenticated', async () => {
      loginController.isUserLoggedIn = jest.fn(async () => {
        return true;
      });
    });

    when(
      'I run the create:function command with lpf create:function',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
    );

    then('It should prompt me to input the name of the function', async () => {
      createView.askForFunctionName = jest.fn(async () => ({
        name: 'testFunction',
      })) as any;
    });

    then(
      'It should prompt me to input the description of the function',
      async () => {
        createView.askForFunctionDescription = jest.fn(async () => ({
          description: 'this is a test',
        })) as any;
      },
    );

    then(
      'It should prompt me to list of event IDs of the function',
      async () => {
        createView.askForEventID = jest.fn(async () => ({
          eventId: 'No Event',
        })) as any;
      },
    );

    then('It should tell me the function was created', async () => {
      createController = new CreateController({ createView, loginController });
      await createController.createFunction();
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/has been created/),
      );
    });

    then(
      'A folder with the appropriate files should be created on the root directory',
      () => {
        setTimeout(() => {
          expect(fs.existsSync(join(testDir, 'testFunction'))).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'testFunction', 'index.js')),
          ).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'testFunction', 'config.json')),
          ).toBeTruthy();

          const fileData = fileService.read(
            join(testDir, 'testFunction', 'config.json'),
          );
          expect(fileData.name).toEqual('testFunction');
          expect(fileData.event).toEqual('No Event');
          expect(fileData.description).toEqual('this is not a test');
        }, 250);
      },
    );
  });

  test('Run the create:function and it throws an error', async ({
    given,
    when,
    then,
  }) => {
    const createView = new CreateView();
    const loginController = new LoginController();
    const defaultStructureService = new DefaultStructureService();
    let createController: CreateController;
    given(
      'I am not authenticated and a specific function already exists',
      async () => {
        loginController.isUserLoggedIn = jest.fn(async () => {
          return false;
        });
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        defaultStructureService.createFunction = jest.fn(() => {
          throw new Error('Function already exists');
        });
      },
    );

    when(
      'I run the create:function command with lpf create:function -name ...',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
    );

    then('An error message is displayed', async () => {
      createController = new CreateController({
        createView,
        loginController,
        defaultStructureService,
      });
      try {
        await createController.createFunction({
          name: 'exampleFunction',
          description: 'this is a description',
          event: 'No Event',
        });
      } catch (error) {
        expect(error.message).toEqual(
          expect.stringMatching(/Function already exists/),
        );
      }
    });

    then('No additional files were created', () => {
      setTimeout(() => {
        expect(fs.existsSync(join(testDir, 'testFunction'))).toBeFalsy();
      }, 250);
    });
  });
});
