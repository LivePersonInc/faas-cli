import * as requestGot from 'got';

interface IServiceDomainTuple {
  service: string;
  baseURI: string;
}

export class CsdsClient {
  private readonly got: any;

  private ttlInSeconds: number;

  private lastCacheTimestamp: number;

  private domains: IServiceDomainTuple[];

  private accountId: string;

  constructor(got = requestGot) {
    this.got = got;
    this.ttlInSeconds = 600;
    this.lastCacheTimestamp = 0;
    this.domains = [];
    this.accountId = '';
  }

  /**
   * Returns the desired service domain based on the provided accountId
   * @param {string} accountId - accountId
   * @param {string} service - Desired service
   * @returns {Promise<string>} - csds domain
   * @memberof CsdsClient
   */
  public async getUri(accountId: string, service: string): Promise<string> {
    this.accountId = accountId;
    const domains = await this.getCachedDomains();

    const domain = domains.find(({ service: s }) => s === service);

    /* istanbul ignore else */
    if (domain) {
      return domain.baseURI;
    }

    throw new Error(`Service "${service}" could not be found.`);
  }

  private async getCachedDomains(): Promise<IServiceDomainTuple[]> {
    if (!this.isCacheExpired()) {
      return this.domains;
    }

    try {
      const { baseURIs } = await this.got(this.getUrl(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-agent': 'faas-cli',
        },
        responseType: 'json',
        resolveBodyOnly: true,
      });

      /* istanbul ignore else */
      if (baseURIs && baseURIs.length !== 0) {
        this.lastCacheTimestamp = Date.now();
        this.domains = baseURIs;

        return baseURIs as IServiceDomainTuple[];
      }

      return [];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  private isCacheExpired(): boolean {
    return Date.now() > this.lastCacheTimestamp + this.ttlInSeconds * 1000;
  }

  private getUrl(): string {
    return `https://${this.getCsdsDomain()}/api/account/${
      this.accountId
    }/service/baseURI.json?version=1.0`;
  }

  private getCsdsDomain(): string {
    if (this.accountId?.startsWith('le') || this.accountId?.startsWith('qa')) {
      return 'lp-csds-qa.dev.lprnd.net';
    }
    if (this.accountId?.startsWith('fr')) {
      return 'adminlogin-z0-intg.liveperson.net';
    }
    return 'api.liveperson.net';
  }
}
