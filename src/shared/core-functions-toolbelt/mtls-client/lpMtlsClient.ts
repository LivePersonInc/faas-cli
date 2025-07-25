import type { ICsdsClient } from '../csds-client/ICsdsClient';
import type { ILpMtlsClient } from './ILPMtlsClient';
import type { LPMtlsOptions, LPMtlsResponse } from './types';
import type { AccessTokenData, OAuth2ClientCreds } from '../oauth2-client/types';
import type { IOAuth2Client } from '../oauth2-client/IOauth2Client';

import { ErrorCodes } from '../errors/errorCodes.js';
import { isAccessTokenExpired } from '../oauth2-client/oauth2Client.js';
import { ISecretClient } from '../secret-storage/IsecretClient.js';
import { isError, isFetchTypeError, isOAuth2ClientCreds, isToolbeltError, isBodyInit, isDOMExceptionError } from '../shared/typesPredicates.js';
import { getTraceId, transformFetchResponseHeaders } from '../shared/helper.js';
import { makeSpecificMTLSError } from '../errors/mtlsError.js';
import { DEFAULT_APP_KEY_SECRET_NAME } from '../shared/const.js';

const newLpMtlsError = makeSpecificMTLSError('LP-MTLS');

export class LPMtlsClient implements ILpMtlsClient {
    private accessToken!: AccessTokenData;

    constructor(
        private csdsClient: ICsdsClient,
        private oauth2Client: IOAuth2Client,
        private secretClient: ISecretClient,
        private httpClient = fetch,
    ) {}

    public async get(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: LPMtlsOptions): Promise<LPMtlsResponse> {
        return await this.makeRequest('GET', url, headers, body, options);
    }
    public async post(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: LPMtlsOptions): Promise<LPMtlsResponse> {
        return await this.makeRequest('POST', url, headers, body, options);
    }

    /**
     * This method does the heavy lifting for the LP MTLS Call. JSON Flag is handled here, to ensure easier transition to another http client.
     * For other things the native Node Fetch interface is used.
     *
     * @param method
     * @param forwardUrl
     * @param headers
     * @param body
     * @param options
     * @returns
     */
    private async makeRequest(
        method: 'GET' | 'POST', // Currently only GET & POST are supported
        forwardUrl: string,
        headers?: Record<string, string>,
        body?: BodyInit | Record<string, unknown>,
        options?: LPMtlsOptions,
    ): Promise<LPMtlsResponse> {
        try {
            const shouldParseJson = options?.json || false;

            const requestOptions: RequestInit = {
                method,
                headers: this.prepareHeader(forwardUrl, shouldParseJson, await this.getAuthorizationHeader(), headers),
                body: body !== undefined ? this.prepareBody(body, shouldParseJson) : null,
                signal: options?.timeout !== undefined ? AbortSignal.timeout(options.timeout) : null,
            };

            const response = await this.httpClient(await this.getMtlsProxyUrl(), requestOptions);

            // Ensuring error is not related to process
            await this.checkIfProcessErrorOccurred(response);

            const responseHeaders = transformFetchResponseHeaders(response.headers);
            const responseBody = await response.text();

            const lpMtlsResponse: LPMtlsResponse = {
                statusCode: response.status,
                body: responseBody,
                headers: responseHeaders,
            };

            if (shouldParseJson) {
                try {
                    // cannot do: await response.json(), in case failure, response object will get broken and we cannot call response.text(): it will throw: "Body is unusable"
                    lpMtlsResponse.body = JSON.parse(responseBody);
                } catch (error) {
                    // Will simply return raw body
                }
            }

            return lpMtlsResponse;
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }

            // Thrown by Fetch
            if (isDOMExceptionError(error) && error.name === 'TimeoutError') {
                throw newLpMtlsError(ErrorCodes.Mtls.Timeout, `${error.name}: ${error.message}`);
            }

            if (isFetchTypeError(error)) {
                throw newLpMtlsError(ErrorCodes.Mtls.General, `${error.message}. Cause: ${error?.cause?.message}`);
            }

            throw newLpMtlsError(ErrorCodes.Mtls.General, isError(error) ? `${error.name}: ${error.message}` : 'unknown');
        }
    }

    private prepareHeader(url: string, shouldParseJson: boolean, authorization: string, originalHeader?: Record<string, string>): Record<string, string> {
        let credentials: string = '';

        for (const key in originalHeader) {
            if (Object.prototype.hasOwnProperty.call(originalHeader, key) && key.toLowerCase() === 'authorization') {
                credentials = originalHeader[key];
                delete originalHeader[key];
                break;
            }
        }

        const defaultHeaders = {
            'LP-stop-if-certificate-not-found': 'true',
            'LP-service-name': 'FAAS',
            'LP-forward-url': url,
            'X-Request-Id': getTraceId(),
            ...(shouldParseJson && { 'Content-Type': 'application/json' }),
            ...(credentials && { 'LP-authorization-override': credentials }),
        };

        return { ...defaultHeaders, ...originalHeader, ...{ Authorization: authorization } };
    }

    private prepareBody(body: BodyInit | Record<string, unknown>, isJson: boolean = false): BodyInit {
        if (isJson) {
            try {
                body = JSON.stringify(body);
            } catch (error) {
                throw newLpMtlsError(ErrorCodes.Mtls.BadRequest, 'Provided body could not be stringified');
            }
        }

        if (!isBodyInit(body)) {
            throw newLpMtlsError(
                ErrorCodes.Mtls.BadRequest,
                'Provided body was not string or or one the allowed types: ReadableStream, Blob, ArrayBuffer, ArrayBufferView FormData, URLSearchParams . Please use json option or stringify content prior to passing',
            );
        }

        return body;
    }

    /**
     * Constructs the proxyURL using the mtls domain and the accountID
     * @returns proxyUrl for calling LP MTLS
     */
    private async getMtlsProxyUrl(): Promise<string> {
        const host = await this.csdsClient.get('mtlsGateway');
        return `https://${host}/mtls/account/${process.env.X_LIVEPERSON_BRAND_ID}`;
    }

    private async getAuthorizationHeader(): Promise<string> {
        const oauth2Creds = await this.getAppKeyCredentials(DEFAULT_APP_KEY_SECRET_NAME);
        this.accessToken = await this.getAccessToken(oauth2Creds);
        const { access_token, token_type } = this.accessToken;
        return `${token_type} ${access_token}`;
    }
    private async getAppKeyCredentials(secretName: string, useCache: boolean = true): Promise<OAuth2ClientCreds> {
        try {
            const { value } = await this.secretClient.readSecret(secretName, { useCache });

            const creds = JSON.parse(value) as unknown;

            if (!isOAuth2ClientCreds(creds)) {
                throw newLpMtlsError(ErrorCodes.Mtls.Creds.Format, `Credentials have Invalid Format`);
            }
            return creds;
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }

            throw newLpMtlsError(ErrorCodes.Mtls.Creds.Failure, `Could not fetch App Key credentials from secret storage: ${isError(error) ? error.message : 'unknown error'}`);
        }
    }

    private async getAccessToken({ client_id, client_secret }: OAuth2ClientCreds, useCache: boolean = true): Promise<AccessTokenData> {
        if (this.accessToken !== undefined && !isAccessTokenExpired(this.accessToken) && useCache) {
            return this.accessToken;
        }

        return await this.oauth2Client.getAccessToken({ client_id, client_secret });
    }

    /**
     * Checks if lp-message-from-transport or www-authenticate is set indicating an issue occurred during MTLS processing
     * the request. Additional it checks for status codes that also indicate issues with processing.
     * @param response
     */
    private async checkIfProcessErrorOccurred(response: Response): Promise<void> {
        // Indicates Upstream returned non success code/failed
        const lpMessageFromTransport = response.headers.get('lp-message-from-transport');
        if (typeof lpMessageFromTransport === 'string') {
            const originalBody = await response.text();

            throw newLpMtlsError(ErrorCodes.Mtls.Remote, lpMessageFromTransport, originalBody);
        }

        // Indicates Auth with LP MTLS Failed
        const wwwAuthenticate = response.headers.get('www-authenticate');
        if (typeof wwwAuthenticate === 'string') {
            throw newLpMtlsError(ErrorCodes.Mtls.BadRequest, `Authentication to LP MTLS failed due to ${wwwAuthenticate}`);
        }

        if (response?.status === 400) {
            throw newLpMtlsError(ErrorCodes.Mtls.Missing, `It seems like there was no MTLS Configuration setup for the given forward URL. Please configure MTLS Mapping.`);
        }
    }
}
