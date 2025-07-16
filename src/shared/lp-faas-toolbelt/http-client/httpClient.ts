import * as HTTP from 'request-promise-native';
import { GenerateHeaders } from '../shared/headers-gen';

interface HttpClientConfig {
  fs?: any;
  http?: HTTP.RequestPromiseAPI;
}

export class HttpClient {
  private http: HTTP.RequestPromiseAPI;
  constructor({ http = HTTP }: HttpClientConfig = {}) {
    this.http = http;
  }

  public async request(param1: any, param2?: any): Promise<any> {
    const url =
      typeof param1 === 'string'
        ? param1
        : param1.uri
        ? param1.uri
        : param1.url;
    return this.http({
      uri: url,
      rejectUnauthorized: false, // Currently there are issues with the HTTPS Cert
      headers: GenerateHeaders(),
      agentOptions: {
        secureProtocol: 'TLSv1_2_method',
      },
      ...(param2 && { ...param2 }),
      ...(typeof param1 === 'object' && { ...param1 }),
    });
  }
}

export const httpClient = (params1: any, params2?: any) => {
  const client = new HttpClient();
  return client.request(params1, params2);
};
