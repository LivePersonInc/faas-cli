import type { ICsdsClient } from './ICsdsClient.js';

import { ErrorCodes } from '../errors/errorCodes.js';
import { makeSpecificError } from '../errors/toolbeltError.js';
import { isCsdsServiceResponse, isError } from '../shared/typesPredicates.js';
import { WellKnownLPServices } from '../lp-client/lpServices.js';

const newCSDSError = makeSpecificError('CSDS-Client');

export class CsdsClient implements ICsdsClient {
    private domains: Record<string, string>[] = [];

    /**
     * @param ttlInSeconds TTL of the domains cache in seconds
     */
    constructor(
        private ttlInSeconds = 600,
        private accountId = process.env.X_LIVEPERSON_BRAND_ID,
        private lastCacheTimestamp = 0,
        private httpClient = fetch,
    ) {}
    public async get(service: WellKnownLPServices | string): Promise<string> {
        const domains = await this.getCachedDomains();

        const domain = domains.find((record) => service in record);

        if (domain === undefined) {
            throw newCSDSError(ErrorCodes.Csds.NotFound, `Service "${service}" could not be found.`);
        }

        return domain[service];
    }
    public async getAll(): Promise<Record<string, string>[]> {
        return await this.getCachedDomains();
    }

    private async getCachedDomains(): Promise<Record<string, string>[]> {
        if (!this.isCacheExpired()) {
            return this.domains;
        }

        try {
            const response = await this.httpClient(this.getUrl());

            const responseJSON = (await response.json()) as unknown;

            if (!isCsdsServiceResponse(responseJSON)) {
                throw new Error(`Status Code: ${response.status}. Response body ${JSON.stringify(responseJSON)}`);
            }

            this.lastCacheTimestamp = Date.now();
            this.domains = responseJSON.baseURIs.map((entry) => {
                const domain: Record<string, string> = {};
                domain[entry.service] = entry.baseURI;
                return domain;
            });

            return this.domains;
        } catch (error) {
            throw newCSDSError(ErrorCodes.Csds.Failure, `${isError(error) ? error.message : 'unknown error'}`);
        }
    }

    private isCacheExpired(): boolean {
        return Date.now() > this.lastCacheTimestamp + this.ttlInSeconds * 1000;
    }

    private getUrl(): string {
        return `https://${this.getCsdsDomain()}/api/account/${this.accountId}/service/baseURI.json?version=1.0`;
    }

    private getCsdsDomain(): string {
        return process.env.X_LIVEPERSON_CSDS_DOMAIN || 'csds-app.qa.int.gw.lpcloud.io';
    }
}
