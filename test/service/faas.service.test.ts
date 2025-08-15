/* eslint-disable no-throw-literal */
/* eslint-disable node/no-unsupported-features/node-builtins */
import * as os from 'os';
import { Readable } from 'stream';
import { FaasService } from '../../src/service/faas.service';
import { LoginController } from '../../src/controller/login.controller';
import { CsdsClient } from '../../src/service/csds.service';
import * as mock from './faas.service.mock';

describe('faas service', () => {
  jest.spyOn(os, 'tmpdir').mockReturnValue(__dirname);

  it('should setup the faas service', async () => {
    const loginController = new LoginController();
    loginController.getLoginInformation = jest.fn(
      () => mock.mockLoginInformation,
    ) as any;
    const faasService = await new FaasService({ loginController }).setup();
    expect(faasService.token).toBe(mock.mockLoginInformation.token);
    expect(faasService.userId).toBe(mock.mockLoginInformation.userId);
    expect(faasService.username).toBe(mock.mockLoginInformation.username);
    expect(faasService.accountId).toBe(mock.mockLoginInformation.accountId);
    expect(faasService).toHaveProperty('csdsClient');
    expect(faasService).toHaveProperty('got');
  });

  it('should throw an error during setup', async () => {
    const loginController = new LoginController();
    loginController.getLoginInformation = jest.fn(() => {
      throw new Error('error during login');
    }) as any;

    const faasService = await new FaasService({ loginController }).setup();
    expect(faasService.token).toBeUndefined();
    expect(faasService.userId).toBeUndefined();
  });

  it('should undeploy a lambda', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      body: mock.mockUndeployResponse,
    })) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.undeploy('123-123-123');
    expect(response).toEqual(mock.mockUndeployResponse);
  });

  it('should throw an error during undeployment', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            message: 'Error during undeployment',
            code: 'com.liveperson.error.undeployment',
          },
        },
      };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.undeploy('123-123-123');
    expect(response).toEqual(
      mock.mockErrorResponse('Error during undeployment', '123-123-123'),
    );
  });

  it('should deploy a lambda', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      body: mock.mockDeployResponse,
    })) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.deploy('123-123-123');
    expect(response).toEqual(mock.mockDeployResponse);
  });

  it('should throw an error during deployment', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            message: 'Error during deployment',
            code: 'com.liveperson.error.deployment',
          },
        },
      };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.deploy('123-123-123');
    expect(response).toEqual(
      mock.mockErrorResponse('Error during deployment', '123-123-123'),
    );
  });

  it('should get all function metas', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      body: mock.mockAllFunctionMetas,
    })) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getAllFunctionMetas();
    expect(response).toEqual(mock.mockAllFunctionMetas);
  });

  it('should get all functions', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    let callCount = 0;
    const gotDefault = jest.fn((url) => {
      callCount += 1;
      if (callCount === 1) {
        return { body: mock.mockAllFunctionMetas };
      }
      if (url.includes('123-123-123')) {
        return { body: mock.mockFunction1 };
      }
      return { body: mock.mockFunction2 };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getAllFunctions();
    expect(response).toHaveLength(2);
    expect(response[0].name).toBe('lambda1');
    expect(response[0].manifest.id).toBe('manifest-1');
    expect(response[1].name).toBe('lambda2');
    expect(response[1].manifest.id).toBe('manifest-2');
  });

  it('should throw an error during getting all function metas', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            message: 'Error during getting all function metas',
            code: 'com.liveperson.error.allFunctionMetas',
          },
        },
      };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.getAllFunctionMetas();
    } catch (error) {
      expect(error.errorMsg).toBe('Error during getting all function metas');
    }
  });

  it('should get a function by uuid', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      body: [mock.mockFunction1],
    })) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getFunctionByUuid('123-123-123');
    expect(response).toEqual(mock.mockFunction1);
  });

  it('should throw an error during get function by uuid', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            message: 'Error during getting function by uuid',
            code: 'com.liveperson.error.functionByUuid',
          },
        },
      };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.getFunctionByUuid('123-123-123');
    } catch (error) {
      expect(error.errorMsg).toBe('Error during getting function by uuid');
    }
  });

  it('should push a function', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({ body: mock.mockFunction1 })) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });

    const result = await faasService.push({
      body: mock.mockFunction1,
      uuid: '123-123-123',
    });
    expect(result).toBe(true);
  });

  it('should push a new function', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    let callCount = 0;
    const gotDefault = jest.fn(() => {
      callCount += 1;
      if (callCount === 1) {
        return { body: mock.mockFunction1 };
      }
      return { body: {} };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });

    const result = await faasService.pushNewFunction({
      body: mock.mockFunction1,
    });
    expect(result).toBe(true);
  });

  it('should fail during pushing a function with generic error', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: { body: { code: 'generic', message: 'Generic Error' } },
      };
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });

    try {
      await faasService.push({
        body: mock.mockFunction1,
        uuid: '123-123-123',
      });
    } catch (error) {
      expect(error.message).toEqual('Generic Error');
    }
  });

  it('should fail during pushing a function with contract-error', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            code: 'com.liveperson.faas.fm.validation.interface-wrong',
            message:
              'FunctionName§! contains not allowed characters. Only numeric, letters, underscore or spaces may be included',
          },
        },
      };
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });

    try {
      await faasService.push({
        body: { ...mock.mockFunction1, name: 'FunctionName§!' },
        uuid: '123-123-123',
      });
    } catch (error) {
      expect(error.message).toContain(
        'Function Validation Error: FunctionName§! contains not allowed characters. Only numeric, letters, underscore or spaces may be included',
      );
    }
  });

  it('should throw an error during invoking a function', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            message: 'Error during invoking function',
            code: 'com.liveperson.error.functionInvoke',
          },
        },
      };
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.invoke('123-123-123', { headers: [], payload: {} });
    } catch (error) {
      expect(error).toEqual({
        errorMsg: 'Error during invoking function',
        errorCode: 'com.liveperson.error.functionInvoke',
      });
    }
  });

  it('should invoke a function', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      body: mock.mockInvokeResponse,
    })) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.invoke('123-123-123', {
      headers: [],
      payload: {},
    });
    expect(response).toEqual(mock.mockInvokeResponse);
  });

  it('should get logs with header of a function', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const LOGS_WITH_HEADER = `${mock.mockLogs.header}\n${mock.mockLogs.data}`;
    const gotDefault = {
      stream: jest.fn(() => {
        return Readable.from([LOGS_WITH_HEADER]);
      }),
    } as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    let logged = '';
    jest.spyOn(process.stdout, 'write').mockImplementation((output) => {
      logged += output;
      return true;
    });
    await faasService.getLogs({
      uuid: '123-123-123',
      start: '1626254040000',
    });
    expect(logged).toEqual(LOGS_WITH_HEADER);
  });

  it('should get logs without header of a function', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const LOGS_WITH_HEADER = `${mock.mockLogs.header}\n${mock.mockLogs.data}`;
    const gotDefault = {
      stream: jest.fn(() => {
        return Readable.from([LOGS_WITH_HEADER]);
      }),
    } as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    let logged = '';
    jest.spyOn(process.stdout, 'write').mockImplementation((output) => {
      logged += output;
      return true;
    });
    await faasService.getLogs({
      uuid: '123-123-123',
      start: '1626254040000',
      removeHeader: true,
      levels: ['Info', 'Warn', 'Error'],
    });
    expect(logged).toEqual(mock.mockLogs.data);
  });

  it('should throw an error during get logs', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = {
      stream: jest.fn(() => {
        throw {
          response: {
            body: {
              message: 'Error during get logs',
              code: 'com.liveperson.error.functionLogs',
            },
          },
        };
      }),
    } as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.getLogs({
        uuid: '123-123-123',
        start: '1626254040000',
      });
      fail('should fail');
    } catch (error) {
      expect(error).toEqual({
        errorMsg: 'Error during get logs',
        errorCode: 'com.liveperson.error.functionLogs',
      });
    }
  });

  it('should get invocation metrics of function', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      body: mock.mockInvocationMetrics,
    })) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getLambdaInvocationMetrics({
      uuid: '123-123-123',
      startTimestamp: 1626254040000,
      endTimestamp: 1626254040000,
      bucketSize: 1000 * 60 * 5,
    });
    expect(response).toEqual(mock.mockInvocationMetrics);
  });

  it('should throw an 401 error if received a 401 error on getStream', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = {
      stream: jest.fn(() => {
        throw new Error('401');
      }),
    } as any;
    const faasService = new FaasService({ gotDefault, csdsClient }) as any;
    try {
      await faasService.getStream({
        urlPart: '/test',
      });
      fail('should fail');
    } catch (error) {
      expect(error).toEqual({
        errorCode: '401',
        errorMsg:
          'You are not authorized to perform this action, please check your permissions',
      });
    }
  });

  it('should throw an error if received a different error than 401 or error with body on getStream', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');

    const gotDefault = {
      stream: () => {
        const readableStream = Readable.from('test');
        readableStream.on('data', (_chunk) => {
          readableStream.emit('error', 'Stream Error');
        });
        return readableStream;
      },
    } as any;
    const faasService = new FaasService({ gotDefault, csdsClient }) as any;
    try {
      await faasService.getStream(
        {
          urlPart: '/test',
        },
        process.stdout,
      );
      fail('should fail');
    } catch (error) {
      expect(error).toEqual('Stream Error');
    }
  });

  it('should throw an error during get logs if not logged in', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = {
      stream: jest.fn(() => {
        throw new Error('401');
      }),
    } as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.getLogs({
        uuid: '123-123-123',
        start: '1626254040000',
      });
    } catch (error) {
      expect(error).toEqual({
        errorCode: '401',
        errorMsg:
          'You are not authorized to perform this action, please check your permissions',
      });
    }
  });

  it('should create a schedule', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      body: mock.mockSchedule,
    })) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.createSchedule({
      cronExpression: '* * * *',
      isActive: true,
      lambdaUUID: '1234-1234-1234',
    });
    expect(response).toEqual(mock.mockSchedule);
  });

  it('should get functions by names', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    let callCount = 0;
    const gotDefault = jest.fn((url) => {
      callCount += 1;
      if (callCount === 1) {
        return { body: mock.mockAllFunctionMetas };
      }
      if (url.includes('123-123-123')) {
        return { body: mock.mockFunction1 };
      }
      return { body: mock.mockFunction2 };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getLambdasByNames([
      'lambda1',
      'lambda2',
    ]);

    expect(response).toHaveLength(2);
    expect(response[0].name).toBe('lambda1');
    expect(response[1].name).toBe('lambda2');
    expect(response[0].manifest).toBeDefined();
    expect(response[1].manifest).toBeDefined();
  });

  it('should get all events', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      body: mock.mockEvents,
    })) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getEvents();

    expect(response).toEqual(mock.mockEvents);
  });

  it('should get all deployments', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      body: mock.mockDeployments,
    })) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getAllDeployments();

    expect(response).toHaveLength(2);
    expect(response[0].functionUuid).toBe('123-123-123');
    expect(response[1].functionUuid).toBe('456-456-456');
  });

  it('should get Account Statistic', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn(async () => 'faasUi');
    const gotDefault = jest.fn(async (url) => {
      if (url.includes('/functions/count')) {
        return { body: 5 };
      }
      if (url.includes('/reports/invocationCounts')) {
        return {
          body: [
            { successfulInvocations: 10, failedInvocations: 2 },
            { successfulInvocations: 15, failedInvocations: 1 },
          ],
        };
      }
      if (url.includes('/deployments/count')) {
        return { body: 8 };
      }
      return { body: null };
    }) as any;
    const loginController = new LoginController();
    loginController.getLoginInformation = jest.fn(
      async () => mock.mockLoginInformation,
    );
    const faasService = new FaasService({
      gotDefault,
      csdsClient,
      loginController,
    });
    await faasService.setup();
    const response = await faasService.getAccountStatistic();

    expect(response).toEqual(mock.mockAccountStatistic);
  });

  it('should throw an error while pushing function', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn(async () => 'faasUi');
    const gotDefault = jest.fn(async () => {
      throw {
        response: {
          body: {
            message: 'Error during invoking function',
            code: 'com.liveperson.error.functionInvoke',
            errorLogs: 'error logs during push',
          },
        },
      };
    }) as any;
    const loginController = new LoginController();
    loginController.getLoginInformation = jest.fn(
      async () => mock.mockLoginInformation,
    );
    const faasService = new FaasService({
      gotDefault,
      csdsClient,
      loginController,
    });
    await faasService.setup();
    try {
      await faasService.push({ body: mock.mockFunction1 });
    } catch (error) {
      expect(error.message).toEqual('Error during invoking function');
    }
  });

  it('should throw an error with unauthorized', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          statusCode: 401,
          body: {
            message: 'Unauthorized',
            code: '401',
          },
        },
      };
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });

    try {
      await faasService.getLambdasByNames(['lambda1', 'lambda2']);
    } catch (error) {
      expect(error).toEqual({
        errorCode: '401',
        errorMsg:
          'You are not authorized to perform this action, please check your permissions',
      });
    }
  });

  it('should push function meta successfully', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({ body: mock.mockFunction1 })) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const result = await faasService.pushFunctionMeta('123-123-123', {
      description: 'Updated description',
      skills: ['skill1', 'skill2'],
    });

    expect(result).toBeTruthy();
  });

  it('should return false when function meta is unchanged', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            code: 'com.liveperson.faas.function.unchanged',
            message: 'Function unchanged',
          },
        },
      };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const result = await faasService.pushFunctionMeta('123-123-123', {
      description: 'Same description',
    });

    expect(result).toBe(false);
  });

  it('should push function manifest successfully', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({ body: {} })) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const result = await faasService.pushFunctionManifest('123-123-123', {
      version: 1,
      runtime: 'nodejs14.x',
      code: 'function handler() {}',
      customDependencies: {},
      environment: {},
    });

    expect(result).toBe(true);
  });

  it('should return false when function manifest is unchanged', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            code: 'com.liveperson.faas.function.unchanged',
            message: 'Function unchanged',
          },
        },
      };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const result = await faasService.pushFunctionManifest('123-123-123', {
      version: 1,
      runtime: 'nodejs14.x',
      code: 'function handler() {}',
      customDependencies: {},
      environment: {},
    });

    expect(result).toBe(false);
  });

  it('should push new meta successfully', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({ body: mock.mockFunction1 })) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const result = await faasService.pushNewMeta(mock.mockFunction1);
    expect(result.uuid).toBe('123-123-123');
    expect(result.name).toBe('lambda1');
  });
});
