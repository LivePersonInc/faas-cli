import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { system } from 'systeminformation';
import * as crypto from 'crypto';
import { ErrorCodes } from '../errors/errorCodes';
import { InternalError } from '../errors/internalError';
import { httpClient } from '../http-client/httpClient';
import { Environment } from '../shared/const';
import { ICsdsClient } from './ICsdsClient';

interface IServiceDomainTuple {
  service: string;
  baseURI: string;
}

/**
 * CSDS client that internally uses the Toolbelt.HTTPClient because it has the right proxy settings.
 */
export class CsdsClient implements ICsdsClient {
  private domains: IServiceDomainTuple[];

  /**
   * @param ttlInSeconds TTL of the domains cache in seconds
   */
  constructor(
    private ttlInSeconds: number = 600,
    private accountId: string | undefined = undefined,
    private lastCacheTimestamp: number = 0,
  ) {
    this.domains = [];
  }

  /**
   * Get the host for a CSDS service name.
   * The CsdsClient will get all hosts for the account and cache them as configured in ttInSeconds (see constructor).
   * @param service
   */
  public async get(service: string): Promise<string> {
    const domains = await this.getCachedDomains();

    const domain = domains.find(({ service: s }) => s === service);

    if (domain) {
      return domain.baseURI;
    }

    throw new InternalError(
      ErrorCodes.Csds.NotFound,
      `Service "${service}" could not be found.`,
    );
  }

  private async getCachedDomains(): Promise<IServiceDomainTuple[]> {
    if (!this.accountId) {
      this.accountId = await getAccountId();
    }

    if (!this.isCacheExpired()) {
      return this.domains;
    }

    try {
      const { baseURIs } = await httpClient(this.getUrl(), {
        json: true,
      });

      if (baseURIs && baseURIs.length !== 0) {
        this.lastCacheTimestamp = Date.now();
        this.domains = baseURIs;

        return baseURIs as IServiceDomainTuple[];
      }

      return [];
    } catch (error) {
      throw new InternalError(ErrorCodes.Csds.Failure, error.message);
    }
  }

  private isCacheExpired(): boolean {
    return Date.now() > this.lastCacheTimestamp + this.ttlInSeconds * 1000;
  }

  private getUrl(): string {
    return `http://${this.getCsdsDomain()}/api/account/${
      this.accountId
    }/service/baseURI.json?version=1.0`;
  }

  private getCsdsDomain(): string {
    return process.env.CSDS_DOMAIN
      ? process.env.CSDS_DOMAIN
      : this.deriveCsdsDomainFromAccountId();
  }

  private deriveCsdsDomainFromAccountId(): string {
    if (this.accountId?.startsWith('le') || this.accountId?.startsWith('qa')) {
      return 'lp-csds-qa.dev.lprnd.net';
    }
    if (this.accountId?.startsWith('fr')) {
      return 'adminlogin-z0-intg.liveperson.net';
    }
    return 'api.liveperson.net';
  }
}

async function getAccountId() {
  try {
    if (process.env[Environment.General.Account]) {
      return process.env[Environment.General.Account];
    }
    const tempFile = JSON.parse(
      fs.readFileSync(join(os.tmpdir(), 'faas-tmp.json'), 'utf8'),
    );
    const decryptedTempfile = await decrypt(tempFile);
    return Object.keys(decryptedTempfile).find(
      (e) => decryptedTempfile[`${e}`].active,
    );
  } catch (error) {
    console.log(error);
    throw new Error(`For local usage of the CSDS Client an accountId is required.
      Please login or set the env variable BRAND_ID`);
  }
}

async function getCrpytoConfig(): Promise<{
  algorithm: string;
  key: Buffer;
  iv: string;
}> {
  let systemUUID: string;
  try {
    const { uuid } = await system();
    systemUUID = uuid;
  } catch {
    systemUUID = '01:02:03:04:05:06';
  }

  return {
    algorithm: 'aes256',
    key: crypto.scryptSync(systemUUID, 'faas-cli', 32),
    iv: 'faas-cli-vectors',
  };
}

async function decrypt(data: any) {
  const { algorithm, key, iv } = await getCrpytoConfig();
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}
