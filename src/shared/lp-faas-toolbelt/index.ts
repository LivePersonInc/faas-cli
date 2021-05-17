import { SmtpOptions } from 'nodemailer-smtp-transport';
import { ConversationUtil } from './conversation-util/conversationUtil';
import { IConversationUtil } from './conversation-util/IConversationUtil';
import { ConnectToSalesforce } from './crm-clients/salesforce';
import { CsdsClient } from './csds-client/csdsClient';
import { GDPRUtil } from './GDPR/GDPRUtil';
import { IGDPRUtil } from './GDPR/IGDPRUtil';
import { httpClient } from './http-client/httpClient';
import { ILpClient, lpClientFactory } from './lp-client/LpClient';
import { ISDEUtil } from './SDE-util/ISDEUtil';
import { SDEUtil } from './SDE-util/SDEUtil';
import { ISecretClient } from './secret-storage/IsecretClient';
import { VaultSecretClient } from './secret-storage/secretClient';
import { ISMTPClient } from './smtp-client/ISmtpClient';
import { SMTPClient } from './smtp-client/smtpClient';
import { IFaaSContextServiceClientConfig, IFaaSContextServiceClient } from './context-service-client/IFaaSContextServiceClient';
import { FaasContextServiceClient } from './context-service-client/contextServiceClient';

export { ErrorCodes } from './errors/errorCodes';
export { SecretError } from './errors/secretError';
export { LpServices } from './lp-client/LpServices';
export { ConversationContentTypes } from './conversation-util/ConversationContentTypes';
export { SDETypes } from './SDE-util/SDETypes';

export class Toolbelt {
    private static csdsClient: CsdsClient;
    /**
     * Returns an Salesforce Client, that is configured to work with the proxy.
     */
    public static SFClient() {
        return { connectToSalesforce: ConnectToSalesforce };
    }

    /**
     * Returns an HTTP CLient, that is configured to work with the proxy.
     * It is based on request-promise and shares the same interface.
     */
    public static HTTPClient() {
        return httpClient;
    }

    /**
     * Returns an Secret Client, which is setup to allow read and update access
     * to the secret storage of the Site ID.
     */
    public static SecretClient(): ISecretClient {
        return new VaultSecretClient();
    }

    /**
     * Returns an SMTP Client, which is configured based on the provided options.
     * It is based on nodemailer and shares the same interface.
     * @param connectionOptions
     */
    public static SMTPClient(connectionOptions: SmtpOptions): ISMTPClient {
        return new SMTPClient(connectionOptions);
    }

    /**
     * Returns a new Conversation Util, which is configured based on the provided apiCredentials.
     * @param apiCredentials needed to acces conversation data in Live Engage
     */
    public static ConversationUtil(): IConversationUtil {
        return new ConversationUtil(this.LpClient());
    }

    public static SDEUtil(): ISDEUtil {
        return new SDEUtil(this.LpClient());
    }

    private static lazyInitCsdsClient(): CsdsClient {
        if (!this.csdsClient) {
            this.csdsClient = new CsdsClient();
        }

        return this.csdsClient;
    }

    /**
     * Returns GDPR Util, which can be used for GDPR related functionaliy such as deleting files of a conversation.
     */
    public static GDPRUtil(): IGDPRUtil {
        return new GDPRUtil(this.lazyInitCsdsClient());
    }

    public static LpClient(): ILpClient {
        return lpClientFactory(this.lazyInitCsdsClient(), this.SecretClient(), this.HTTPClient());
    }

    /**
     * Returns a Context Service Client which can be used to interact with the
     * Context Session Store.
     * @param {IFaaSContextServiceClientConfig} config Config Object in which the account ID for which the Client
     * will be used and a key for the Context Session Store API need to be provided
     */
    public static ContextServiceClient(config: IFaaSContextServiceClientConfig): IFaaSContextServiceClient {
      if (!config) {
          throw new Error('No valid configuration was provided');
      }
      const { apiKey, accountId } = config;
      if (!apiKey) {
          throw new Error('No valid API-key was provided');
      }
      if (!accountId) {
          throw new Error('No valid accountId was provided');
      }

      return new FaasContextServiceClient(config);
  }
}
