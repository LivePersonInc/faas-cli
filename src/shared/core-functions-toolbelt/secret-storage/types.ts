export type SecretEntry = {
    /**
     * Key of the secret made of chars that match [A-z0-9-_] and limited to 100 chars,
     */
    key: string;
    /**
     * Value of the secret which is limited to 16384 chars.
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

// Stored secret contain a type property to ensure V1 to V2 transition
export type V1CompatSecretObject = {
    LP_COMPAT_SECRET_TYPE: string; // A string that indicates the Secret type e.g : String, Number, etc.. (For V2 is always string)
    secret: string; // The Secret value itself
};
