import { LoginService } from '../../src/service/login.service';
import { CsdsClient } from '../../src/service/csds.service';

describe('login service', () => {
  it('should check if token is valid (true)', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn(async () => 'exampe url');

    const gotDefault = jest.fn().mockReturnValue(true) as any;

    const loginService = new LoginService({ csdsClient, gotDefault });

    const result = await loginService.isTokenValid({
      csrf: 'testToken',
      accountId: '123456789',
      sessionId: 'sessionId',
    });

    expect(result).toBeTruthy();
  });

  it('should check if token is valid (401)', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn(async () => 'exampe url');

    const gotDefault = jest.fn(async () => {
      throw new Error('401 Unauthorized');
    }) as any;

    const loginService = new LoginService({ csdsClient, gotDefault });

    const result = await loginService.isTokenValid({
      csrf: 'testToken',
      accountId: '123456789',
      sessionId: 'sessionId',
    });

    expect(result).toBeFalsy();
  });

  it('should check if token is valid (500)', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn(async () => 'exampe url');

    const gotDefault = jest.fn(async () => {
      throw new Error('500 Internal Error');
    }) as any;

    const loginService = new LoginService({ csdsClient, gotDefault });

    try {
      await loginService.isTokenValid({
        csrf: 'testToken',
        accountId: '123456789',
        sessionId: 'sessionId',
      });
    } catch (error) {
      expect(error.message).toBe('Error: 500 Internal Error');
    }
  });

  it('should perform the login request (success)', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn(async () => 'exampe url');

    const gotDefault = jest.fn(() => ({
      bearer: 'bearerToken',
      config: {
        userId: 'testId',
        loginName: 'testUser',
      },
    })) as any;

    const loginService = new LoginService({ csdsClient, gotDefault });

    const result = await loginService.login({
      accountId: '123456789',
      username: 'testUser',
      password: 'TestPW',
    });

    expect(result).toEqual({
      bearer: 'bearerToken',
      config: { loginName: 'testUser', userId: 'testId' },
    });
  });

  it('should perform the login request (error)', async () => {
    const csdsClient = new CsdsClient();
    csdsClient.getUri = jest.fn(async () => 'exampe url');

    const gotDefault = jest.fn(async () => {
      throw new Error('Error during login');
    }) as any;

    const loginService = new LoginService({ csdsClient, gotDefault });

    try {
      await loginService.login({
        accountId: '123456789',
        username: 'testUser',
        password: 'TestPW',
      });
    } catch (error) {
      expect(error.message).toBe('Error: Error during login');
    }
  });
});
