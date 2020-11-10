import * as fs from 'fs-extra';
import * as os from 'os';

import { join } from 'path';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { AddController } from '../../../src/controller/add.controller';
import { AddView } from '../../../src/view/add.view';
import { FileService } from '../../../src/service/file.service';
import { LoginController } from '../../../src/controller/login.controller';

jest.mock('../../../src/service/faas.service', () =>
  jest.requireActual('../../__mocks__/faas.service.ts'),
);
jest.mock('../../../src/service/faasFactory.service', () =>
  jest.requireActual('../../__mocks__/faasFactory.service.ts'),
);

const feature = loadFeature('test/commands/add/add.domain.feature');

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

  test('Run the add:domain command not logged in', async ({
    given,
    when,
    then,
  }) => {
    const addView = new AddView();
    let addController: AddController;
    const loginController = new LoginController();
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

    when(
      'I run the add:domain command with lpf add:domain "*.liveperson.com" sample.co.uk',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async () => {
        addController = new AddController({
          addView,
          loginController,
        });
        await addController.addDomains(['*.liveperson.com', 'sample.co.uk']);
      },
    );

    then('It should tell me to login', async () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/You have to be logged/),
      );
    });

    then(
      'It should tell me that the domains have been added to the account',
      async () => {
        expect(consoleSpy).toBeCalledWith(
          expect.stringMatching(/was added to your account/),
        );
      },
    );
  });

  test('Run the add:domain with no parameters', async ({
    given,
    when,
    then,
  }) => {
    const addView = new AddView();
    let addController: AddController;
    const loginController = new LoginController();
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
      'I run the add:domain command with lpf add:domain',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async () => {
        addController = new AddController({
          addView,
          loginController,
        });
        await addController.addDomains();
      },
    );

    then('It should tell me to add domains', async () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Please add domains to the/),
      );
    });
  });

  test('Run the add:domain with malformed url', async ({
    given,
    when,
    then,
  }) => {
    const addView = new AddView();
    let addController: AddController;
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
      'I run the add:domain command with lpf add:domain "¶¢["',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async () => {
        addView.showDomainAdded = jest.fn(() => {
          // eslint-disable-next-line no-throw-literal
          throw {
            errorCode: '400',
            errorMsg: '',
          };
        });

        addController = new AddController({ addView });

        await addController.addDomains(['¶¢[']);
      },
    );

    then('It should tell me to change the url', async () => {
      expect(consoleSpy).toBeCalledWith(expect.stringMatching(/malformatting/));
    });
  });
});
