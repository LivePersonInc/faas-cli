import {
  NamespaceOptions,
  Namespace,
  Entity,
} from '../context-service-sdk/lib';

export interface IFaaSContextServiceClient {
  /**
   * Creates a custom namespace with the specified name for the provided account.
   * Given the namespace exists it will not recreate it or throw an error. However
   * there are built-in namespaces that will yield an error.
   *
   * @param namespace
   * @param [options] that should be applied to the namespace. For example TTL.
   *
   * @throws SDK Error when API returned non successful status code
   * @throws SDK Error when provided namespace is built-in
   * @throws SDK Error when provided namespace is null, undefined or empty string
   */
  createNamespace(
    namespace: string,
    options?: NamespaceOptions,
  ): Promise<Namespace>;
  /**
   * Deletes a custom namespace with the specified name.
   * Given the namespace was already deleted it will not throw an error.
   *
   * @param namespace
   *
   * @throws SDK Error when API returned non successful status code
   * @throws SDK Error when provided namespace is built-in
   * @throws SDK Error when provided namespace is null, undefined or empty string
   */
  deleteNamespace(namespace: string): Promise<void>;
  /**
   * Returns a list containing all custom namespaces for the account the client was initialised for.
   * Please be aware that built-in namespaces won't show up with exception to
   * the default namespace.
   *
   * @throws SDK Error when API returned non successful status code
   */
  getListOfNamespaces(): Promise<Namespace[]>;
  /**
   * Will set properties on the specified session in the defined namespace.
   * Given no session was provided it will fallback to the default session of the
   * namespace. All values will be stored in their JSON serialized version. Given
   * a property/properties already exist they will be updated.
   *
   * @param namespace
   * @param properties
   * @param [sessionId] Optional if not provided will use default session
   *
   * @throws SDK Error when API returned non successful status code
   */
  setPropertiesInNamespace(
    namespace: string,
    properties: Entity,
    sessionId?: string,
  ): Promise<Entity>;
  /**
   * Will update properties on the specified session in the defined namespace.
   * Given no session was provided it will fallback to the default session of the
   * namespace. All values will be stored in their JSON serialized version. Given
   * a property/properties does not exist they will be created.
   *
   * @param namespace
   * @param properties
   * @param [sessionId] Optional if not provided will use default session
   *
   * @throws SDK Error when API returned non successful status code
   */
  updatePropertiesInNamespace(
    namespace: string,
    properties: Entity,
    sessionId?: string,
  ): Promise<Entity>;
  /**
   * Returns the specified session containing all of it's properties.
   * Given no session was provided it will fallback to the default session of the
   * namespace.
   *
   * @param namespace
   * @param [sessionId] Optional if not provided will use default session
   *
   * @throws SDK Error when API returned non successful status code
   */
  getAllPropertiesInSession(
    namespace: string,
    sessionId?: string,
  ): Promise<Entity>;
  /**
   * Returns the specified session containing all of the defined properties. Given
   * a property does not exist it will be ignored. Given no session was provided it
   * will fallback to default session of the namespace.
   *
   * @param namespace
   * @param propertyNames that should be included
   * @param [sessionId] Optional if not provided will use default session
   *
   * @throws SDK Error when API returned non successful status code
   */
  getSelectedPropertiesInSession(
    namespace: string,
    propertyNames: string[],
    sessionId?: string,
  ): Promise<Entity>;
  /**
   * Get the value of the specified property on the defined session. Given no
   * session was provided it will fallback to default session of the namespace.
   *
   * @param namespace
   * @param propertyName
   * @param [sessionId] Optional if not provided will use default session
   *
   * @throws SDK Error when API returned non successful status code
   */
  getPropertyInSession(
    namespace: string,
    propertyName: string,
    sessionId?: string,
  ): Promise<unknown>;
  /**
   * Deletes the specified property on the defined session. Given no
   * session was provided it will fallback to default session of the namespace.
   * Given the property was already deleted it will not throw an error.
   *
   * @param namespace
   * @param propertyName
   * @param [sessionId] Optional if not provided will use default session
   *
   * @throws SDK Error when API returned non successful status code
   */
  deletePropertyInSession(
    namespace: string,
    propertyName: string,
    sessionId?: string,
  ): Promise<void>;
  /**
   * Deletes the specified session in the defined namespace. Given no
   * session was provided it will fallback to default session of the namespace.
   * Given the session was already deleted it will not throw an error.
   *
   * @param namespace
   * @param [sessionId] Optional if not provided will use default session
   *
   * @throws SDK Error when API returned non successful status code
   */
  deleteSession(namespace: string, sessionId: string): Promise<void>;
  /**
   * Returns a list containing all session in the specified namespaces.
   *
   * @param namespace
   *
   * @throws SDK Error when API returned non successful status code
   */
  getListOfSessions(namespace: string): Promise<string[]>;
}

export interface IFaaSContextServiceClientConfig {
  apiKey: string;
  accountId: string;
}
