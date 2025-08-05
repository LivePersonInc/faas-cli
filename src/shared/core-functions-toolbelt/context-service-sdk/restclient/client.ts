/* eslint-disable @typescript-eslint/require-await */
import * as bent from 'bent';
import { v4 as GenerateUUID } from 'uuid';

import { Namespace, NamespaceOptions } from '../types/namespace';
import { Entity } from '../types/entity';
import { DEFAULT_ENTITIY, TEN_SECONDS, CALL_DELAY } from '../util/constants';
import { isNotFoundError, isNetworkError, isRetriableError } from '../util/predicates';
import { RestError } from '../types/errors/restError';
import { runTaskWithDeadline } from '../util/helper';
import { NetworkError } from '../types/errors/networkError';

export interface IRestClient {
    /**
     * Creates a new namespace with the specified name under the provided account.
     * Given the namespace exists it will not recreate it or throw an error.
     * @param accountId
     * @param namespace
     *
     * @throws RestError when returned status code is not successful or unexpected issue occurred
     */
    createNamespace(accountId: string, namespace: string, options: NamespaceOptions): Promise<Namespace>;
    /**
     * Delete the specified namespace including all of the entities included in it.
     * Given the namespace did not exist it will throw no error.
     * @param accountId
     * @param namespace
     *
     * @throws RestError when returned status code is not successful or unexpected issue occurred
     */
    deleteNamespace(accountId: string, namespace: string): Promise<void>;
    /**
     * Returns a list of all custom namespaces created for the specified account.
     * Please be aware built in namespaces are not included e.g. `faas`
     * @param accountId
     *
     * @throws RestError when returned status code is not successful or unexpected issue occurred
     */
    getListOfNamespaces(accountId: string): Promise<Namespace[]>;
    /**
     * Will create or update properties in specified session. If a key is omitted
     * it will not cause the deletion of a property, for this leverage the delete
     * method directly.
     * @param accountId
     * @param namespace
     * @param properties
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws RestError when returned status code is not successful or unexpected issue occurred
     */
    setOrUpdatePropertiesInNamespace(accountId: string, namespace: string, properties: Entity, sessionId?: string): Promise<Entity>;
    /**
     * Returns the specified session with all of its properties. If session
     * does not exist it will return an empty object
     * @param accountId
     * @param namespace
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws RestError when returned status code is not successful or unexpected issue occurred
     */
    getAllPropertiesInSession(accountId: string, namespace: string, sessionId?: string): Promise<Entity>;
    /**
     * Returns only the specified properties from the specified session.
     * @param accountId
     * @param namespace
     * @param propertyNames that should be looked up
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws RestError when returned status code is not successful or unexpected issue occurred
     */
    getSelectedPropertiesInSession(accountId: string, namespace: string, propertyNames: string[], sessionId?: string): Promise<Entity>;
    /**
     * Gets the value of the specified propertyName.
     * @param accountId
     * @param namespace
     * @param propertyName
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws RestError when returned status code is not successful or unexpected issue occurred
     */
    getPropertyInSession(accountId: string, namespace: string, propertyName: string, sessionId?: string): Promise<unknown>;
    /**
     * Deletes the specified property from the specified session.
     * Will not throw an error if deleting an non existing property.
     * @param accountId
     * @param namespace
     * @param propertyName
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws RestError when returned status code is not successful or unexpected issue occurred
     */
    deletePropertyInSession(accountId: string, namespace: string, propertyName: string, sessionId?: string): Promise<void>;
    /**
     * Deletes the specified session along with all it properties.
     * Will not throw an error if deleting an non existing session.
     * @param accountId
     * @param namespace
     * @param sessionId
     *
     * @throws RestError when returned status code is not successful or unexpected issue occurred
     */
    deleteSession(accountId: string, namespace: string, sessionId: string): Promise<void>;
    /**
     * Returns a list of all entities within the specified namespace. Please be aware this includes
     * also the default session __default__
     * @param accountId
     * @param namespace
     *
     * @throws RestError when returned status code is not successful or unexpected issue occurred
     */
    getListOfSessions(accountId: string, namespace: string): Promise<string[]>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
type Options = {
    contentType: 'buffer' | 'string' | 'json';
    acceptedStatusCodes: number[];
    timeout: number;
};

export class RestClient implements IRestClient {
    private readonly protocol: string;
    constructor(private readonly baseUrl: string, private readonly apiKey: string) {
        // This allows us to use the http protocol for QA
        if (baseUrl.startsWith('http')) {
            this.baseUrl = baseUrl.replace('http://', '');
            this.protocol = 'http';
        } else {
            this.protocol = 'https';
        }
    }

    public async createNamespace(accountId: string, namespace: string, options: NamespaceOptions): Promise<Namespace> {
        try {
            const query = options.ttl ? `?ttlSecond=${options.ttl}` : '';

            const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}${query}`;
            const body = { name: namespace };
            await this.performRequestWithDeadline('POST', url, body, {
                acceptedStatusCodes: [204],
                contentType: 'buffer',
                timeout: TEN_SECONDS,
            });

            const namespaces = await this.getListOfNamespaces(accountId);
            return namespaces.find((current) => current.name === namespace);
        } catch (error) {
            throw await this.transform(error);
        }
    }
    public async deleteNamespace(accountId: string, namespace: string): Promise<void> {
        try {
            const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}/${namespace}`;
            await this.performRequestWithDeadline('DELETE', url, undefined, {
                acceptedStatusCodes: [204],
                contentType: 'buffer',
                timeout: TEN_SECONDS,
            });
        } catch (error) {
            throw await this.transform(error);
        }
    }
    public async getListOfNamespaces(accountId: string): Promise<Namespace[]> {
        try {
            const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}`;
            const namespaces = (await this.performRequestWithDeadline('GET', url, undefined, {
                acceptedStatusCodes: [200],
                contentType: 'json',
                timeout: TEN_SECONDS,
            })) as Array<{ [name: string]: unknown }>;

            return namespaces.map(
                (current) =>
                    ({
                        name: current?.name as string,
                        createdAt: new Date(current?.createdAt as string),
                        ...(current?.ttlSecond && { ttlSecond: current?.ttlSecond }), // Will add property if present
                    } as Namespace),
            );
        } catch (error) {
            throw await this.transform(error);
        }
    }
    public async setOrUpdatePropertiesInNamespace(
        accountId: string,
        namespace: string,
        properties: Entity,
        sessionId: string = DEFAULT_ENTITIY,
    ): Promise<Entity> {
        try {
            const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}/${namespace}/${sessionId}/properties`;
            await this.performRequestWithDeadline('PATCH', url, properties, {
                acceptedStatusCodes: [204],
                contentType: 'buffer',
                timeout: TEN_SECONDS,
            });

            return await this.getAllPropertiesInSession(accountId, namespace, sessionId);
        } catch (error) {
            throw await this.transform(error);
        }
    }
    public async getAllPropertiesInSession(accountId: string, namespace: string, sessionId: string = DEFAULT_ENTITIY): Promise<Entity> {
        try {
            const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}/${namespace}/${sessionId}/properties`;
            const entitiy = await this.performRequestWithDeadline('GET', url, undefined, {
                acceptedStatusCodes: [200],
                contentType: 'json',
                timeout: TEN_SECONDS,
            });

            return entitiy as Entity;
        } catch (error) {
            throw await this.transform(error);
        }
    }
    public async getSelectedPropertiesInSession(
        accountId: string,
        namespace: string,
        propertyNames: string[],
        sessionId: string = DEFAULT_ENTITIY,
    ): Promise<Entity> {
        const outEntity = {};

        // TODO: Maybe need to parallize requests to increase speed
        for (const property of propertyNames) {
            try {
                outEntity[property] = await this.getPropertyInSession(accountId, namespace, property, sessionId);
            } catch (error) {
                if (!isNotFoundError(error)) {
                    throw error;
                }
            }
        }

        return outEntity;
    }
    public async getPropertyInSession(
        accountId: string,
        namespace: string,
        propertyName: string,
        sessionId: string = DEFAULT_ENTITIY,
    ): Promise<unknown> {
        try {
            const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}/${namespace}/${sessionId}/properties/${propertyName}`;
            const value = await this.performRequestWithDeadline('GET', url, undefined, {
                acceptedStatusCodes: [200],
                contentType: 'string',
                timeout: TEN_SECONDS,
            });

            try {
                return JSON.parse(value as string) as unknown;
            } catch (error) {
                return value;
            }
        } catch (error) {
            throw await this.transform(error);
        }
    }
    public async deletePropertyInSession(
        accountId: string,
        namespace: string,
        propertyName: string,
        sessionId: string = DEFAULT_ENTITIY,
    ): Promise<void> {
        try {
            const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}/${namespace}/${sessionId}/properties/${propertyName}`;
            await this.performRequestWithDeadline('DELETE', url, undefined, {
                acceptedStatusCodes: [204],
                contentType: 'buffer',
                timeout: TEN_SECONDS,
            });
        } catch (error) {
            throw await this.transform(error);
        }
    }
    public async deleteSession(accountId: string, namespace: string, sessionId: string): Promise<void> {
        try {
            const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}/${namespace}/${sessionId}/properties/`;
            await this.performRequestWithDeadline('DELETE', url, undefined, {
                acceptedStatusCodes: [204],
                contentType: 'buffer',
                timeout: TEN_SECONDS,
            });
        } catch (error) {
            throw await this.transform(error);
        }
    }
    public async getListOfSessions(accountId: string, namespace: string): Promise<string[]> {
        try {
            const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}/${namespace}/session-ids`;
            const entityList = await this.performRequestWithDeadline('GET', url, undefined, {
                acceptedStatusCodes: [200],
                contentType: 'json',
                timeout: TEN_SECONDS,
            });

            return entityList as string[];
        } catch (error) {
            throw await this.transform(error);
        }
    }

    private async performRequestWithDeadline(
        method: string,
        url: string,
        body: unknown = undefined,
        options: Options,
    ): Promise<bent.ValidResponse> {
        const request = bent(method, options.contentType, ...options.acceptedStatusCodes);

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                return await runTaskWithDeadline(request(url, body, this.generateHeaders()), options.timeout);
            } catch (error) {
                if (!isRetriableError(error)) {
                    throw error;
                }

                if (attempt >= 2) {
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * CALL_DELAY));
            }
        }

        // This is here because otherwise Typescript complains, but should never reach here
        return null;
    }

    /**
     * Helper Method returning an object containing all relevant headers.
     */
    private generateHeaders(): { [name: string]: string } {
        // Try to keep then in sync with package.json
        const name = '@liveperson/context-service';
        const version = '0.1.0';

        return {
            'maven-api-key': this.apiKey,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Accept: 'application/json',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'X-REQUEST-ID': GenerateUUID(),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'User-Agent': `${name} v${version}`,
        };
    }
    /**
     * This method takes an error returned by the bent library and turn it into
     * either an RestError or a NetworkError
     * @param error object from bent
     */
    private async transform(error: { [name: string]: unknown }): Promise<Error> {
        if (isNetworkError(error)) {
            return new NetworkError((error.code || error.errno) as string, error.message as string);
        }

        if (typeof error?.json === 'function') {
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const { message } = await error.json();
                return new RestError((error?.statusCode as number) || -1, message);
            } catch (_) {
                return new RestError((error?.statusCode as number) || -1, error.message as string);
            }
        }

        return new RestError((error?.statusCode as number) || -1, error.message as string);
    }
}
