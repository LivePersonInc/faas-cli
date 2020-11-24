import * as fs from 'fs-extra';
import * as os from 'os';

import { join } from 'path';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { CreateController } from '../../../src/controller/create.controller';
import { CreateView } from '../../../src/view/create.view';
import { FileService } from '../../../src/service/file.service';
import { LoginController } from '../../../src/controller/login.controller';

jest.mock('../../../src/service/faas.service', () =>
  jest.requireActual('../../__mocks__/faas.service.ts'),
);
jest.mock('../../../src/service/faasFactory.service', () =>
  jest.requireActual('../../__mocks__/faasFactory.service.ts'),
);

const feature = loadFeature('test/commands/create/create.schedule.feature');

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

  test('Run the create:schedule command logged in', async ({
    given,
    when,
    then,
  }) => {
    const loginController = new LoginController();
    const createView = new CreateView();
    let createController: CreateController;
    given('I am authenticated', async () => {
      await fileService.writeTempFile({
        '1234567890': {
          token: '454545478787',
          userId: 'userId_1234_NoLambdas',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the create:schedule command with lpf create:schedule',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
    );

    then(
      'It should prompt me a list of deployed functions from which to schedule',
      async () => {
        createView.askForDeployedLambda = jest.fn(async () => ({
          name: 'testFunction',
        })) as any;
      },
    );

    then('It should prompt me to input a cron expression', async () => {
      createView.askForCronExpression = jest.fn(async () => ({
        description: '* * * * *',
      })) as any;
    });

    then('It should display that the schedule was created', async () => {
      createController = new CreateController({ createView, loginController });
      await createController.createSchedule();
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/has been created/),
      );
    });
  });

  test('Run the create:schedule command not logged in', async ({
    given,
    when,
    then,
  }) => {
    const loginController = new LoginController();
    const createView = new CreateView();
    let createController: CreateController;
    given('I am not authenticated', async () => {
      loginController.isUserLoggedIn = jest.fn(async () => {
        return false;
      });
      loginController.getLoginInformation = jest.fn(async () => {
        return {
          accountId: '1234567890',
          token: '454545478787',
          userId: 'userId_1234_NoLambdas',
          username: 'testUser@liveperson.com',
          active: true,
        };
      });
    });

    then(
      'It should prompt me a list of deployed functions from which to schedule',
      async () => {
        createView.askForDeployedLambda = jest.fn(async () => ({
          name: 'testFunction',
        })) as any;
      },
    );

    then('It should prompt me to input a cron expression', async () => {
      createView.askForCronExpression = jest.fn(async () => ({
        description: '* * * * *',
      })) as any;
    });

    when('It should have created schedule after logging in', async () => {
      createController = new CreateController({
        createView,
        loginController,
      });
      await createController.createSchedule();
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/has been created/),
      );
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/You need to log into an account/),
      );
    });
  });

  test('Run the create:schedule command with create:schedule -n deployedFunction -c "* * * * *"', async ({
    given,
    then,
  }) => {
    let createController: CreateController;
    given('I am authenticated', async () => {
      await fileService.writeTempFile({
        '1234567890': {
          token: '454545478787',
          userId: 'userId_deployed',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    then('It should display that the schedule was created', async () => {
      createController = new CreateController({});
      await createController.createSchedule({
        functionName: 'deployedFunction',
        cronExpression: '* * * * *',
      });

      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/has been created/),
      );
    });
  });

  test('Run the create:schedule command with create:schedule -n notDeployedFunction -c "* * * * *"', async ({
    given,
    then,
  }) => {
    const createView = new CreateView();
    let createController: CreateController;
    given('I am authenticated', async () => {
      await fileService.writeTempFile({
        '1234567890': {
          token: '454545478787',
          userId: 'userId_deployed',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    then(
      'I try to create an schedule undeployed function with create:schedule -n notDeployedFunction -c "* * * * *"',
      async () => {
        createView.askForDeployedLambda = jest.fn(async () => ({
          name: 'testFunction',
        })) as any;
        createController = new CreateController({ createView });
        await createController.createSchedule({
          functionName: 'undeployedFunction',
          cronExpression: '* * * * *',
        });
      },
    );

    then(
      'It should display that it failed to create the schedule',
      async () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringMatching(/was not found as a deployed/),
        );
      },
    );

    then(
      'It should prompt me a list of deployed functions from which to schedule',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async () => {},
    );

    then('It should display that the schedule was created', async () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/has been created/),
      );
    });
  });

  test('Run the create:schedule command with create:schedule -n dep... and an unforseen error occurs', async ({
    given,
    then,
  }) => {
    const createView = new CreateView();
    let createController: CreateController;
    given('I am authenticated', async () => {
      await fileService.writeTempFile({
        '1234567890': {
          token: '454545478787',
          userId: 'userId_deployed',
          username: 'testUser@liveperson.com',
          active: true,
        },
      });
    });

    then(
      'I try to create an schedule with create:schedule -n deployedFunction -c "* * * * *"',
      async () => {
        createView.askForDeployedLambda = jest.fn(() => {
          // eslint-disable-next-line no-throw-literal
          throw {
            errorCode: '999',
            errorMsg: 'Unexpected Error',
          };
        });
        createController = new CreateController({ createView });
        await createController.createSchedule({
          functionName: 'undeployedFunction',
          cronExpression: '* * * **',
        });
      },
    );

    then(
      'It should display that it failed to create the schedule with an unexpected error',
      async () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringMatching(/Unexpected Error/),
        );
      },
    );
  });
});
