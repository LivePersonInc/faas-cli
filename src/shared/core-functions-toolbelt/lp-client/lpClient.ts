import type { ICsdsClient } from '../csds-client/ICsdsClient.js';
import type { ISecretClient } from '../secret-storage/IsecretClient.js';
import type { IOAuth2Client } from '../oauth2-client/IOauth2Client.js';
import type { ILpClient, ILpClientOptions } from './types.js';
import type { AccessTokenData, OAuth2ClientCreds } from '../oauth2-client/types.js';
import { WellKnownLPServices } from './lpServices.js';
import { isError, isOAuth2ClientCreds, isToolbeltError } from '../shared/typesPredicates.js';
import { makeSpecificError } from '../errors/toolbeltError.js';
import { ErrorCodes } from '../errors/errorCodes.js';
import { isAccessTokenExpired } from '../oauth2-client/oauth2Client.js';
import { getTraceId } from '../shared/helper.js';
import { DEFAULT_APP_KEY_SECRET_NAME } from '../shared/const.js';

const newLpClientError = makeSpecificError('LpClient');

export const lpClientFactory = (csdsClient: ICsdsClient, secretClient: ISecretClient, oauth2Client: IOAuth2Client, httpClient = fetch): ILpClient => {
    let accessToken: AccessTokenData; // We cache the Access Token between invocations

    const getAppKeyCredentials = async (secretName: string, useCache: boolean = true): Promise<OAuth2ClientCreds> => {
        try {
            const { value } = await secretClient.readSecret(secretName, { useCache });

            const creds = JSON.parse(value) as unknown;

            if (!isOAuth2ClientCreds(creds)) {
                throw newLpClientError(ErrorCodes.LpClient.Creds.Format, `Credentials have Invalid Format`);
            }
            return creds;
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }

            throw newLpClientError(
                ErrorCodes.LpClient.Creds.Failure,
                `Could not fetch App Key credentials from secret storage: ${isError(error) ? error.message : 'unknown error'}`,
            );
        }
    };

    const getAccessToken = async ({ client_id, client_secret }: OAuth2ClientCreds, useCache: boolean = true): Promise<AccessTokenData> => {
        if (accessToken !== undefined && !isAccessTokenExpired(accessToken) && useCache) {
            return accessToken;
        }

        return await oauth2Client.getAccessToken({ client_id, client_secret });
    };

    return async (
        service: WellKnownLPServices | string,
        path: string,
        { appKeySecretName = DEFAULT_APP_KEY_SECRET_NAME, method = 'GET', ...options }: ILpClientOptions,
    ): Promise<Response> => {
        const domain = await csdsClient.get(service);

        let oauth2Creds = await getAppKeyCredentials(appKeySecretName);
        accessToken = await getAccessToken(oauth2Creds);

        const { access_token, token_type } = accessToken;

        const requestOptions = { method, ...options };
        requestOptions.headers = { ...requestOptions.headers, authorization: `${token_type} ${access_token}`, 'X-Request-Id': getTraceId() };

        const url = `https://${domain}${path}`;

        let response = await httpClient(url, requestOptions);

        if (response.status === 401) {
            // access token might be expired
            oauth2Creds = await getAppKeyCredentials(appKeySecretName, false);
            accessToken = await getAccessToken(oauth2Creds, false);
            requestOptions.headers = { ...requestOptions.headers, authorization: `${token_type} ${access_token}` };
            response = await httpClient(url, requestOptions);
        }

        return response;
    };
};
