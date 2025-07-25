/**
 * Options specific to MTLS requests.
 */
export type MTLSOptions = {
    /**
     * Time in ms until request should timeout. Please be aware that MTLS call take longer then regular http calls.
     */
    timeout?: number;
    /**
     * Set this flag to true, to automatically stringify body + set correct content header. And parse response to json.
     */
    json?: boolean;
    /**
     * To ignore errors raised by self-signed certificates on the called endpoint.
     * Alternative to this is providing the ca-cert as part of the clientTLS config.
     */
    allowSelfSigned?: boolean;
};

export type ClientTLS = {
    /**
     * Certificate of the CA, this is relevant when endpoint that is called
     * has an self-signed certificate. The certificate needs to be in PEM format.
     */
    ca?: string | Buffer;
    /**
     * CLient Certificate in PEM format.
     */
    cert: string | Buffer;
    /**
     * Client Key in PEM format.
     */
    key: string | Buffer;
};

export type MTLSResponse = {
    /**
     * Status Code returned by Server.
     */
    statusCode: number;
    /**
     * Response Headers.
     */
    headers: Record<string, string>;
    /**
     * Body if present. This usually is a string, when not using json flag.
     * If the json flag is true, it will attempt to JSON.parse it. If that
     * fails the original body will returned in string format.
     */
    body?: unknown;
};

export type LPMtlsResponse = {
    statusCode: number;
    body: unknown;
    headers: Record<string, string>;
};

/**
 * Options specific to MTLS requests.
 */
export type LPMtlsOptions = {
    /**
     * Time in ms until request should timeout. Please be aware that MTLS call take longer then regular http calls.
     */
    timeout?: number;
    /**
     * Set this flag to true, to automatically stringify body + set correct content header. And parse response to json.
     */
    json?: boolean;
};
