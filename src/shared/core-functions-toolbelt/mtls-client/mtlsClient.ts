import type { ClientTLS, MTLSOptions, MTLSResponse } from './types';
import type { IMtlsClient } from './IMTLSClient';

import { ErrorCodes } from '../errors/errorCodes.js';
import { isError, isFetchTypeError, isToolbeltError, isBodyInit, isDOMExceptionError } from '../shared/typesPredicates.js';
import { Agent } from 'undici'; // Fetch belongs to Node Undici lib
import { getTraceId, transformFetchResponseHeaders } from '../shared/helper.js';
import { makeSpecificMTLSError } from '../errors/mtlsError.js';

const newMtlsError = makeSpecificMTLSError('MTLS');

export class MTLSClient implements IMtlsClient {
    /**
     * Constructor of MTLSClient which takes in a ClientTLS config.
     * It also performs a rough validation of the shape.
     *
     * @param clientTLS make sure that the certificates and key are in PEM format.
     */
    constructor(
        private clientTLS: ClientTLS,
        private httpClient = fetch,
    ) {
        if (clientTLS === undefined || clientTLS === null) {
            throw newMtlsError(ErrorCodes.Mtls.Missing, 'No Client TLS config was provided');
        }

        const { cert, key, ca } = clientTLS;
        if (!this.isRightlyShapedCert(Buffer.isBuffer(cert) ? cert.toString() : cert)) {
            throw newMtlsError(ErrorCodes.Mtls.Invalid.Cert, 'Provided cert is not rightly shaped. Please check cert format');
        }

        if (ca && !this.isRightlyShapedCert(Buffer.isBuffer(ca) ? ca.toString() : ca)) {
            throw newMtlsError(ErrorCodes.Mtls.Invalid.Cert, 'Provided ca-cert is not rightly shaped. Please check ca-cert format');
        }

        if (!this.isRightlyShapedKey(Buffer.isBuffer(key) ? key.toString() : key)) {
            throw newMtlsError(ErrorCodes.Mtls.Invalid.Key, 'Provided key is not rightly shaped. Please check key format');
        }
    }
    public async get(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: MTLSOptions): Promise<MTLSResponse> {
        return await this.makeRequest('GET', url, headers, body, options);
    }
    public async head(url: string, headers?: Record<string, string>, options?: MTLSOptions): Promise<MTLSResponse> {
        const response = await this.makeRequest('HEAD', url, headers, undefined, options);
        return Object.assign(response, { body: undefined }); // Ignoring Body as described here: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD    }
    }
    public async post(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: MTLSOptions): Promise<MTLSResponse> {
        return await this.makeRequest('POST', url, headers, body, options);
    }
    public async put(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: MTLSOptions): Promise<MTLSResponse> {
        return await this.makeRequest('PUT', url, headers, body, options);
    }
    public async delete(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: MTLSOptions): Promise<MTLSResponse> {
        return await this.makeRequest('DELETE', url, headers, body, options);
    }
    public async options(url: string, headers?: Record<string, string>, options?: MTLSOptions): Promise<MTLSResponse> {
        const response = await this.makeRequest('OPTIONS', url, headers, undefined, options);
        return Object.assign(response, { body: undefined }); // Ignoring Body based on main task: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS
    }
    public async patch(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: MTLSOptions): Promise<MTLSResponse> {
        return await this.makeRequest('PATCH', url, headers, body, options);
    }

    /**
     * Internal method performing the whole heavy lifting. Right now most of the complex tasks are handled by request-promise.
     * Only exception being json flag and selfSigned. Those are performed here to avoid issues in the future when moving away.
     * @param method
     * @param url
     * @param headers
     * @param body
     * @param options
     */
    private async makeRequest(
        method: string,
        url: string,
        headers?: Record<string, string>,
        body?: BodyInit | Record<string, unknown>,
        options?: MTLSOptions,
    ): Promise<MTLSResponse> {
        try {
            const shouldParseJson = options?.json || false;

            if (shouldParseJson) {
                headers = { ...headers, 'Content-Type': 'application/json', 'X-Request-Id': getTraceId() };
            }

            const baseConfig = {
                dispatcher: new Agent({
                    connect: {
                        cert: this.clientTLS.cert,
                        key: this.clientTLS.key,
                        ca: this.clientTLS.ca,
                        rejectUnauthorized: options?.allowSelfSigned === false ? true : false,
                    },
                }),
                method,
                headers,
                body: body !== null && body !== undefined ? this.prepareBody(body, shouldParseJson) : undefined,
                signal: options?.timeout !== undefined ? AbortSignal.timeout(options.timeout) : null,
            };

            const response = await this.httpClient(url, baseConfig);

            const responseHeaders = transformFetchResponseHeaders(response.headers);
            const responseBody = await response.text();

            const mtlsResponse: MTLSResponse = {
                statusCode: response.status,
                body: responseBody,
                headers: responseHeaders,
            };

            if (shouldParseJson) {
                try {
                    // cannot do: await response.json(), in case failure, response object will get broken and we cannot call response.text(): it will throw: "Body is unusable"
                    mtlsResponse.body = JSON.parse(responseBody);
                } catch (error) {
                    // Will simply return raw body
                }
            }

            return mtlsResponse;
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }

            if (isDOMExceptionError(error) && error.name === 'TimeoutError') {
                throw newMtlsError(ErrorCodes.Mtls.Timeout, `${error.name}: ${error.message}`);
            }

            if (isFetchTypeError(error)) {
                throw newMtlsError(ErrorCodes.Mtls.General, `${error.message}. Cause: ${error?.cause?.message}`);
            }

            throw newMtlsError(ErrorCodes.Mtls.General, isError(error) ? `${error.name}: ${error.message}` : 'unknown');
        }
    }

    /**
     * Checks if the provide cert starts with the expected header and ends with the expected footer
     * @param cert
     */
    private isRightlyShapedCert(cert: string): boolean {
        const EXPECTED_HEADER = '-----BEGIN';
        const EXPECTED_FOOTER = '-----END';

        if (!cert.includes(EXPECTED_HEADER)) {
            return false;
        }
        if (!cert.includes(EXPECTED_FOOTER)) {
            return false;
        }
        return cert.includes('\n');
    }

    /**
     * Checks if the provided key starts with the expected header and ends with the expected footer
     * @param key
     */
    private isRightlyShapedKey(key: string): boolean {
        const EXPECTED_HEADER = '-----BEGIN';
        const EXPECTED_FOOTER = '-----END';

        if (!key.includes(EXPECTED_HEADER)) {
            return false;
        }
        if (!key.includes(EXPECTED_FOOTER)) {
            return false;
        }
        return key.includes('\n');
    }

    private prepareBody(body: BodyInit | Record<string, unknown>, isJson: boolean = false): BodyInit {
        if (isJson) {
            try {
                body = JSON.stringify(body);
            } catch (error) {
                throw newMtlsError(ErrorCodes.Mtls.BadRequest, 'Provided body could not be stringified');
            }
        }

        if (!isBodyInit(body)) {
            throw newMtlsError(
                ErrorCodes.Mtls.BadRequest,
                'Provided body was not string or or one the allowed types: ReadableStream, Blob, ArrayBuffer, ArrayBufferView FormData, URLSearchParams . Please use json option or stringify content prior to passing',
            );
        }

        return body;
    }
}
