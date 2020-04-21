/* eslint-disable @typescript-eslint/no-empty-function */
import { defineFeature, loadFeature } from 'jest-cucumber';
import * as os from 'os';
import * as fs from 'fs-extra';
import { join } from 'path';
import { LogoutController } from '../../../src/controller/logout.controller';
import { LogoutView } from '../../../src/view/logout.view';
import { FileService } from '../../../src/service/file.service';
import { Prompt } from '../../../src/view/printer';

const feature = loadFeature('test/commands/logout/logout.feature');

defineFeature(feature, (test) => {
  const testDir = join(__dirname, 'test');
  const consoleSpy = jest.spyOn(global.console, 'log').mockImplementation();
  jest.spyOn(process, 'cwd').mockReturnValue(testDir);
  jest.spyOn(os, 'tmpdir').mockReturnValue(testDir);
  const fileService = new FileService({ cwd: testDir });

  jest.setTimeout(10000);

  beforeEach(() => {
    fs.ensureDirSync(testDir);
  });

  afterEach(() => {
    fs.removeSync(testDir);
  });

  async function createTempFile() {
    await fileService.writeTempFile({
      '123456789': {
        token: 'öadjsfölajksdföas',
        active: true,
        username: 'logout@liveperson.com',
        userId: 'logoutUserId',
      },
    });
  }

  test('Run the logout command', ({ given, when, then, and }) => {
    given('I have an accountId saved', async () => {
      await createTempFile();
    });

    when(
      'I run the logout command and select my desired accountId',
      async () => {
        const promptMock = new Prompt();
        promptMock.run = jest.fn(() => ({
          accountId: '123456789',
        })) as any;
        const logoutView = new LogoutView({ prompt: promptMock });

        const logoutController = new LogoutController({ logoutView });
        await logoutController.logout();
      },
    );

    then('The token of the selected accoundId is set to null', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          active: true,
          token: null,
          csrf: null,
          sessionId: null,
          userId: 'logoutUserId',
          username: 'logout@liveperson.com',
        },
      });
    });

    and('I see a success message', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Logout successful/),
      );
    });
  });
  test('Run the logout command with the accoundId flag', ({
    given,
    when,
    then,
    and,
  }) => {
    given('I have an accountId saved', async () => {
      await createTempFile();
    });

    when('I run the logout command and pass an accoundId as flag', async () => {
      const logoutController = new LogoutController();
      await logoutController.logout({ accountId: '123456789' });
    });

    then('The token of the selected accoundId is set to null', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '123456789': {
          active: true,
          token: null,
          csrf: null,
          sessionId: null,
          userId: 'logoutUserId',
          username: 'logout@liveperson.com',
        },
      });
    });

    and('I see a success message', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Logout successful/),
      );
    });
  });
  test('Run the logout command with the delete flag', ({
    given,
    when,
    then,
    and,
  }) => {
    given('I have an accountId saved', async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: 'öadjsfölajksdföas',
          active: true,
          username: 'logout@liveperson.com',
          userId: 'logoutUserId1',
        },
        '987654321': {
          token: 'asdfasdfasdf',
          active: true,
          username: 'logout@liveperson.com',
          userId: 'logoutUserId2',
        },
      });
    });

    when(
      'I run the logout command with the delete flag and select my desired accountId',
      async () => {
        const promptMock = new Prompt();
        promptMock.run = jest.fn(() => ({
          accountId: '123456789',
        })) as any;
        const logoutView = new LogoutView({ prompt: promptMock });

        const logoutController = new LogoutController({ logoutView });
        await logoutController.logout({ delete: true });
      },
    );

    then('The selected account is deleted from the temp file', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toEqual({
        '987654321': {
          token: 'asdfasdfasdf',
          active: true,
          username: 'logout@liveperson.com',
          userId: 'logoutUserId2',
        },
      });
    });

    and('I see a success message', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Account was successfully deleted locally/),
      );
    });
  });

  test('Run the logout command with the delete flag and delete all accounts', ({
    given,
    when,
    then,
    and,
  }) => {
    given('I have an accountId saved', async () => {
      await createTempFile();
    });

    when(
      'I run the logout command with the delete flag and delete all accounts',
      async () => {
        const promptMock = new Prompt();
        promptMock.run = jest.fn(() => ({
          accountId: '123456789',
        })) as any;
        const logoutView = new LogoutView({ prompt: promptMock });

        const logoutController = new LogoutController({ logoutView });
        await logoutController.logout({ delete: true });
      },
    );

    then('All accounts are deleted', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toBeUndefined();
    });

    then('The temp file is deleted', async () => {
      const tempFile = await fileService.getTempFile();
      expect(tempFile).toBeUndefined();
    });

    and('I see a success message', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Account was successfully deleted locally/),
      );
    });
  });

  test('Run the logout command without having a temp file', ({
    given,
    when,
    then,
  }) => {
    given('I have no account saved', () => {});

    when('I run the logout command', async () => {
      const logoutController = new LogoutController();
      await logoutController.logout();
    });

    then('I see a warn message that no account were found', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/No accounts were found!/),
      );
    });
  });
});
