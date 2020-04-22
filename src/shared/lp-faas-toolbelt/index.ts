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
}
