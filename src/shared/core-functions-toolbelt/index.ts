import type { IFaaSContextServiceClient } from './context-service-client/IFaaSContextServiceClient';
import type { IGDPRUtil } from './GDPR-util/IGDPRUtil';
import type { ISDEUtil } from './SDE-util/ISDEUtil';
import type { IConversationUtil } from './conversation-util/IConversationUtil';
import type { ILpClient } from './lp-client/types';
import type { ILpMtlsClient } from './mtls-client/ILPMtlsClient';
import type { IMtlsClient } from './mtls-client/IMTLSClient';
import type { ClientTLS } from './mtls-client/types';
import type { SecretClientOptions, SecretEntry } from './secret-storage/types';
import type { ICache } from './secret-storage/ICache';
import type { ISecretClient } from './secret-storage/IsecretClient';
import type { IOrchestratorClient } from './orchestrator-client/IOrchestratorClient';

import { ConnectToSalesforce } from './crm-clients/salesforce';
import { MTLSClient } from './mtls-client/mtlsClient';
import { SecretCache } from './secret-storage/secretCache';
import {
  FunctionsSecretClient,
  defaultSecretClientOptions,
} from './secret-storage/secretClient';
import { FaasContextServiceClient } from './context-service-client/faasContextServiceClient';
import { lpClientFactory } from './lp-client/lpClient';
import { CsdsClient } from './csds-client/csdsClient';
import { Oauth2Client } from './oauth2-client/oauth2Client';
import { GDPRUtil } from './GDPR-util/GDPR-util';
import { ConversationUtil } from './conversation-util/conversationUtil';
import { LPMtlsClient } from './mtls-client/lpMtlsClient';
import { OrchestratorClient } from './orchestrator-client/OrchestratorClient';
import { SDEUtil } from './SDE-util/SDEUtil';
import { ContextServiceClient } from './context-service-sdk/lib';

export { ErrorCodes } from './errors/errorCodes';
export { ToolBeltError } from './errors/toolbeltError';
export { ConversationContentTypes } from './conversation-util/types';
export { SDETypes } from './SDE-util/types';
export { ErrorStrategy } from './orchestrator-client/types';
export { WellKnownLPServices as LpServices } from './lp-client/lpServices';
export const globalSecretCache: ICache<string, SecretEntry> = new SecretCache(
  defaultSecretClientOptions.cache,
);
/**
 * Provides easy access to commonly used resources such as the secret store or a wrapped lpclient.
 * ### Basic example
 * ```ts
 *  import { Toolbelt } from 'core-functions-toolbelt';
 *  const secretClient = Toolbelt.SecretClient();
 *  const lpClient = Toolbelt.LpClient();
 *  const gDPRUtil = Toolbelt.GDPRUtil();
 *  const sDEUtil = Toolbelt.SDEUtil();
 *  const mTLSClient = Toolbelt.MTLSClient({ cert:'sample', key:'sample', ca:'sample' });
 *  const contextServiceClient = Toolbelt.ContextServiceClient({ accountId: '1234', apiKey: '5678' });
 *  const orchestratorClient = Toolbelt.OrchestratorClient()
 *  const client = Toolbelt.LPMtlsClient();
 *  const sFClient = Toolbelt.SFClient();
 *  const csdsClient = Toolbelt.CsdsClient();
 * ```
 *
 */
export class Toolbelt {
  private static csdsClient: CsdsClient;

  private static oauth2client: Oauth2Client;

  /**
   * Returns a Secret Client, which is configured to allow read and update access to the secret storage of the Site ID.
   * IMPORTANT: Secrets are by default cached. If you want to leverage the lastest values you need to explicitly opt in by setting { useCache: false, }
   * Read the full (documentation)[https://developers.liveperson.com/liveperson-functions-toolbelt-documentation-secret-client.html]
   * ### Basic example
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *  const secretClient = Toolbelt.SecretClient();
   *  try{
   *      // Get refreshToken from secret storage
   *      const { value } = await secretClient.readSecret('refreshToken');
   *
   *      // write/update token to secret storage
   *      await secretClient.writeSecret({
   *            key: 'refreshToken',
   *            value: 'sampleValue'
   *        });
   *   } catch (error){
   *      console.error(`Received following error message: ${error.message}`);
   *   }
   * ```
   * ### Disable secret cache (in case fresh secrets are required)
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *  const secretClient = Toolbelt.SecretClient();
   *  try{
   *      // Get fresh secret from secret storage
   *     const { value } = await secretClient.readSecret("SecretName", { useCache: false, });
   *   } catch (error){
   *      console.error(`Received following error message: ${error.message}`);
   *   }
   * ```
   */
  public static SecretClient(
    options?: Partial<SecretClientOptions>,
  ): ISecretClient {
    return new FunctionsSecretClient(globalSecretCache);
  }
  /**
   * Returns a LivePerson (LP) Client which is a wrapper for the Node Fetch http Client. It simplifies the usage of LivePerson APIs by
   * providing automatic service discovery as well as taking care of the authorization.
   * Read the full (documentation)[https://developers.liveperson.com/liveperson-functions-toolbelt-documentation-lp-client.html]
   * The LP service entries comes from liveperson csds service for more information read here (documentation)[https://developers.liveperson.com/liveperson-functions-toolbelt-documentation-lp-client.html#enumeration-lpservices]
   * ### Basic example
   * ```ts
   *  import { Toolbelt, LpServices } from 'core-functions-toolbelt';
   *  const lpClient = Toolbelt.LpClient();
   *  try{
   *      // The same options as those available in the Fetch HTTP client
   *      const options = {
   *          method: 'POST',
   *          body: JSON.stringify({
   *             conversationId: "077d80a9-7c45-4899-8480-306523868324",
   *          }),
   *      };
   *      response = await lpClient(
   *          LpServices.MSG_HIST,
   *          `/messaging_history/api/account/${accountId}/conversations/conversation/search`,
   *          options
   *      );
   *   } catch (error) {
   *      console.error(`Received following error message: ${error.message}`);
   *   }
   * ```
   */
  public static LpClient(): ILpClient {
    return lpClientFactory(
      this.lazyInitCsdsClient(),
      this.SecretClient(),
      this.lazyInitOauth2Client(),
    );
  }

  /**
   * Returns GDPR Util client, which can be used for GDPR related functionality such as replacing files of a conversation.
   * Read the full (documentation)[https://developers.liveperson.com/liveperson-functions-toolbelt-documentation-gdpr-util.html]
   * ### Basic example
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *  const gDPRUtilClient = Toolbelt.GDPRUtil();
   *  try{
   *      const conversationId = "de0ab208-f2e1-4901-9797-a0a31cb798eb";
   *      const credentials ={
   *             username: "user",
   *             password: "pass"
   *       };
   *      // First, get the conversation in which the image files need to be replaced
   *      const conversation = await gDPRUtilClient.getConversationById(
   *          conversationId
   *      );
   *      // Default replacement will use a generic image
   *      let response = await gDPRUtilClient.replaceConversationFiles(conversation, credentials);
   *
   *      // You can add a custom replacement criteria function based on image path
   *      const shouldRetryFn = (path) => {
   *          // add your custom retry criteria based on path. path is a string.
   *          if (path.startsWith('some_text')) return true;
   *          return false;
   *       };
   *      response = await gDPRUtilClient.replaceConversationFiles(conversation, credentials, shouldRetryFn);
   *
   *      // You can change the generic image by your custom image
   *      const file = {
   *         body: Buffer.from('Your-file', 'base64'),
   *         contentType: 'image/png',
   *      };
   *      response = await gDPRUtilClient.replaceConversationFiles(conversation, credentials, () => true, file);
   *   } catch (error){
   *      console.error(`Received following error message: ${error.message}`);
   *   }
   * ```
   */
  public static GDPRUtil(): IGDPRUtil {
    return new GDPRUtil(this.lazyInitCsdsClient());
  }

  /**
   * Returns an Salesforce Client, that is configured to work with the proxy.
   * Read the full (documentation)[https://developers.liveperson.com/liveperson-functions-toolbelt-documentation-toolbelt.html#sfclient]
   * Use the official (SalesForce documentation)[https://jsforce.github.io/document/] for all features.
   * ### Basic example
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *  const sFClient = Toolbelt.SFClient();
   *  try{
   *      const client = await sFClient.connectToSalesforce({loginUrl:'https://test.salesforce.com',accessToken:'secret',refreshToken:'secret'});
   *   } catch (error){
   *      console.error(`Received following error message: ${error.message}`);
   *   }
   * ```
   */
  public static SFClient() {
    return { connectToSalesforce: ConnectToSalesforce };
  }

  /**
   * Returns a Conversation Util, which can be used to retrieve conversations and execute operations upon them.
   * Read the full (documentation)[https://developers.liveperson.com/liveperson-functions-toolbelt-documentation-toolbelt.html#conversationutil]
   * ### Basic Example
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *  const conversationUtil = Toolbelt.ConversationUtil();
   *  try{
   *      const conversationId = 'de0ab208-f2e1-4901-9797-a0a31cb798eb';
   *      const conversation = await conversationUtil.getConversationById(conversationId);
   *   } catch (error){
   *      console.error(`Received following error message: ${error.message}`);
   *   }
   * ```
   */
  public static ConversationUtil(): IConversationUtil {
    return new ConversationUtil(this.LpClient());
  }

  /**
   * Returns an MTLS Client which is configured with the provided config. Please make sure that you set allowSelfSigned
   * to true when calling an endpoint that relies on a self-signed cert. Another alternative would be to leverage the
   * ca cert, that needs to be passed via the clientTLS config.
   * Read the full (documentation)[https://developers.liveperson.com/liveperson-functions-toolbelt-documentation-mtls-client.html]
   * @param clientTLS Client Bundle consisting of cert + key and optionally the ca cert
   * ### Basic Example
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *  try{
   *      let clientBundle: string[] = ['someclientcert', 'someclientkey', 'somecakey'];
   *      const [cert, key, ca] = clientBundle;
   *      const target = Toolbelt.MTLSClient({ cert, key, ca });
   *      const headers = { authorization: 'Original Token' };
   *      const body = {test:123};
   *      // mtls options are optional, note: set json to true, to automatically stringify body + set correct content header. And parse response to json.
   *      const mtlsOptions = { timeout:10000, json: true };
   *      const response = await target.get(`https://some-lpmtls-endpoint.com`, headers);
   *      const { statusCode, headers, body } = await target.post(`https://some-lpmtls-endpoint.com`, headers, body, mtlsOptions);
   *      // const { statusCode, headers, body } = await target.put(`https://some-lpmtls-endpoint.com`, headers, body);
   *      // const { statusCode, headers, body } = await target.delete(`https://some-lpmtls-endpoint.com`, headers, body);
   *      // const { statusCode, headers, body } = await target.options(`https://some-lpmtls-endpoint.com`, headers, body);
   *      // const { statusCode, headers, body } = await target.patch(`https://some-lpmtls-endpoint.com`, headers, body);
   *   } catch (error){
   *      console.error(`Received following error message: ${error.message}`);
   *   }
   * ```
   */
  public static MTLSClient(clientTLS: ClientTLS): IMtlsClient {
    return new MTLSClient(clientTLS);
  }

  /**
   * Returns an OrchestratorClient which can be used to invoke other functions
   * Read the full (documentation)[https://developers.liveperson.com/liveperson-functions-toolbelt-documentation-orchestrator-client.html]
   * ### Basic Example
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *  const orchestratorClient = Toolbelt.OrchestratorClient();
   *  try{
   *      const invocations = [
   *           { uuid: 'f196e196-7cf2-4d32-bbd6-4173eb736b08', payload: {}, headers: { header1: 'value1', header2: 'value2' }},
   *           { uuid: 'e2431d9c-6dfc-6cc6-ddd5-1111eb731b07', payload: {}, headers: {} },
   *           { uuid: 'c451e193-ccfc-cd31-b556-2343ec145601', payload: {} },
   *       ];
   *
   *      const response = await orchestratorClient.invoke(invocations);
   *   } catch (error){
   *      console.error(`Received following error message: ${error.message}`);
   *   }
   * ```
   */
  public static OrchestratorClient(): IOrchestratorClient {
    return new OrchestratorClient(
      this.lazyInitCsdsClient(),
      this.SecretClient(),
      this.lazyInitOauth2Client(),
    );
  }

  /**
   * Returns a Context Service Client which can be used to interact with the Context Session Store V1.
   * Read the full (documentation)[https://developers.liveperson.com/liveperson-functions-toolbelt-documentation-faas-context-service-client.html]
   * @param {FaaSContextServiceClientConfig} config Config Object in which the account ID for which the Client
   * will be used and a key for the Context Session Store API need to be provided
   * ### Basic example
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *  const contextApikey = "<your_api_key"; // Please add your own key
   *  const contextClient = Toolbelt.ContextServiceClient(contextApikey);
   *  try{
   *      const config = { accountId: '1234', apiKey: '5678' }
   *      const client = new contextServiceClient(config);
   *      // create namespace
   *      await client.createNamespace('samplenamespace');
   *      // get list of all namespaces
   *      const nameSpaces = await client.getListOfNamespaces();
   *      // set properties in namespace
   *      await client.setPropertiesInNamespace('samplenamespace', 'sample');
   *      // update properties in namespace
   *      await client.updatePropertiesInNamespace('samplenamespace', 'sample');
   *      // delete namespace
   *      await client.deleteNamespace('sampleNameSpace');
   *      // get all properties in a session, note: sessionId is optional, if not used default session will be used
   *      await client.getAllPropertiesInSession('samplenamespace', 'sessionId');
   *      // get selected properties in a session, note: sessionId is optional, if not used default session will be used
   *      await client.getSelectedPropertiesInSession('samplenamespace', ['sampleone', 'sampletwo'], 'sessionId');
   *      // get property in Session, note: sessionId is optional, if not used default session will be used
   *      await client.getPropertyInSession'samplenamespace', 'samplepropertyname', 'sessionId');
   *      // update property in Session, note: sessionId is optional, if not used default session will be used
   *      await client.deletePropertyInSession('samplenamespace', 'samplepropertyname', 'sessionId');
   *      // get list of all sessions
   *      await client.getListOfSessions('samplenamespace');
   *      // delete session
   *      await client.deleteSession('samplenamespace', 'sessionId');
   *  } catch (error){
   *      console.error(`Received following error message: ${error.message}`);
   *  }
   * ```
   */
  public static ContextServiceClient(
    apiKey: string,
  ): IFaaSContextServiceClient {
    if (!apiKey) {
      throw new Error('No valid API-key was provided');
    }
    return new FaasContextServiceClient(
      (url, apiKey) => new ContextServiceClient(url, apiKey),
      this.lazyInitCsdsClient(),
      apiKey,
    );
  }

  /**
   * Returns a SDE Util, which can be used to add SDEs and other SDE related operations. This api is **NOT** realtime, i.e. requests can take more than 30s.
   * Read the full (documentation)[https://developers.liveperson.com/liveperson-functions-toolbelt-documentation-sde-util.html]
   * For attributes and types you can find more details about them here (documentation)[https://developers.liveperson.com/engagement-attributes-types-of-engagement-attributes.html]
   * ### Basic Example
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *  const sDEUtil = Toolbelt.SDEUtil();
   *  try{
   *      const visitorId = '123';
   *      const sessionId = '222';
   *      const engagementAttributes = [{ type: 'sampleType' }];
   *      await sdeUtil.addSDEs(engagementAttributes, visitorId, sessionId);
   *      const conversationParam = 'sampleparam'
   *      sdeUtil.getSDEsFromConv(conversationParam);
   *   } catch (error){
   *      console.error(`Received following error message: ${error.message}`);
   *   }
   * ```
   */
  public static SDEUtil(): ISDEUtil {
    return new SDEUtil(this.LpClient());
  }

  /**
   * Returns a CSDS client that allows you to discover the domains of liveperson services associated with your account. Be aware that domains are cached for 10 minutes.
   * ### Basic Example
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *  const csdsClient = Toolbelt.CsdsClient();
   *  try {
   *      const domain = await csdsClient.get("askMaven");
   *      const allDomains = await csdsClient.getAll();
   *  } catch (error){
   *     console.error(`Received following error message: ${error.message}`);
   *  }
   * ```
   */
  public static CsdsClient(): CsdsClient {
    return this.lazyInitCsdsClient();
  }

  /**
   * Returns a Client for the (LP MTLS)[https://developers.liveperson.com/mtls-overview.html] Service, please be aware that you need to perform the (onboarding)[https://developers.liveperson.com/mtls-mtls-self-service.html]
   * before being able to leverage the client. It will use the provided OAuth2 App Installation credentials to obtain an access token and use that for communication with sentinel.
   * Errors related to LP MTLS or Upstream failing will be thrown as MTLSError and can be differentiated using the MTLSError.code property.
   * ### Basic Example
   * ```ts
   *  import { Toolbelt } from 'core-functions-toolbelt';
   *
   *  try{
   *      const target = new Toolbelt.LPMtlsClient();
   *      const headers = { authorization: 'Original Token' };
   *      const body = {test:123};
   *      // mtls options are optional, note: set json to true, to automatically stringify body + set correct content header. And parse response to json.
   *      const mtlsOptions = { timeout:10000, json: true }
   *      const response = await target.get(`https://some-lpmtls-endpoint.com`, headers);
   *      const { statusCode, headers, body } = await target.post(`https://some-lpmtls-endpoint.com`, headers, body, mtlsOptions);
   *   } catch (error){
   *      console.error(`Received following error message: ${error.message}`);
   *   }
   * ```
   */
  public static LPMtlsClient(): ILpMtlsClient {
    const csdsClient = this.lazyInitCsdsClient();
    return new LPMtlsClient(
      csdsClient,
      this.lazyInitOauth2Client(),
      this.SecretClient(),
    );
  }

  private static lazyInitCsdsClient(): CsdsClient {
    if (!this.csdsClient) {
      this.csdsClient = new CsdsClient();
    }

    return this.csdsClient;
  }

  private static lazyInitOauth2Client(): Oauth2Client {
    if (!this.oauth2client) {
      this.oauth2client = new Oauth2Client(this.lazyInitCsdsClient());
    }

    return this.oauth2client;
  }
}
