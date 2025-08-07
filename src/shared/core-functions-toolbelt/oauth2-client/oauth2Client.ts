import type { ICsdsClient } from '../csds-client/ICsdsClient.js';
import type { IOAuth2Client } from './IOauth2Client.js';
import type { AuthServerResponse, OAuth2ClientCreds, AccessTokenData } from './types.js';

import { isError, isObject, isToolbeltError } from '../shared/typesPredicates.js';
import { ErrorCodes } from '../errors/errorCodes.js';
import { makeSpecificError } from '../errors/toolbeltError.js';
import { getTraceId } from '../shared/helper.js';

const newOauth2ClientError = makeSpecificError('Oauth2Client');

const AUTH_SERVER = 'sentinel';

export class Oauth2Client implements IOAuth2Client {
    constructor(
        private csdsClient: ICsdsClient,

        private httpClient = fetch,

        private accountId = process.env.X_LIVEPERSON_BRAND_ID,
    ) {}

    public async getAccessToken({ client_id, client_secret }: OAuth2ClientCreds): Promise<AccessTokenData> {
        try {
            const baseDomain = await this.csdsClient.get(AUTH_SERVER);
            const options = {
                method: 'POST',

                headers: {
                    'X-Request-Id': getTraceId(),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: client_id,
                    client_secret: client_secret,
                    grant_type: 'client_credentials',
                }),
            };

            const response = await this.httpClient(`https://${baseDomain}/sentinel/api/v2/account/${this.accountId}/app/token?v=2.0`, options);

            const authServerResponse = (await response.json()) as unknown;

            if (!isAuthServerResponse(authServerResponse)) {
                const responseText = JSON.stringify(authServerResponse);
                throw newOauth2ClientError(ErrorCodes.OAuth2.UnexpectedResponse, `AuthServer unexpected response: ${responseText}. Status Code: ${response.status}`);
            }

            return { ...authServerResponse, requestedAt: new Date() };
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }
            throw newOauth2ClientError(
                ErrorCodes.OAuth2.General,
                `Obtaining OAuth2 Access Token from ${AUTH_SERVER} failed due to: ${isError(error) ? error.message : ' Unknown error'}`,
            );
        }
    }
}

export const isAccessTokenExpired = (accessToken: AuthServerResponse & { requestedAt: Date }): boolean => {
    return Date.now() - accessToken.requestedAt.getTime() > Number.parseInt(accessToken.expires_in) * 1000 - 60000; // we discount 1 min to have better margin
};

function isAuthServerResponse(response: unknown): response is AuthServerResponse {
    if (isObject(response)) {
        return (
            'access_token' in response &&
            typeof response.access_token === 'string' &&
            'token_type' in response &&
            typeof response.token_type === 'string' &&
            'expires_in' in response &&
            typeof response.expires_in === 'string'
        );
    }

    return false;
}
