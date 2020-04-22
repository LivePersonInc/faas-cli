import { createTransport, SendMailOptions, SentMessageInfo } from 'nodemailer';
import { SmtpOptions } from 'nodemailer-smtp-transport';
import { ISMTPClient } from './ISmtpClient';

export class SMTPClient implements ISMTPClient {
    private connectionOptions: SmtpOptions;

    constructor(connectionOptions: SmtpOptions) {
        this.connectionOptions = connectionOptions;
    }

    public async send(mail: SendMailOptions): Promise<SentMessageInfo> {
        const connection = this.makeNewConnection(this.connectionOptions);
        try {
            const info: SentMessageInfo = await connection.sendMail(mail);
            this.safelyCloseConnection(connection);

            return info;
        } catch (error) {
            this.safelyCloseConnection(connection);
            throw error;
        }
    }

    public verify(): Promise<true> {
        const connection = this.makeNewConnection(this.connectionOptions);
        return connection.verify();
    }

    /**
     * This method will close the connection if it is closable.
     * @param connection which should be closed
     */
    private safelyCloseConnection(connection: any): void {
        if (!!connection.close && typeof connection.close === 'function') {
            console.debug('Safely closed SMTP connection');
            connection.close();
        }
    }

    /**
     * This Factory uses the options to create a new SMTP Connection and
     * modify it's callback based API to an promise based API.
     * @param options for the connection
     */
    private makeNewConnection(options: SmtpOptions): any {
        return createTransport(options);
    }
}
