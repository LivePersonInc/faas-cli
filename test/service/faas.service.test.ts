/* eslint-disable no-throw-literal */
import * as os from 'os';
import { FaasService } from '../../src/service/faas.service';
import { LoginController } from '../../src/controller/login.controller';
import { CsdsClient } from '../../src/service/csds.service';
import { ILambda } from '../../src/types';

describe('faas service', () => {
  jest.spyOn(os, 'tmpdir').mockReturnValue(__dirname);
  it('should setup the faas service', async () => {
    const loginController = new LoginController();
    loginController.getLoginInformation = jest.fn(() => ({
      token: 'öasldkjföasldjföasdf',
      userId: 'userId',
      username: 'username',
      accountId: '123456789',
    })) as any;
    const faasService = await new FaasService({ loginController }).setup();
    expect(faasService.token).toBe('öasldkjföasldjföasdf');
    expect(faasService.userId).toBe('userId');
    expect(faasService.username).toBe('username');
    expect(faasService.accountId).toBe('123456789');
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
      message: 'started undeployment process',
    })) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.undeploy('123-123-123');
    expect(response).toEqual({ message: 'started undeployment process' });
  });

  it('should throw an error during undeployment', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            errorMsg: 'Error during undeployment',
            errorCode: 'com.liveperson.error.undeployment',
          },
        },
      };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.undeploy('123-123-123');
    expect(response).toEqual({
      message: 'Error during undeployment',
      uuid: '123-123-123',
    });
  });

  it('should deploy a lambda', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      message: 'started deployment process',
    })) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.deploy('123-123-123');
    expect(response).toEqual({ message: 'started deployment process' });
  });

  it('should throw an error during deployment', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            errorMsg: 'Error during undeployment',
            errorCode: 'com.liveperson.error.undeployment',
          },
        },
      };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.deploy('123-123-123');
    } catch (error) {
      expect(error).toEqual({
        message: 'Error during deployment',
        uuid: '123-123-123',
      });
    }
  });

  it('should get all lambdas', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => [
      { name: 'lambda1' },
      { name: 'lambda2' },
    ]) as any;
    gotDefault.json = jest.fn();
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getAllLambdas();
    expect(response).toEqual([{ name: 'lambda1' }, { name: 'lambda2' }]);
  });

  it('should throw an error during getting all lambdas', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            errorMsg: 'Error during getting all lambdas',
            errorCode: 'com.liveperson.error.allLambdas',
          },
        },
      };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.getAllLambdas();
    } catch (error) {
      expect(error.errorMsg).toBe('Error during getting all lambdas');
    }
  });

  it('should get a lambda by uuid', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => [
      { name: 'lambda1', uuid: '123-123-123' },
    ]) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getLambdaByUUID('123-123-123');
    expect(response).toEqual({ name: 'lambda1', uuid: '123-123-123' });
  });

  it('should throw an error during get lambda by uuid', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            errorMsg: 'Error during getting lambda by uuid',
            errorCode: 'com.liveperson.error.lambdaByUuid',
          },
        },
      };
    }) as any;

    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.getLambdaByUUID('123-123-123');
    } catch (error) {
      expect(error.errorMsg).toBe('Error during getting lambda by uuid');
    }
  });

  it('should push a lambda', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      return {};
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    await faasService.push({
      method: 'POST',
      body: {} as ILambda,
      uuid: 'uuid',
    });
    expect(gotDefault).toHaveBeenCalledWith(
      'https://faasUI/api/account/undefined/lambdas/uuid?userId=undefined&v=1',
      {
        headers: {
          Authorization: 'Bearer undefined',
          'Content-Type': 'application/json',
          'user-agent': 'faas-cli',
        },
        json: { timestamp: 0 },
        method: 'POST',
        resolveBodyOnly: true,
        responseType: 'json',
      },
    );
  });

  it('should fail during pushing a lambda with generic error', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: { body: { errorCode: 'generic', errorMsg: 'Generic Error' } },
      };
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.push({
        method: 'POST',
        body: {} as ILambda,
        uuid: 'uuid',
      });
    } catch (error) {
      expect(error.message).toEqual('Generic Error');
    }
  });

  it('should fail during pushing a lambda with contract-error', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: { errorCode: 'contract-error', errorMsg: 'Generic Error' },
        },
      };
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.push({
        method: 'POST',
        body: { name: 'FunctionName' } as ILambda,
        uuid: 'uuid',
      });
    } catch (error) {
      expect(error.message).toBe(
        "Push Error: The code of function 'FunctionName' you are trying to push is not a valid lambda.",
      );
    }
  });

  it('should throw an error during invoking a lambda', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw {
        response: {
          body: {
            errorMsg: 'Error during invoking lambda',
            errorCode: 'com.liveperson.error.lambdaInvoke',
          },
        },
      };
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    try {
      await faasService.invoke('123-123-123', { headers: [], payload: {} });
    } catch (error) {
      expect(error).toEqual({
        errorMsg: 'Error during invoking lambda',
        errorCode: 'com.liveperson.error.lambdaInvoke',
      });
    }
  });

  it('should invoke a lambda', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ({
      result: 'StatusCode: 200',
      logs: [
        {
          level: 'Info',
          message: 'Secret Value: ',
          extras: ['TestValue'],
          timestamp: 1583241003935,
        },
        {
          level: 'Info',
          message: 'PROCESS ENV',
          extras: ['TestValue'],
          timestamp: 1583241003935,
        },
      ],
    })) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.invoke('123-123-123', {
      headers: [],
      payload: {},
    });
    expect(response).toEqual({
      result: 'StatusCode: 200',
      logs: [
        {
          level: 'Info',
          message: 'Secret Value: ',
          extras: ['TestValue'],
          timestamp: 1583241003935,
        },
        {
          level: 'Info',
          message: 'PROCESS ENV',
          extras: ['TestValue'],
          timestamp: 1583241003935,
        },
      ],
    });
  });

  it('should get lambdas by names', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn((url) => {
      if (url.includes('lambda1')) {
        return [{ name: 'lambda1', uuid: '123-123-123' }];
      }
      return [{ name: 'lambda2', uuid: '222-222-222' }];
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getLambdasByNames([
      'lambda1',
      'lambda2',
    ]);

    expect(response).toEqual([
      { name: 'lambda1', uuid: '123-123-123' },
      { name: 'lambda2', uuid: '222-222-222' },
    ]);
  });

  it('should throw an error during get lambdas by names', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn((url) => {
      if (url.includes('lambda1')) {
        return [{ name: 'lambda1', uuid: '123-123-123' }];
      }
      return [];
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });

    try {
      await faasService.getLambdasByNames(['lambda1', 'lambda2']);
    } catch (error) {
      expect(error.message).toEqual(
        expect.stringMatching(
          /Function lambda2 were not found on the platform/,
        ),
      );
    }
  });

  it("should get lambdas by name and the ones which doens't exists on the platform", async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn((url) => {
      if (url.includes('lambda1')) {
        return [{ name: 'lambda1', uuid: '123-123-123' }];
      }
      return [];
    }) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getLambdasByNames(
      ['lambda1', 'lambda2'],
      true,
    );

    expect(response).toEqual([
      { name: 'lambda1', uuid: '123-123-123' },
      { name: 'lambda2' },
    ]);
  });

  it('should get the runtime', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => [
      {
        name: 'Node.js',
        uuid: '943f44ad-2a06-4895-9a8a-3a44d29a0c79',
        baseImageName: 'test-image',
      },
    ]) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getRuntime();

    expect(response).toEqual({
      name: 'Node.js',
      uuid: '943f44ad-2a06-4895-9a8a-3a44d29a0c79',
      baseImageName: 'test-image',
    });
  });

  it('should get all events', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => ['Event', 'Event']) as any;
    const faasService = new FaasService({ gotDefault, csdsClient });
    const response = await faasService.getEvents();

    expect(response).toEqual(['Event', 'Event']);
  });

  it('should get Account Statistic', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn(async () => 'faasUi');
    // eslint-disable-next-line consistent-return
    const gotDefault = jest.fn(async (url) => {
      if (url.includes('/reports/limitCounts')) {
        return { value1: 1 };
      }
      if (url.includes('/reports/lambdaCounts')) {
        return { value2: 2 };
      }
      if (url.includes('/reports/invocationCounts')) {
        return { value3: 3 };
      }
    }) as any;
    const loginController = new LoginController();
    loginController.getLoginInformation = jest.fn(async () => {
      return {
        token: 'token',
        userId: 'userId',
        username: 'username',
        accountId: 'accountId',
      };
    });
    const faasService = new FaasService({
      gotDefault,
      csdsClient,
      loginController,
    });
    await faasService.setup();
    const response = await faasService.getAccountStatistic();

    expect(response).toEqual({ value1: 1, value2: 2, value3: 3 });
  });

  it('should throw an error while pushing lambda', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn(async () => 'faasUi');
    // eslint-disable-next-line consistent-return
    const gotDefault = jest.fn(async () => {
      throw {
        response: {
          body: {
            errorMsg: 'Error during invoking lambda',
            errorCode: 'com.liveperson.error.lambdaInvoke',
            errorLogs: 'error logs during push',
          },
        },
      };
    }) as any;
    const loginController = new LoginController();
    loginController.getLoginInformation = jest.fn(async () => {
      return {
        token: 'token',
        userId: 'userId',
        username: 'username',
        accountId: 'accountId',
      };
    });
    const faasService = new FaasService({
      gotDefault,
      csdsClient,
      loginController,
    });
    await faasService.setup();
    const body = {} as any;
    try {
      await faasService.push({ method: 'POST', body });
    } catch (error) {
      expect(error.message).toEqual('Error during invoking lambda');
    }
  });

  it('should throw an error with unauthorized', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn().mockReturnValue('faasUI');
    const gotDefault = jest.fn(() => {
      throw new Error('401 (Unauthorized)');
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
});
