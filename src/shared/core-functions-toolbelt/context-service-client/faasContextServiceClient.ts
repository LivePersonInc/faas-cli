/* eslint-disable @typescript-eslint/ban-ts-comment */
import { CsdsClient } from '../csds-client/csdsClient.js';
import type { IFaaSContextServiceClient } from './IFaaSContextServiceClient.js';
import type {
  NamespaceOptions,
  Namespace,
  Entity,
  IContextServiceClient,
  ContextServiceClient,
} from '@liveperson/context-service';

export type ContextSessionServiceClientFactory = (
  url: string,
  apiKey: string,
) => ContextServiceClient;
export class FaasContextServiceClient implements IFaaSContextServiceClient {
  private contextServiceClient!: IContextServiceClient;
  constructor(
    private contextServiceFactory: ContextSessionServiceClientFactory,
    private csdsClient: CsdsClient,
    private apiKey: string,

    private accountId = process.env.X_LIVEPERSON_BRAND_ID,
  ) {}

  private async initializeClient(): Promise<void> {
    const baseUrl = await this.csdsClient.get('mavenContext');
    this.contextServiceClient = this.contextServiceFactory(
      baseUrl,
      this.apiKey,
    );
  }

  public async createNamespace(
    namespace: string,
    options?: NamespaceOptions,
  ): Promise<Namespace> {
    await this.initializeClient();
    // @ts-ignore
    return this.contextServiceClient.createNamespace(
      this.accountId,
      namespace,
      options,
    );
  }

  public async deleteNamespace(namespace: string): Promise<void> {
    await this.initializeClient();
    // @ts-ignore
    return this.contextServiceClient.deleteNamespace(this.accountId, namespace);
  }

  public async getListOfNamespaces(): Promise<Namespace[]> {
    await this.initializeClient();
    // @ts-ignore
    return this.contextServiceClient.getListOfNamespaces(this.accountId);
  }

  public async setPropertiesInNamespace(
    namespace: string,
    properties: Entity,
    sessionId?: string,
  ): Promise<Entity> {
    await this.initializeClient();
    // @ts-ignore
    return this.contextServiceClient.setPropertiesInNamespace(
      this.accountId,
      namespace,
      properties,
      sessionId,
    );
  }

  public async updatePropertiesInNamespace(
    namespace: string,
    properties: Entity,
    sessionId?: string,
  ): Promise<Entity> {
    await this.initializeClient();
    // @ts-ignore
    return this.contextServiceClient.updatePropertiesInNamespace(
      this.accountId,
      namespace,
      properties,
      sessionId,
    );
  }

  public async getAllPropertiesInSession(
    namespace: string,
    sessionId?: string,
  ): Promise<Entity> {
    await this.initializeClient();
    // @ts-ignore
    return this.contextServiceClient.getAllPropertiesInSession(
      this.accountId,
      namespace,
      sessionId,
    );
  }

  public async getSelectedPropertiesInSession(
    namespace: string,
    propertyNames: string[],
    sessionId?: string,
  ): Promise<Entity> {
    await this.initializeClient();
    // @ts-ignores
    return this.contextServiceClient.getSelectedPropertiesInSession(
      this.accountId,
      namespace,
      propertyNames,
      sessionId,
    );
  }

  public async getPropertyInSession(
    namespace: string,
    propertyName: string,
    sessionId?: string,
  ): Promise<unknown> {
    await this.initializeClient();
    // @ts-ignore
    return this.contextServiceClient.getPropertyInSession(
      this.accountId,
      namespace,
      propertyName,
      sessionId,
    );
  }

  public async deletePropertyInSession(
    namespace: string,
    propertyName: string,
    sessionId?: string,
  ): Promise<void> {
    await this.initializeClient();
    // @ts-ignore
    return this.contextServiceClient.deletePropertyInSession(
      this.accountId,
      namespace,
      propertyName,
      sessionId,
    );
  }

  public async deleteSession(
    namespace: string,
    sessionId: string,
  ): Promise<void> {
    await this.initializeClient();
    // @ts-ignore
    return this.contextServiceClient.deleteSession(
      this.accountId,
      namespace,
      sessionId,
    );
  }

  public async getListOfSessions(namespace: string): Promise<string[]> {
    await this.initializeClient();
    // @ts-ignore
    return this.contextServiceClient.getListOfSessions(
      this.accountId,
      namespace,
    );
  }
}
