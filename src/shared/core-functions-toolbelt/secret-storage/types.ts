export type SecretEntry = {
    /**
     * Key of the secret made of chars that match [A-z0-9-_] and limited to 100 chars,
     */
    key: string;
    /**
     * Value of the secret which is limited to 16384 chars. IF the value cannot be parsed it will be string.
     */
    value: unknown;
};

/**
 * This type is used internally
 */
export type CachedSecret = {
    /**
     * Key of the secret made of chars that match [A-z0-9-_] and limited to 100 chars,
     */
    key: string;
    /**
     * The stringified Value of the secret which is limited to 16384 chars.
     */
    value: string;
};

export type SecretClientOptions = {
    cache: CacheSettings;
};

export type SecretRequestOptions = {
    /**
     * use cache for
     */
    useCache: boolean;
    /**
     * timeout for request in ms, default: 5 minutes
     */
    timeout: number;
};

export type CacheEntry<V> = {
    value: V;
    /** timestamp + ttl */
    expiration: number;
};

export type CacheSettings = {
    ttl?: number;
};
