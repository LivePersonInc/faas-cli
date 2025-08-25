/* eslint-disable @typescript-eslint/require-await */
import { Namespace, NamespaceOptions } from '../types/namespace';
import { Entity } from '../types/entity';
import { DEFAULT_ENTITIY, TEN_SECONDS, CALL_DELAY } from '../util/constants';
import {
  isNotFoundError,
  isNetworkError,
  isRetriableError,
} from '../util/predicates';
import { RestError } from '../types/errors/restError';
import { runTaskWithDeadline } from '../util/helper';
import { NetworkError } from '../types/errors/networkError';

export interface IRestClient {
  createNamespace(
    accountId: string,
    namespace: string,
    options: NamespaceOptions,
  ): Promise<Namespace>;
  deleteNamespace(accountId: string, namespace: string): Promise<void>;
  getListOfNamespaces(accountId: string): Promise<Namespace[]>;
  setOrUpdatePropertiesInNamespace(
    accountId: string,
    namespace: string,
    properties: Entity,
    sessionId?: string,
  ): Promise<Entity>;
  getAllPropertiesInSession(
    accountId: string,
    namespace: string,
    sessionId?: string,
  ): Promise<Entity>;
  getSelectedPropertiesInSession(
    accountId: string,
    namespace: string,
    propertyNames: string[],
    sessionId?: string,
  ): Promise<Entity>;
  getPropertyInSession(
    accountId: string,
    namespace: string,
    propertyName: string,
    sessionId?: string,
  ): Promise<unknown>;
  deletePropertyInSession(
    accountId: string,
    namespace: string,
    propertyName: string,
    sessionId?: string,
  ): Promise<void>;
  deleteSession(
    accountId: string,
    namespace: string,
    sessionId: string,
  ): Promise<void>;
  getListOfSessions(accountId: string, namespace: string): Promise<string[]>;
}

type Options = {
  contentType: 'buffer' | 'string' | 'json';
  acceptedStatusCodes: number[];
  timeout: number;
};

export class RestClient implements IRestClient {
  private readonly protocol: string;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {
    if (baseUrl.startsWith('http')) {
      this.baseUrl = baseUrl.replace('http://', '');
      this.protocol = 'http';
    } else {
      this.protocol = 'https';
    }
  }

  // ------------------------
  // public API methods
  // ------------------------

  public async createNamespace(
    accountId: string,
    namespace: string,
    options: NamespaceOptions,
  ): Promise<Namespace> {
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

  public async deleteNamespace(
    accountId: string,
    namespace: string,
  ): Promise<void> {
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
      const namespaces = (await this.performRequestWithDeadline(
        'GET',
        url,
        undefined,
        {
          acceptedStatusCodes: [200],
          contentType: 'json',
          timeout: TEN_SECONDS,
        },
      )) as Array<{ [name: string]: unknown }>;

      return namespaces.map(
        (current) =>
          ({
            name: current?.name as string,
            createdAt: new Date(current?.createdAt as string),
            ...(current?.ttlSecond && { ttlSecond: current?.ttlSecond }),
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

      return await this.getAllPropertiesInSession(
        accountId,
        namespace,
        sessionId,
      );
    } catch (error) {
      throw await this.transform(error);
    }
  }

  public async getAllPropertiesInSession(
    accountId: string,
    namespace: string,
    sessionId: string = DEFAULT_ENTITIY,
  ): Promise<Entity> {
    try {
      const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}/${namespace}/${sessionId}/properties`;
      const entity = await this.performRequestWithDeadline(
        'GET',
        url,
        undefined,
        {
          acceptedStatusCodes: [200],
          contentType: 'json',
          timeout: TEN_SECONDS,
        },
      );

      return entity as Entity;
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
    for (const property of propertyNames) {
      try {
        outEntity[property] = await this.getPropertyInSession(
          accountId,
          namespace,
          property,
          sessionId,
        );
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
      const value = await this.performRequestWithDeadline(
        'GET',
        url,
        undefined,
        {
          acceptedStatusCodes: [200],
          contentType: 'string',
          timeout: TEN_SECONDS,
        },
      );

      try {
        return JSON.parse(value as string);
      } catch {
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

  public async deleteSession(
    accountId: string,
    namespace: string,
    sessionId: string,
  ): Promise<void> {
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

  public async getListOfSessions(
    accountId: string,
    namespace: string,
  ): Promise<string[]> {
    try {
      const url = `${this.protocol}://${this.baseUrl}/v1/account/${accountId}/${namespace}/session-ids`;
      const entityList = await this.performRequestWithDeadline(
        'GET',
        url,
        undefined,
        {
          acceptedStatusCodes: [200],
          contentType: 'json',
          timeout: TEN_SECONDS,
        },
      );
      return entityList as string[];
    } catch (error) {
      throw await this.transform(error);
    }
  }

  // ------------------------
  // internal helpers
  // ------------------------

  private async performRequestWithDeadline(
    method: string,
    url: string,
    body: unknown = undefined,
    options: Options,
  ): Promise<unknown> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await runTaskWithDeadline(
          this.fetchWithHandling(method, url, body, options),
          options.timeout,
        );
      } catch (error) {
        if (!isRetriableError(error)) throw error;
        if (attempt >= 2) throw error;
        await new Promise((r) => setTimeout(r, (attempt + 1) * CALL_DELAY));
      }
    }
    return null;
  }

  private async fetchWithHandling(
    method: string,
    url: string,
    body: unknown,
    options: Options,
  ): Promise<unknown> {
    const response = await fetch(url, {
      method,
      headers: this.generateHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!options.acceptedStatusCodes.includes(response.status)) {
      const error: any = new Error(
        `Unexpected status code: ${response.status}`,
      );
      error.statusCode = response.status;
      error.message = await response.text().catch(() => response.statusText);
      error.json = async () => {
        try {
          return JSON.parse(error.message);
        } catch {
          return { message: error.message };
        }
      };
      throw error;
    }

    switch (options.contentType) {
      case 'json':
        return response.json();
      case 'string':
        return response.text();
      case 'buffer':
        return response.arrayBuffer();
      default:
        return null;
    }
  }

  private generateHeaders(): { [name: string]: string } {
    const name = '@liveperson/context-service';
    const version = '0.1.0';

    return {
      'maven-api-key': this.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-REQUEST-ID': crypto.randomUUID(),
      'User-Agent': `${name} v${version}`,
    };
  }

  private async transform(error: { [name: string]: any }): Promise<Error> {
    if (isNetworkError(error)) {
      return new NetworkError(error.code || error.errno, error.message);
    }
    if (typeof error?.json === 'function') {
      try {
        const { message } = await error.json();
        return new RestError(error?.statusCode || -1, message);
      } catch {
        return new RestError(error?.statusCode || -1, error.message);
      }
    }
    return new RestError(error?.statusCode || -1, error.message);
  }
}
