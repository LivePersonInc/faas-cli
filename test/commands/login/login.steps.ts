/* eslint-disable import/first */
/* eslint-disable @typescript-eslint/no-empty-function */
import { defineFeature, loadFeature } from 'jest-cucumber';
import * as fs from 'fs-extra';
import * as os from 'os';
import { join } from 'path';

jest.mock('../../../src/service/faas.service', () =>
  jest.requireActual('../../__mocks__/faas.service.ts'),
);
jest.mock('../../../src/service/faasFactory.service', () =>
  jest.requireActual('../../__mocks__/faasFactory.service.ts'),
);

import { FileService } from '../../../src/service/file.service';
import { LoginController } from '../../../src/controller/login.controller';
import { LoginView } from '../../../src/view/login.view';
import { LoginService } from '../../../src/service/login.service';
import { GetController } from '../../../src/controller/get.controller';

const feature = loadFeature('test/commands/login/login.feature');

defineFeature(feature, (test) => {
  fs.removeSync(join(__dirname, 'faas-tmp.json'));
  const consoleSpy = jest.spyOn(global.console, 'log');
  const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
  jest.spyOn(process, 'cwd').mockReturnValue(__dirname);
  jest.spyOn(os, 'tmpdir').mockReturnValue(__dirname);
  const fileService = new FileService({ cwd: __dirname });

  afterEach(() => {
    consoleSpy.mockReset();
  });

  afterAll(async () => {
    fs.remove(join(__dirname, 'faas-tmp.json'));
    jest.resetAllMocks();
  });

  test('Run the login command for the first time', async ({
    given,
    when,
    then,
    and,
  }) => {
    const loginService = new LoginService();
    loginService.login = jest.fn().mockReturnValue({
      bearer: 'aöskldfj02ajösldkfjalsdkf',
      config: {
        userId: 'TestUserId',
        loginName: 'testUser',
      },
    });

    given('I have no saved accountId', async () => {
      fs.removeSync(join(__dirname, 'faas-tmp.json'));
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toBeUndefined();
    });

    when('I run the login command and enter an accountId', async () => {
      const loginView = new LoginView();
      loginView.chooseOrEnterAccountId = jest.fn(async () => ({
        accountId: '123456789',
      })) as any;
      loginView.askForUsernameAndPassword = jest.fn(async () => ({
        username: 'testUser',
        password: 'testPW',
      })) as any;

      const loginController = new LoginController({ loginView, loginService });
      await loginController.loginByCommand();
    });

    when('I provide a valid password and username', () => {});

    then('It should print the welcome message', async () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Welcome to/),
      );
    });

    and(
      'Token, accoundId and username will be saved in the temp file',
      async () => {
        const tempFile = await fileService.getTempFile();
        expect(tempFile).toEqual({
          '123456789': {
            token: 'aöskldfj02ajösldkfjalsdkf',
            userId: 'TestUserId',
            username: 'testUser',
            active: true,
          },
        });
      },
    );
  });

  test('Run the login command after the first successful time and token is still valid', async ({
    given,
    when,
    then,
  }) => {
    let loginService: LoginService;

    given('I have an accountId set up', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          token: 'aöskldfj02ajösldkfjalsdkf',
          userId: 'TestUserId',
          username: 'testUser',
          active: true,
        },
      });
    });

    given('Token is still valid', () => {
      loginService = new LoginService();
      loginService.isTokenValid = jest.fn(async () => true);
    });

    when('I run the login command and select an accountId', async () => {
      const loginView = new LoginView();
      loginView.chooseOrEnterAccountId = jest.fn(async () => ({
        accountId: '123456789',
      })) as any;
      const loginController = new LoginController({ loginView, loginService });
      await loginController.loginByCommand();
    });

    then('It should print the welcome message', async () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Welcome to/),
      );
    });
  });

  test('Run the login command after the first successful time and token is invalid', async ({
    given,
    when,
    then,
    and,
  }) => {
    let loginService: LoginService;

    given('I have an accountId set up', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          token: 'aöskldfj02ajösldkfjalsdkf',
          userId: 'TestUserId',
          username: 'testUser',
          active: true,
        },
      });
    });

    given('Token is invalid', async () => {
      loginService = new LoginService();
      loginService.isTokenValid = jest.fn(async () => false);
      loginService.login = jest.fn().mockReturnValue({
        bearer: 'aöskldfj02ajösldkfjalsdkf',
        config: {
          userId: 'TestUserId',
          loginName: 'testUser',
        },
      });
    });

    when('I run the login command and select an accountId', async () => {
      const loginView = new LoginView();
      loginView.chooseOrEnterAccountId = jest.fn(async () => ({
        accountId: '123456789',
      })) as any;
      loginView.askForUsernameAndPassword = jest.fn(async () => ({
        username: 'testUser',
        password: 'testPW',
      })) as any;

      const loginController = new LoginController({ loginView, loginService });
      await loginController.loginByCommand();
    });

    when('I provide a valid password and username', () => {});

    then('It should print the welcome message', async () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Welcome to/),
      );
    });

    and('Token and username will be updated in the temp file', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          token: 'aöskldfj02ajösldkfjalsdkf',
          userId: 'TestUserId',
          username: 'testUser',
          active: true,
        },
      });
    });
  });

  test('Run the login command with the password flag and token is invalid', async ({
    given,
    when,
    then,
    and,
  }) => {
    let loginService: LoginService;

    given('I have an accountId set up', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          token: 'aöskldfj02ajösldkfjalsdkf',
          userId: 'TestUserId',
          username: 'testUser',
          active: true,
        },
      });
    });

    given('Token is invalid', () => {
      loginService = new LoginService();
      loginService.isTokenValid = jest.fn().mockReturnValue(false);
      loginService.login = jest.fn().mockReturnValue({
        bearer: 'aöskldfj02ajösldkfjalsdkf',
        config: {
          userId: 'TestUserId',
          loginName: 'testUser',
        },
      });
    });

    when('I run the login command and select an accountId', async () => {
      const loginView = new LoginView();
      loginView.chooseOrEnterAccountId = jest.fn(async () => ({
        accountId: '123456789',
      })) as any;
      loginView.askForUsernameAndPassword = jest.fn(async () => ({
        username: 'testUser',
      })) as any;

      const loginController = new LoginController({ loginView, loginService });
      await loginController.loginByCommand({
        inputFlags: { password: 'testPW' },
      });
    });

    when('I provide a valid username', () => {});

    then('It should print the welcome message', async () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Welcome to/),
      );
    });

    and('Token and username will be updated in the temp file', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          token: 'aöskldfj02ajösldkfjalsdkf',
          userId: 'TestUserId',
          username: 'testUser',
          active: true,
        },
      });
    });
  });

  test('Run the login command with the accountId, password and username flag and token is invalid', async ({
    given,
    when,
    then,
    and,
  }) => {
    let loginService: LoginService;

    given('I have an accountId set up', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          token: 'aöskldfj02ajösldkfjalsdkf',
          userId: 'TestUserId',
          username: 'testUser',
          active: true,
        },
      });
    });

    given('Token is invalid', () => {
      loginService = new LoginService();
      loginService.isTokenValid = jest.fn().mockReturnValue(false);
      loginService.login = jest.fn().mockReturnValue({
        bearer: 'aöskldfj02ajösldkfjalsdkf',
        config: {
          userId: 'TestUserId',
          loginName: 'testUser',
        },
      });
    });

    when('I run the login command', async () => {
      const loginView = new LoginView();
      loginView.chooseOrEnterAccountId = jest.fn(async () => ({
        accountId: '123456789',
      })) as any;
      loginView.askForUsernameAndPassword = jest.fn(async () => ({
        password: 'testPW',
        accountId: '123456789',
        username: 'testUser',
      })) as any;

      const loginController = new LoginController({ loginView, loginService });
      await loginController.loginByCommand({
        inputFlags: {
          password: 'testPW',
          accountId: '123456789',
          username: 'testUser',
        },
      });
    });

    then('It should print the welcome message', async () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Welcome to/),
      );
    });

    and('Token and username will be updated in the temp file', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          token: 'aöskldfj02ajösldkfjalsdkf',
          userId: 'TestUserId',
          username: 'testUser',
          active: true,
        },
      });
    });
  });

  test('Run the login command with invalid credentials', async ({
    given,
    when,
    then,
  }) => {
    let loginService: LoginService;

    given('I have an accountId set up', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          token: 'aöskldfj02ajösldkfjalsdkf',
          userId: 'TestUserId',
          username: 'testUser',
          active: true,
        },
      });
    });

    given('Token is invalid', () => {
      loginService = new LoginService();
      loginService.isTokenValid = jest.fn().mockReturnValue(false);
      loginService.login = jest.fn(async () => {
        throw new Error('Error during login');
      });
    });

    when('I run the login command and select an accountId', async () => {
      const loginView = new LoginView();
      loginView.chooseOrEnterAccountId = jest.fn(async () => ({
        accountId: '123456789',
      })) as any;
      loginView.askForUsernameAndPassword = jest.fn(async () => ({
        username: 'testUser',
      })) as any;

      const loginController = new LoginController({ loginView, loginService });
      await loginController.loginByCommand({
        inputFlags: { password: 'testPW' },
      });
    });

    when('I provide a wrong password and username', () => {});

    then('It should print the error message', () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Looks like something went wrong/),
      );
    });
  });

  test('Run the login command with SSO workflow', async ({
    given,
    when,
    then,
    and,
  }) => {
    let token: string;
    let userId: string;
    const accountId = '123456789';
    const loginController = new LoginController({ fileService });

    given(
      'I have fetched the token and userId following the instructions',
      async () => {
        await fs.remove(join(__dirname, 'faas-tmp.json'));
        await fileService.writeTempFile({
          '6666666': {
            token: '454545478787',
            userId: 'userId_123456789',
            username: 'testUser@liveperson.com',
            active: true,
          },
        });

        token = 'öalksdjföalksdfjöasdf';
        userId = 'userId_123456789_SSO';
      },
    );

    when(
      'I run the login command with the flags from the instructions',
      async () => {
        await loginController.loginByCommand({
          inputFlags: { token, userId, accountId },
        });
      },
    );

    then('It should print the welcome message', async () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Welcome to/),
      );
    });

    and('Token and username will be updated in the temp file', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          token: 'öalksdjföalksdfjöasdf',
          userId: 'userId_123456789_SSO',
          csrf: null,
          sessionId: null,
          active: true,
        },
        '6666666': {
          active: false,
          token: '454545478787',
          userId: 'userId_123456789',
          username: 'testUser@liveperson.com',
        },
      });
    });

    and(
      'I run any desired command and it will perform the normal action',
      async () => {
        stdoutSpy.mockReset();

        const response = await loginController.getLoginInformation();
        expect(response).toEqual({
          accountId: '123456789',
          token: 'öalksdjföalksdfjöasdf',
          userId: 'userId_123456789_SSO',
          username: '',
        });

        const getController = new GetController();
        await getController.get({ domains: ['functions'] });

        expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
          'FunctionSSO                   Productive',
        );
      },
    );
  });
});
