import { Namespace, NamespaceOptions } from './types/namespace';
import { Entity } from './types/entity';
import { IRestClient, RestClient } from './restclient/client';
import { SDKError } from './types/errors/sdkError';
import { isEmptyString, isBuiltInNamespace, isNullOrUndefined } from './util/predicates';
import { ErrorCodes } from './util/constants';

export { DOMAINS } from './util/constants';
export { NamespaceOptions, Namespace } from './types/namespace';
export { Entity } from './types/entity';

export interface IContextServiceClient {
    /**
     * Creates a custom namespace with the specified name for the provided account.
     * Given the namespace exists it will not recreate it or throw an error. However
     * there are built-in namespaces that will yield an error.
     *
     * @param accountId
     * @param namespace
     * @param [options] that should be applied to the namespace. For example TTL.
     *
     * @throws SDK Error when API returned non successfull status code
     * @throws SDK Error when provided namespace is built-in
     * @throws SDK Error when provided namespace is null, undefined or empty string
     */
    createNamespace(accountId: string, namespace: string, options?: NamespaceOptions): Promise<Namespace>;
    /**
     * Deletes a custom namespace with the specified name.
     * Given the namespace was already deleted it will not throw an error.
     *
     * @param accountId
     * @param namespace
     *
     * @throws SDK Error when API returned non successfull status code
     * @throws SDK Error when provided namespace is built-in
     * @throws SDK Error when provided namespace is null, undefined or empty string
     */
    deleteNamespace(accountId: string, namespace: string): Promise<void>;
    /**
     * Returns a list containing all custom namespaces for the specified account.
     * Please be aware that built-in namespaces won't show up with exception to
     * the default namespace.
     *
     * @param accountId
     *
     * @throws SDK Error when API returned non successfull status code
     */
    getListOfNamespaces(accountId: string): Promise<Namespace[]>;

    /**
     * Will set properties on the specified session in the defined namespace.
     * Given no session was provided it will fallback to the default session of the
     * namespace. All values will be stored in their JSON serialized version. Given
     * a property/properties already exist they will be updated.
     *
     * @param accountId
     * @param namespace
     * @param properties
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws SDK Error when API returned non successfull status code
     */
    setPropertiesInNamespace(accountId: string, namespace: string, properties: Entity, sessionId?: string): Promise<Entity>;
    /**
     * Will update properties on the specified session in the defined namespace.
     * Given no session was provided it will fallback to the default session of the
     * namespace. All values will be stored in their JSON serialized version. Given
     * a property/properties does not exist they will be created.
     *
     * @param accountId
     * @param namespace
     * @param properties
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws SDK Error when API returned non successfull status code
     */
    updatePropertiesInNamespace(accountId: string, namespace: string, properties: Entity, sessionId?: string): Promise<Entity>;
    /**
     * Returns the specified session containing all of it's properties.
     * Given no session was provided it will fallback to the default session of the
     * namespace.
     *
     * @param accountId
     * @param namespace
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws SDK Error when API returned non successfull status code
     */
    getAllPropertiesInSession(accountId: string, namespace: string, sessionId?: string): Promise<Entity>;
    /**
     * Returns the specified session containing all of the defined properties. Given
     * a property does not exist it will be ignored. Given no session was provided it
     * will fallback to default session of the namespace.
     *
     * @param accountId
     * @param namespace
     * @param propertyNames that should be included
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws SDK Error when API returned non successfull status code
     */
    getSelectedPropertiesInSession(accountId: string, namespace: string, propertyNames: string[], sessionId?: string): Promise<Entity>;
    /**
     * Get the value of the specified property on the defined session. Given no
     * session was provided it will fallback to default session of the namespace.
     *
     * @param accountId
     * @param namespace
     * @param propertyName
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws SDK Error when API returned non successfull status code
     */
    getPropertyInSession(accountId: string, namespace: string, propertyName: string, sessionId?: string): Promise<unknown>;
    /**
     * Deletes the specified property on the defined session. Given no
     * session was provided it will fallback to default session of the namespace.
     * Given the property was already deleted it will not throw an error.
     *
     * @param accountId
     * @param namespace
     * @param propertyName
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws SDK Error when API returned non successfull status code
     */
    deletePropertyInSession(accountId: string, namespace: string, propertyName: string, sessionId?: string): Promise<void>;
    /**
     * Deletes the specified session in the defined namespace. Given no
     * session was provided it will fallback to default session of the namespace.
     * Given the session was already deleted it will not throw an error.
     *
     * @param accountId
     * @param namespace
     * @param [sessionId] Optional if not provided will use default session
     *
     * @throws SDK Error when API returned non successfull status code
     */
    deleteSession(accountId: string, namespace: string, sessionId: string): Promise<void>;
    /**
     * Returns a list containing all session in the specified namespaces.
     *
     * @param accountId
     * @param namespace
     *
     * @throws SDK Error when API returned non successfull status code
     */
    getListOfSessions(accountId: string, namespace: string): Promise<string[]>;
}

export class ContextServiceClient implements IContextServiceClient {
    public readonly client: IRestClient;
    /**
     * Instanciate a new client for target baseurl using provided api key
     * @param baseUrl You can use the DOMAINS constant to choose the correct baseUrl.
     * @param apiKey
     */
    constructor(baseUrl: string, apiKey: string) {
        // TODO: Maybe replace this with an approach where we get the value from csds (however no entry available yet).
        this.client = new RestClient(baseUrl, apiKey);
    }

    public async createNamespace(accountId: string, namespace: string, options?: NamespaceOptions): Promise<Namespace> {
        try {
            if (isNullOrUndefined(namespace) || isEmptyString(namespace)) {
                throw new SDKError(ErrorCodes.Parameter.Incorrect, 'Namespace can not be null, undefined or empty string');
            }

            if (isBuiltInNamespace(namespace)) {
                throw new SDKError(ErrorCodes.Parameter.Incorrect, 'Can not create a built-in namespace');
            }
           
            if (options?.ttl <= 0) {
                throw new SDKError(ErrorCodes.Parameter.Incorrect, 'TTL needs to be a positive integer above 0');
            }

            const defaultOption = {}; // Ensuring data is stored permanent
            return await this.client.createNamespace(accountId, namespace, Object.assign({}, defaultOption, options));
        } catch (error) {
            throw SDKError.from(error);
        }
    }
    public async deleteNamespace(accountId: string, namespace: string): Promise<void> {
        try {
            if (isNullOrUndefined(namespace) || isEmptyString(namespace)) {
                return;
            }

            if (isBuiltInNamespace(namespace)) {
                throw new SDKError(ErrorCodes.Parameter.Incorrect, 'Can not delete a built-in namespace');
            }

            return await this.client.deleteNamespace(accountId, namespace);
        } catch (error) {
            throw SDKError.from(error);
        }
    }
    public async getListOfNamespaces(accountId: string): Promise<Namespace[]> {
        try {
            return await this.client.getListOfNamespaces(accountId);
        } catch (error) {
            throw SDKError.from(error);
        }
    }
    public async setPropertiesInNamespace(accountId: string, namespace: string, properties: Entity, sessionId?: string): Promise<Entity> {
        try {
            return await this.client.setOrUpdatePropertiesInNamespace(accountId, namespace, properties, sessionId);
        } catch (error) {
            throw SDKError.from(error);
        }
    }
    public async updatePropertiesInNamespace(
        accountId: string,
        namespace: string,
        properties: Entity,
        sessionId?: string,
    ): Promise<Entity> {
        try {
            return await this.client.setOrUpdatePropertiesInNamespace(accountId, namespace, properties, sessionId);
        } catch (error) {
            throw SDKError.from(error);
        }
    }
    public async getAllPropertiesInSession(accountId: string, namespace: string, sessionId?: string): Promise<Entity> {
        try {
            return await this.client.getAllPropertiesInSession(accountId, namespace, sessionId);
        } catch (error) {
            throw SDKError.from(error);
        }
    }
    public async getSelectedPropertiesInSession(
        accountId: string,
        namespace: string,
        propertyNames: string[],
        sessionId?: string,
    ): Promise<Entity> {
        try {
            return await this.client.getSelectedPropertiesInSession(accountId, namespace, propertyNames, sessionId);
        } catch (error) {
            throw SDKError.from(error);
        }
    }
    public async getPropertyInSession(accountId: string, namespace: string, propertyName: string, sessionId?: string): Promise<unknown> {
        try {
            return await this.client.getPropertyInSession(accountId, namespace, propertyName, sessionId);
        } catch (error) {
            throw SDKError.from(error);
        }
    }
    public async deletePropertyInSession(accountId: string, namespace: string, propertyName: string, sessionId?: string): Promise<void> {
        try {
            return await this.client.deletePropertyInSession(accountId, namespace, propertyName, sessionId);
        } catch (error) {
            throw SDKError.from(error);
        }
    }
    public async deleteSession(accountId: string, namespace: string, sessionId: string): Promise<void> {
        try {
            return await this.client.deleteSession(accountId, namespace, sessionId);
        } catch (error) {
            throw SDKError.from(error);
        }
    }
    public async getListOfSessions(accountId: string, namespace: string): Promise<string[]> {
        try {
            return await this.client.getListOfSessions(accountId, namespace);
        } catch (error) {
            throw SDKError.from(error);
        }
    }
}
