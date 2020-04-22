import { SendMailOptions, SentMessageInfo } from 'nodemailer';

export interface ISMTPClient {
    /**
     * Will send the provided email. This method will create and cleanup
     * an new connection for every send email.
     * @param mail to send
     */
    send(mail: SendMailOptions): Promise<SentMessageInfo>;
    /**
     * Validates the provided configuration by establishing a connection
     * and authenticating with the provided credentials.
     */
    verify(): Promise<true>;
}
