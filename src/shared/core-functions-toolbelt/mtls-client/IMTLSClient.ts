import type { MTLSOptions, MTLSResponse } from './types';

/**
 * Interface definition for the MTLS Client.
 */
export interface IMtlsClient {
    /**
     * Performing a MTLS get request using the configured client certificate + key
     * @param url
     * @param headers
     * @param body
     * @param options Request specific options
     */
    get(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: MTLSOptions): Promise<MTLSResponse>;
    /**
     * Performing a MTLS head request using the configured client certificate + key. Any body
     * returned by the endpoint will be ignored and forcefully overridden with undefined.
     * @param url
     * @param headers
     * @param options Request specific options
     */
    head(url: string, headers?: Record<string, string>, options?: MTLSOptions): Promise<MTLSResponse>;
    /**
     * Performing a MTLS post request using the configured client certificate + key.
     * @param url
     * @param headers
     * @param body
     * @param options Request specific options
     */
    post(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: MTLSOptions): Promise<MTLSResponse>;
    /**
     * Performing a MTLS put request using the configured client certificate + key.
     * @param url
     * @param headers
     * @param body
     * @param options Request specific options
     */
    put(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: MTLSOptions): Promise<MTLSResponse>;
    /**
     * Performing a MTLS delete request using the configured client certificate + key.
     * @param url
     * @param headers
     * @param body
     * @param options Request specific options
     */
    delete(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: MTLSOptions): Promise<MTLSResponse>;
    /**
     * Performing a MTLS options request using the configured client certificate + key. Any body
     * returned by the endpoint will be ignored and forcefully overridden with undefined.
     * @param url
     * @param headers
     * @param options Request specific options
     */
    options(url: string, headers?: Record<string, string>, options?: MTLSOptions): Promise<MTLSResponse>;
    /**
     * Performing a MTLS put request using the configured client certificate + key.
     * @param url
     * @param headers
     * @param body
     * @param options Request specific options
     */
    patch(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: MTLSOptions): Promise<MTLSResponse>;
}
