import { ErrorStrategy, type OrchestratorInvocation, type OrchestratorOptions, type OrchestratorResponse } from './types.js';
import type { ICsdsClient } from '../csds-client/ICsdsClient.js';
import type { IOAuth2Client } from '../oauth2-client/IOauth2Client.js';
import type { AccessTokenData, OAuth2ClientCreds } from '../oauth2-client/types.js';
import type { ISecretClient } from '../secret-storage/IsecretClient.js';
import type { IOrchestratorClient } from './IOrchestratorClient.js';
import { ErrorCodes } from '../errors/errorCodes.js';
import { isDOMExceptionError, isError, isFetchTypeError, isOAuth2ClientCreds, isOrchestratorErrorWithStatusCode, isToolbeltError } from '../shared/typesPredicates.js';
import { isAccessTokenExpired } from '../oauth2-client/oauth2Client.js';
import { format as createUrl } from 'url';
import { makeSpecificOrchestratorError } from '../errors/orchestratorError.js';
import { getTraceId, transformFetchResponseHeaders } from '../shared/helper.js';
import { DEFAULT_APP_KEY_SECRET_NAME } from '../shared/const.js';

const newOrchestratorError = makeSpecificOrchestratorError();

const MAX_DEADLINE_TIME = 25000;
const RETRIES = 3;

const RETRIABLE_NETWORK_ERRORS = ['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'ESOCKETTIMEDOUT'];
const RETRIABLE_ERROR_CODES = [500, 502, 504, 429];

const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export class OrchestratorClient implements IOrchestratorClient {
    private accessToken!: AccessTokenData;

    constructor(
        private csdsClient: ICsdsClient,
        private secretClient: ISecretClient,
        private oauth2Client: IOAuth2Client,

        private httpClient = fetch,
        private accountId = process.env.X_LIVEPERSON_BRAND_ID,
    ) {}

    public async invoke(invocations: OrchestratorInvocation[], deadline = MAX_DEADLINE_TIME, options?: OrchestratorOptions): Promise<OrchestratorResponse[]> {
        if (deadline > MAX_DEADLINE_TIME) {
            deadline = MAX_DEADLINE_TIME;
            console.warn(`Deadline exceeds maximum allowed value, ${MAX_DEADLINE_TIME}ms will be used instead`);
        }

        const finalOptions = this.getFinalOptions(invocations.length, deadline, options);

        let timer;

        const deadlineInvocation = new Promise(
            (_, reject) =>
                (timer = setTimeout(reject, deadline, newOrchestratorError(ErrorCodes.OrchestratorFN.Timeout, `Invocations timed out after a deadline of ${deadline} ms`))),
        );

        try {
            const result = await Promise.race([this.invocationTask(invocations, finalOptions), deadlineInvocation]);
            return result as Promise<OrchestratorResponse[]>;
        } finally {
            clearTimeout(timer);
        }
    }

    private getFinalOptions(totalInvocations: number, deadline: number, options?: OrchestratorOptions): OrchestratorOptions {
        const defaultInvocationTimeout = Math.floor(deadline / totalInvocations);

        const defaultOptions = {
            invokeParallel: false,
            errorStrategy: ErrorStrategy.EXIT_ON_ERROR,
            timeout: defaultInvocationTimeout,
        };
        const finalOptions = Object.assign(defaultOptions, options);

        if (this.isTimeoutExceedingDeadline(finalOptions.timeout, deadline, totalInvocations)) {
            finalOptions.timeout = defaultInvocationTimeout;
            console.warn(`The invocation timeout exceeds the deadline, the value of ${defaultInvocationTimeout} ms will be used`);
        }

        return finalOptions;
    }

    private isTimeoutExceedingDeadline(timeout: number, deadline: number, totalInvocations: number): boolean {
        return timeout * totalInvocations > deadline;
    }

    private async invocationTask(invocations: OrchestratorInvocation[], options: OrchestratorOptions): Promise<OrchestratorResponse[]> {
        const responses = [];
        const promises = [];
        for (const invocation of invocations) {
            if (options.invokeParallel) {
                promises.push(this.doInvokeRequest(invocation, options));
            } else {
                const { statusCode, body, headers, error } = await this.doInvokeRequest(invocation, options);
                responses.push({ uuid: invocation.uuid, body, headers, statusCode, error });
            }
        }

        if (promises.length > 0) {
            return await Promise.all(promises);
        }

        return responses;
    }
    private async doInvokeRequest(invocation: OrchestratorInvocation, options: OrchestratorOptions, attempt = 1): Promise<OrchestratorResponse> {
        const host = await this.csdsClient.get('faasGW'); // csds has is own cache

        if (!invocation.retries) {
            invocation.retries = RETRIES;
        }

        if (!invocation.retryFunction) {
            invocation.retryFunction = (statusCode?: number, error?: unknown): boolean => {
                if (statusCode !== undefined) {
                    return RETRIABLE_ERROR_CODES.includes(statusCode);
                }
                if (error !== undefined && isFetchTypeError(error)) {
                    return RETRIABLE_NETWORK_ERRORS.includes(error.cause.code);
                }

                return isDOMExceptionError(error) && error.name === 'TimeoutError';
            };
        }

        const url = this.getURL(host, invocation);
        const method = 'POST';
        const body = {
            timestamp: Date.now(),
            payload: invocation.payload,
            headers: invocation.headers ? Object.entries(invocation.headers).map(([key, value]) => ({ key, value })) : [],
        };

        try {
            const requestOptions: RequestInit = {
                method,
                headers: {
                    authorization: await this.getAuthorizationHeader(),
                    'X-Request-Id': getTraceId(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: options?.timeout !== undefined ? AbortSignal.timeout(options.timeout) : null,
            };
            const response = await this.httpClient(url, requestOptions);

            const responseBody = await response.text();
            const responseHeaders = transformFetchResponseHeaders(response.headers);

            if (!response.ok) {
                throw newOrchestratorError(
                    ErrorCodes.OrchestratorFN.Invocation.StatusError,
                    'Invocation failed with a non 2XX error',
                    response.status,
                    responseBody,
                    responseHeaders,
                );
            }

            const orchestratorResponse: OrchestratorResponse = {
                uuid: invocation.uuid,
                body: responseBody,
                headers: responseHeaders,
                statusCode: response.status,
            };

            if (options.json) {
                try {
                    orchestratorResponse.body = JSON.parse(responseBody);
                } catch (err) {
                    // Return just text by default
                }
            }

            return orchestratorResponse;
        } catch (error) {
            const willRetry = attempt === invocation.retries ? false : invocation.retryFunction(isOrchestratorErrorWithStatusCode(error) ? error.statusCode : undefined, error);

            if (!willRetry) {
                if (options.errorStrategy === ErrorStrategy.EXIT_ON_ERROR) {
                    throw error;
                }

                const response: OrchestratorResponse = {
                    uuid: invocation.uuid,
                };

                if (isOrchestratorErrorWithStatusCode(error)) {
                    response.body = error.originalError;
                    response.headers = error.headers;
                    response.statusCode = error.statusCode;
                    response.error = {
                        code: error.code,
                        message: error.message,
                    };

                    return response;
                }

                if (isFetchTypeError(error)) {
                    response.error = {
                        code: error.cause.code,
                        message: error.cause.message,
                    };
                    return response;
                }

                // Includes Fetch timeout errors
                if (isDOMExceptionError(error)) {
                    response.error = {
                        code: error.name,
                        message: error.message,
                    };
                    return response;
                }

                response.body = error;
                response.error = {
                    code: 'Unknown Error',
                    message: isError(error) ? error.message : 'unknown',
                };

                return response;
            }

            await sleep(attempt * 100);
            return this.doInvokeRequest(invocation, options, attempt + 1);
        }
    }

    private async getAuthorizationHeader(): Promise<string> {
        const oauth2Creds = await this.getAppKeyCredentials(DEFAULT_APP_KEY_SECRET_NAME);
        this.accessToken = await this.getAccessToken(oauth2Creds);
        const { access_token, token_type } = this.accessToken;
        return `${token_type} ${access_token}`;
    }
    private async getAppKeyCredentials(secretName: string, useCache: boolean = true): Promise<OAuth2ClientCreds> {
        try {
            const { value } = await this.secretClient.readSecret(secretName, { useCache }); // Creds are parsed in secretClient

            if (!isOAuth2ClientCreds(value)) {
                throw newOrchestratorError(ErrorCodes.OrchestratorFN.Creds.Format, `Credentials have Invalid Format`);
            }
            return value;
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }

            throw newOrchestratorError(
                ErrorCodes.Mtls.Creds.Failure,
                `Could not fetch App Key credentials from secret storage: ${isError(error) ? error.message : 'unknown error'}`,
            );
        }
    }

    private async getAccessToken({ client_id, client_secret }: OAuth2ClientCreds, useCache: boolean = true): Promise<AccessTokenData> {
        if (this.accessToken !== undefined && !isAccessTokenExpired(this.accessToken) && useCache) {
            return this.accessToken;
        }

        return await this.oauth2Client.getAccessToken({ client_id, client_secret });
    }

    private getURL(domain: string, invocation: OrchestratorInvocation): string {
        const query = {
            v: 1,
            externalSystem: `${invocation.uuid}_${this.accountId}}`,
        };

        return createUrl({
            protocol: 'https',
            hostname: domain,
            pathname: `api/account/${this.accountId}/lambdas/${invocation.uuid}/invoke`,
            query,
        });
    }
}
