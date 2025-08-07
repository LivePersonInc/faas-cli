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

import { LogsController } from '../../../src/controller/logs.controller';
import { FileService } from '../../../src/service/file.service';
import { DefaultStructureService } from '../../../src/service/defaultStructure.service';

const feature = loadFeature('test/commands/logs/logs.feature');
defineFeature(feature, (test) => {
  jest.setTimeout(100000);
  const testDir = join(__dirname, 'test');
  const fileService = new FileService();
  const consoleSpy = jest.spyOn(global.console, 'log');
  const stdoutSpy = jest.spyOn(process.stdout, 'write');

  beforeEach(() => {
    jest.spyOn(process, 'cwd').mockReturnValue(testDir);
    jest.spyOn(os, 'tmpdir').mockReturnValue(testDir);
    fs.ensureDirSync(testDir);
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
  });

  afterEach(() => {
    jest.resetAllMocks();
    consoleSpy.mockReset();
  });

  afterAll(() => {
    jest.resetAllMocks();
    fs.removeSync(testDir);
  });

  test('Get logs of a function with function name and only start timestamp as flag provided', ({
    given,
    when,
    then,
  }) => {
    given('I have done the local init', () => {
      fs.ensureDirSync(join(testDir, 'functions', 'exampleFunction'));
    });

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_logs_success',
          username: 'logs@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the logs command and pass the function name and a start timestamp',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        await LogsController.getLogs({
          lambdaFunction: 'exampleFunction',
          inputFlags: { start: '1626254040000' },
        });
      },
    );

    then(
      'It should call getLogs with the uuid of the function and the provided start timestamp',
      () => {
        expect(stdoutSpy).toBeCalledWith(
          expect.stringContaining(
            '{"uuid":"f791e5ca-3e78-4990-a066-59b82cdfd6a0","start":"1626254040000"}',
          ),
        );
      },
    );
  });
  test('Get logs of a function with function name and all flags provided', ({
    given,
    when,
    then,
  }) => {
    given('I have done the local init', () => {
      fs.ensureDirSync(join(testDir, 'functions', 'exampleFunction'));
    });

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_logs_success',
          username: 'logs@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the logs command and pass the function name and all flags',
      async () => {
        process.env.DEBUG_PATH = 'true';
        await LogsController.getLogs({
          lambdaFunction: 'exampleFunction',
          inputFlags: {
            start: '1626254040000',
            end: '1626254050000',
            removeHeader: true,
            levels: ['Info', 'Warn'],
          },
        });
      },
    );

    then(
      'It should call getLogs with the uuid of the function and all provided flags',
      () => {
        expect(stdoutSpy).toBeCalledWith(
          expect.stringContaining(
            '{"uuid":"f791e5ca-3e78-4990-a066-59b82cdfd6a0","start":"1626254040000","end":"1626254050000","removeHeader":true,"levels":["Info","Warn"]}',
          ),
        );
      },
    );
  });
  test('Get logs of a function returning an error on the API should return error', ({
    given,
    when,
    then,
  }) => {
    let thrownError;
    given('I have done the local init', () => {
      fs.ensureDirSync(join(testDir, 'functions', 'exampleFunction'));
    });

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_logs_error',
          username: 'logs@liveperson.com',
          active: true,
        },
      });
    });

    when('I run the logs command', async () => {
      process.env.DEBUG_PATH = 'true';
      try {
        await LogsController.getLogs({
          lambdaFunction: 'nonExistantFunction',
          inputFlags: {
            start: '1626254040000',
          },
        });
      } catch (error) {
        thrownError = error;
      }
    });

    then('It should display an error', () => {
      expect(thrownError.message).toContain(
        'Function nonExistantFunction were not found on the platform',
      );
    });
  });
});
