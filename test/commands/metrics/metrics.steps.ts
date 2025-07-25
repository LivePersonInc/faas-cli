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

import { MetricsController } from '../../../src/controller/metrics.controller';
import { FileService } from '../../../src/service/file.service';
import { DefaultStructureService } from '../../../src/service/defaultStructure.service';
import { MetricsView } from '../../../src/view/metrics.view';

const feature = loadFeature('test/commands/metrics/metrics.feature');
defineFeature(feature, (test) => {
  jest.setTimeout(100000);
  const testDir = join(__dirname, 'test');
  const fileService = new FileService();
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
  });

  afterAll(() => {
    jest.resetAllMocks();
    fs.removeSync(testDir);
  });

  test('Get metrics of a function with function name and only lasting period provided', ({
    given,
    when,
    then,
  }) => {
    const cliUx = {
      table: jest.fn(),
    };
    const metricsView = new MetricsView({ cliUx });

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_metrics',
          username: 'metrics@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the metrics command and pass the function name and a 1h period',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        const controller = new MetricsController({ metricsView });
        await controller.getMetrics({
          lambdaFunction: 'exampleFunction',
          inputFlags: { last: '1h' },
        });
      },
    );

    then('It should call getMetrics', () => {
      expect(stdoutSpy).toBeCalledWith(
        expect.stringContaining('f791e5ca-3e78-4990-a066-59b82cdfd6a0'),
      );
      expect(stdoutSpy).toBeCalledWith(
        expect.stringContaining('"bucketSize":300'),
      );
      expect(stdoutSpy).toBeCalledWith(
        expect.stringContaining(String(Math.floor(Date.now() / 10000))),
      );
    });

    then('It should display metrics', () => {
      expect(JSON.stringify(cliUx.table.mock.calls[0])).toContain(
        '1656420000000',
      );
      expect(JSON.stringify(cliUx.table.mock.calls[0])).toContain(
        'CODING_FAILURE',
      );
      expect(JSON.stringify(cliUx.table.mock.calls[0])).toContain('UKNOWN');
    });
  });

  test('Get an error if lasting period flag incomplete', ({
    given,
    when,
    then,
  }) => {
    const cliUx = {
      table: jest.fn(),
    };
    const metricsView = new MetricsView({ cliUx });
    let thrownError;
    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_metrics',
          username: 'metrics@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the metrics command and pass the function name and a 1 period',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        const controller = new MetricsController({ metricsView });
        try {
          await controller.getMetrics({
            lambdaFunction: 'exampleFunction',
            inputFlags: { last: '1' },
          });
        } catch (error) {
          thrownError = error;
        }
      },
    );

    then(
      'It should throw an error that this is an incomplete period flag',
      () => {
        expect(thrownError.message).toContain('flag unit has to be m');
      },
    );
  });

  test('Get metrics of a function with function with start and end provided', ({
    given,
    when,
    then,
  }) => {
    const cliUx = {
      table: jest.fn(),
    };
    const metricsView = new MetricsView({ cliUx });

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_metrics',
          username: 'metrics@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the metrics command and pass the function name and a start timestamp and an end timestamp',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        const controller = new MetricsController({ metricsView });
        await controller.getMetrics({
          lambdaFunction: 'exampleFunction',
          inputFlags: {
            start: Date.now() - 1000 * 60 * 60 * 24 * 30,
            end: Date.now(),
          },
        });
      },
    );

    then('It should call getMetrics', () => {
      expect(stdoutSpy).toBeCalledWith(
        expect.stringContaining('f791e5ca-3e78-4990-a066-59b82cdfd6a0'),
      );
      expect(stdoutSpy).toBeCalledWith(
        expect.stringContaining('"bucketSize":86400'),
      );
      expect(stdoutSpy).toBeCalledWith(
        expect.stringContaining(String(Math.floor(Date.now() / 1000000))),
      );
    });

    then('It should display metrics', () => {
      expect(JSON.stringify(cliUx.table.mock.calls[0])).toContain(
        '1656420000000',
      );
      expect(JSON.stringify(cliUx.table.mock.calls[0])).toContain(
        'CODING_FAILURE',
      );
      expect(JSON.stringify(cliUx.table.mock.calls[0])).toContain('UNKOWN');
    });
  });

  test('Get an error with start and end provided in a period of <15m', ({
    given,
    when,
    then,
  }) => {
    const cliUx = {
      table: jest.fn(),
    };
    const metricsView = new MetricsView({ cliUx });
    let thrownError;

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_metrics',
          username: 'metrics@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the metrics command and pass the function name and a start timestamp and an end timestamp',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        const controller = new MetricsController({ metricsView });
        try {
          await controller.getMetrics({
            lambdaFunction: 'exampleFunction',
            inputFlags: {
              start: Date.now() - 1000 * 60,
              end: Date.now(),
            },
          });
        } catch (error) {
          thrownError = error;
        }
      },
    );
    then('It should throw an error that the minimum period is >15m', () => {
      expect(thrownError.message).toContain(
        'Time period cannot be shorter than 15 minutes.',
      );
    });
  });

  test('Get an error with a start timestamp that is after the end timestamp', ({
    given,
    when,
    then,
  }) => {
    const cliUx = {
      table: jest.fn(),
    };
    const metricsView = new MetricsView({ cliUx });
    let thrownError;

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_metrics',
          username: 'metrics@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the metrics command and pass the function name and a start timestamp and an end timestamp',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        const controller = new MetricsController({ metricsView });
        try {
          await controller.getMetrics({
            lambdaFunction: 'exampleFunction',
            inputFlags: {
              start: Date.now(),
              end: Date.now() - 1000 * 60,
            },
          });
        } catch (error) {
          thrownError = error;
        }
      },
    );
    then(
      'It should throw an error that start should come before end timestamp chronologically',
      () => {
        expect(thrownError.message).toContain(
          'Start timestamp has to be before end timestamp.',
        );
      },
    );
  });

  test('Get an error with start and end provided in a period of >30d', ({
    given,
    when,
    then,
  }) => {
    const cliUx = {
      table: jest.fn(),
    };
    const metricsView = new MetricsView({ cliUx });
    let thrownError;

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_metrics',
          username: 'metrics@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the metrics command and pass the function name and a start timestamp and an end timestamp',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        const controller = new MetricsController({ metricsView });
        try {
          await controller.getMetrics({
            lambdaFunction: 'exampleFunction',
            inputFlags: {
              start: Date.now() - 1000 * 60 * 60 * 24 * 31,
              end: Date.now(),
            },
          });
        } catch (error) {
          thrownError = error;
        }
      },
    );

    then('It should throw an error that the maximum period is <30d', () => {
      expect(thrownError.message).toContain(
        'Time period cannot exceed 30 days.',
      );
    });
  });

  test('Get an error when neither end nor last flag was defined', ({
    given,
    when,
    then,
  }) => {
    const cliUx = {
      table: jest.fn(),
    };
    const metricsView = new MetricsView({ cliUx });
    let thrownError;

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_metrics',
          username: 'metrics@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the metrics command and pass only the function name',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        const controller = new MetricsController({ metricsView });
        try {
          await controller.getMetrics({
            lambdaFunction: 'exampleFunction',
            inputFlags: {},
          });
        } catch (error) {
          thrownError = error;
        }
      },
    );

    then('It should throw an error to either define end or last flag', () => {
      expect(thrownError.message).toContain(
        'Please define either start and end timestamp or define the period for the last 5m, 1h, 7d,... since now',
      );
    });
  });

  test('Get an error when start or end flag is not a valid timestamp', ({
    given,
    when,
    then,
  }) => {
    const cliUx = {
      table: jest.fn(),
    };
    const metricsView = new MetricsView({ cliUx });
    let thrownError;

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_metrics',
          username: 'metrics@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the metrics command and pass the function name and an invalid timestamp',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        const controller = new MetricsController({ metricsView });
        try {
          await controller.getMetrics({
            lambdaFunction: 'exampleFunction',
            inputFlags: {
              start: 'invalid',
            },
          });
        } catch (error) {
          thrownError = error;
        }
      },
    );

    then('It should throw an error for invalid timestamp', () => {
      expect(thrownError.message).toContain('Given timestamps are not valid');
    });
  });

  test('Get CSV when the output is selected as CSV', ({
    given,
    when,
    then,
  }) => {
    const cliUx = {
      table: jest.fn(),
    };
    const metricsView = new MetricsView({ cliUx });

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_metrics',
          username: 'metrics@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the metrics command and pass the function name and csv as output flag',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        const controller = new MetricsController({ metricsView });
        await controller.getMetrics({
          lambdaFunction: 'exampleFunction',
          inputFlags: {
            output: 'csv',
            last: '3d',
          },
        });
      },
    );

    then('It should print out the data as csv', () => {
      expect(stdoutSpy).toBeCalledWith(
        expect.stringContaining('f791e5ca-3e78-4990-a066-59b82cdfd6a0'),
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        'Successful Invocations,Code-based',
      );
    });
  });

  test('Get JSON when the output is selected as JSON', ({
    given,
    when,
    then,
  }) => {
    const cliUx = {
      table: jest.fn(),
    };
    const metricsView = new MetricsView({ cliUx });

    given("I'm logged in", async () => {
      await fileService.writeTempFile({
        '123456789': {
          token: '978654312564',
          userId: 'userId_metrics',
          username: 'metrics@liveperson.com',
          active: true,
        },
      });
    });

    when(
      'I run the metrics command and pass the function name and json as output flag',
      async () => {
        process.env.DEBUG_PATH = 'true';
        const defaultStructureService = new DefaultStructureService();
        defaultStructureService.create = jest.fn(() => {
          fs.copySync(
            join(testDir, 'package.json'),
            join(testDir, 'bin', 'core-functions-toolbelt', 'package.json'),
          );
        });
        const controller = new MetricsController({ metricsView });
        await controller.getMetrics({
          lambdaFunction: 'exampleFunction',
          inputFlags: {
            output: 'json',
            last: '30m',
          },
        });
      },
    );

    then('It should print out the data as json', () => {
      expect(stdoutSpy).toBeCalledWith(
        expect.stringContaining('f791e5ca-3e78-4990-a066-59b82cdfd6a0'),
      );
      expect(JSON.stringify(stdoutSpy.mock.calls)).toContain(
        "'Successful Invocations': 15,",
      );
    });
  });
});
