import type { LPMtlsOptions, LPMtlsResponse } from './types';

/**
 * Interface definition for the LP powered MTLS Service
 */
export interface ILpMtlsClient {
    /**
     * Perform a Get Call via the LP MTLS Service. Please make sure you performed the necessary onboarding and configuration
     * of domain <=> cert mappings before attempting to use the client.
     * @param url
     * @param headers
     * @param body
     * @param options Request specific options
     */
    get(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: LPMtlsOptions): Promise<LPMtlsResponse>;
    /**
     * Perform a Post Call via the LP MTLS Service. Please make sure you performed the necessary onboarding and configuration
     * of domain <=> cert mappings before attempting to use the client.
     * @param url
     * @param headers
     * @param body
     * @param options Request specific options
     */
    post(url: string, headers?: Record<string, string>, body?: BodyInit | Record<string, unknown>, options?: LPMtlsOptions): Promise<LPMtlsResponse>;
}
