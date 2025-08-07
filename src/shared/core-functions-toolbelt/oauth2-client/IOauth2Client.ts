import type { AccessTokenData, OAuth2ClientCreds } from './types.js';

export interface IOAuth2Client {
    getAccessToken({ client_id, client_secret }: OAuth2ClientCreds): Promise<AccessTokenData>;
}
