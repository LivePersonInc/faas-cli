import got, { Got } from 'got';
import { CsdsClient } from './csds.service';

export interface ILoginResponse {
  bearer: string;
  csrf: string;
  sessionId: string;
  config: {
    userId: string;
    loginName: string;
  };
}

interface ILoginServiceConfig {
  csdsClient?: CsdsClient;
  gotDefault?: Got;
}

export class LoginService {
  private readonly csdsClient: CsdsClient;

  private readonly got: Got;

  constructor({
    csdsClient = new CsdsClient(),
    gotDefault = got,
  }: ILoginServiceConfig = {}) {
    this.csdsClient = csdsClient;
    this.got = gotDefault;
  }

  /**
   * Checks if the token is still valid
   * @param { token, accountId, userId }
   * @returns {Promise<boolean>}
   * @memberof LoginService
   */
  public async isTokenValid({
    csrf,
    accountId,
    sessionId,
  }: {
    csrf: string;
    accountId: string;
    sessionId: string;
  }): Promise<boolean> {
    try {
      const domain = await this.csdsClient.getUri(accountId, 'agentVep');
      const url = `https://${domain}/api/account/${accountId}/refresh`;

      await this.got(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Cookie: `session_id=${sessionId}`,
        },
        json: { csrf },
      });
      return true;
    } catch (error) {
      if (error.message.includes('401')) {
        return false;
      }
      throw new Error(error);
    }
  }

  /**
   * Performs the login to the agentVep service
   * @param { accountId, username, password }
   * @returns {Promise<ILoginResponse>} - bearer, username and userId
   * @memberof LoginService
   */
  public async login({
    accountId,
    username,
    password,
  }: {
    accountId: string;
    username: string;
    password: string;
  }): Promise<ILoginResponse> {
    try {
      const domain = await this.csdsClient.getUri(accountId, 'agentVep');
      const url = `https://${domain}/api/account/${accountId}/login?v=1.3`;

      return await this.got(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'user-agent': 'faas-cli',
        },
        responseType: 'json',
        resolveBodyOnly: true,
        body: JSON.stringify({
          username,
          password,
        }),
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}
