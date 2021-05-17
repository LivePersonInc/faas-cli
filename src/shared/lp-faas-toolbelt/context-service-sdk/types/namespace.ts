// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Namespace {
    name: string;
    createdAt: Date;
    ttlSecond?: number;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface NamespaceOptions {
    /**
     * Time to Live in seconds. If not provided/defined it will be permanent.
     */
    ttl?: number;
}
