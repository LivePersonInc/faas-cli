import * as HTTP from 'dropin-request';
import { join } from 'path';
import { GenerateHeaders } from '../shared/headers-gen';
import * as fsDefault from 'fs-extra';
import { parse } from 'url';

interface HttpClientConfig {
  fs?: any;
  http?: HTTP.RequestPromiseAPI;
}

const defaultUrls = [
  'adminlogin.liveperson.net',
  'ams-a.liveperson.net',
  'api.liveperson.net',
  '*.ac.liveperson.net',
  '*.acr.liveperson.net',
  '*.agentvep.liveperson.net',
  '*.data-mng.liveperson.net',
  '*.enghist.liveperson.net',
  '*.lp-msgewt.liveperson.net',
  '*.msghist.liveperson.net',
  '*.push.liveperson.net',
  '*.v.liveperson.net',
  '*.msg.liveperson.net',
  '*.objectstorage.liveperson.net',
];

export class HttpClient {
  private fs: any;
  private http: HTTP.RequestPromiseAPI;
  constructor({ fs = fsDefault, http = HTTP }: HttpClientConfig = {}) {
    this.fs = fs;
    this.http = http;
  }

  public async request(param1: any, param2?: any): Promise<any> {
    const url = typeof param1 === 'string' ? param1 : param1.uri ? param1.uri : param1.url;
    if (!this.checkWhitelisting(url)) {
      return new Promise((resolve) => {
        resolve({
          statusCode: 403,
          body: 'You do not have access to the page or resource you are trying to reach\n',
        });
      });
    }
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

  private checkWhitelisting(uri: string) {
    try {
      const settings: any = JSON.parse(this.fs.readFileSync(join(process.cwd(), 'functions', 'settings.json'), 'utf8'));
      const whitelist: string[] = [...settings.whitelist, ...defaultUrls];
      const hostname = parse(uri).hostname;

      if (hostname && whitelist.includes(hostname)) {
        return true;
      } else if (hostname) {
        const splittedUrl = hostname.split('.');
        const basedUrl = splittedUrl.slice(Math.max(splittedUrl.length - 2, 0)) as string[];
        const testUrl = `*.${basedUrl[0]}.${basedUrl[1]}`;
        return whitelist.includes(testUrl);
      } else {
        return false;
      }
    } catch (err) {
      throw new Error('Please make sure you have set up a settings.json');
    }
  }
}

export const httpClient = (params1: any, params2?: any) => {
  const client = new HttpClient();
  return client.request(params1, params2);
};
