import {
  NamespaceOptions,
  Namespace,
  Entity,
  ContextServiceClient,
  DOMAINS as CONTEXT_SERVICE_DOMAINS,
} from '../context-service-sdk/lib';
import { ISecretClient } from '../secret-storage/IsecretClient';
import { VaultSecretClient } from '../secret-storage/secretClient';
import {
  IFaaSContextServiceClientConfig,
  IFaaSContextServiceClient,
} from './IFaaSContextServiceClient';

export class FaasContextServiceClient implements IFaaSContextServiceClient {
  private contextServiceClient: ContextServiceClient | undefined;
  private baseUrl: string;
  private accountId: string;
  private apiKeySecretName?: string;
  private apiKey?: string;

  constructor(config: IFaaSContextServiceClientConfig) {
    const { apiKey, accountId } = config;
    this.accountId = accountId;
    // TODO: when a default secret is available for the context service,
    // enter the name here and make the apiKey param optional. Also adjust JSDOC in index.ts
    this.apiKeySecretName = undefined;
    this.baseUrl = getBaseUrl();
    this.apiKey = apiKey;
    this.contextServiceClient = undefined;
  }

  /* istanbul ignore next */
  private async initContextServiceClient() {
    if (!this.apiKey) {
      this.apiKey = await this.getApiKey(this.apiKeySecretName as string);
    }
    if (!this.contextServiceClient) {
      this.contextServiceClient = new ContextServiceClient(
        this.baseUrl,
        this.apiKey,
      );
    }
  }

  /* istanbul ignore next */
  private async getApiKey(secretName: string): Promise<string> {
    const secretClient: ISecretClient = new VaultSecretClient();
    const { value } = await secretClient.readSecret(secretName);
    return value;
  }

  /* istanbul ignore next */
  public async createNamespace(
    namespace: string,
    options?: NamespaceOptions,
  ): Promise<Namespace> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.createNamespace(
      this.accountId,
      namespace,
      options,
    );
  }

  /* istanbul ignore next */
  public async deleteNamespace(namespace: string): Promise<void> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.deleteNamespace(
      this.accountId,
      namespace,
    );
  }

  /* istanbul ignore next */
  public async getListOfNamespaces(): Promise<Namespace[]> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.getListOfNamespaces(this.accountId);
  }

  /* istanbul ignore next */
  public async setPropertiesInNamespace(
    namespace: string,
    properties: Entity,
    sessionId?: string,
  ): Promise<Entity> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.setPropertiesInNamespace(
      this.accountId,
      namespace,
      properties,
      sessionId,
    );
  }

  /* istanbul ignore next */
  public async updatePropertiesInNamespace(
    namespace: string,
    properties: Entity,
    sessionId?: string,
  ): Promise<Entity> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.updatePropertiesInNamespace(
      this.accountId,
      namespace,
      properties,
      sessionId,
    );
  }

  /* istanbul ignore next */
  public async getAllPropertiesInSession(
    namespace: string,
    sessionId?: string,
  ): Promise<Entity> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.getAllPropertiesInSession(
      this.accountId,
      namespace,
      sessionId,
    );
  }

  /* istanbul ignore next */
  public async getSelectedPropertiesInSession(
    namespace: string,
    propertyNames: string[],
    sessionId?: string,
  ): Promise<Entity> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.getSelectedPropertiesInSession(
      this.accountId,
      namespace,
      propertyNames,
      sessionId,
    );
  }

  /* istanbul ignore next */
  public async getPropertyInSession(
    namespace: string,
    propertyName: string,
    sessionId?: string,
  ): Promise<unknown> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.getPropertyInSession(
      this.accountId,
      namespace,
      propertyName,
      sessionId,
    );
  }

  /* istanbul ignore next */
  public async deletePropertyInSession(
    namespace: string,
    propertyName: string,
    sessionId?: string,
  ): Promise<void> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.deletePropertyInSession(
      this.accountId,
      namespace,
      propertyName,
      sessionId,
    );
  }

  /* istanbul ignore next */
  public async deleteSession(
    namespace: string,
    sessionId: string,
  ): Promise<void> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.deleteSession(
      this.accountId,
      namespace,
      sessionId,
    );
  }

  /* istanbul ignore next */
  public async getListOfSessions(namespace: string): Promise<string[]> {
    await this.initContextServiceClient();
    return this.contextServiceClient!.getListOfSessions(
      this.accountId,
      namespace,
    );
  }
}

function getBaseUrl(): string {
  // TODO: Base-Url determination should be handled by the CSDS-Client as soon as the Service has its CSDS-Entry
  const vaultServiceEnv = process.env['CONTEXT_SERVICE_ENVIRONMENT'];

  switch (vaultServiceEnv) {
    case 'qa':
      return 'lp-mavencontext-qa.dev.lprnd.net';
    case 'z1-a':
      return 'va-a.context.liveperson.net';
    case 'z1':
      return CONTEXT_SERVICE_DOMAINS.US;
    case 'z2':
      return CONTEXT_SERVICE_DOMAINS.EMEA;
    case 'z3':
      return CONTEXT_SERVICE_DOMAINS.APAC;

    default:
      throw new Error(
        'Could not determine ContextService environment. Please make sure to set CONTEXT_SERVICE_ENVIRONMENT (qa, z1-a, z1, z2 or z3) as env variable in your config.json!',
      );
  }
}
