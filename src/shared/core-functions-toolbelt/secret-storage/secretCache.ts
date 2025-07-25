import type { ICache } from './ICache.js';
import type { CacheEntry, CacheSettings } from './types.js';

const DEFAULT_CACHE_TTL = 1000 * 60 * 5;

export class SecretCache<K extends string, V> implements ICache<K, V> {
    private cache: Map<K, CacheEntry<V>>;
    private defaultTtl: number;
    constructor(options?: CacheSettings) {
        this.cache = new Map<K, CacheEntry<V>>();
        this.defaultTtl = options?.ttl || DEFAULT_CACHE_TTL;
    }

    // Sets a value in the cache with a timestamp and expiration
    set(key: K, value: V, ttl?: number): void {
        const timestamp = Date.now();
        const entryTtl = ttl ? ttl : this.defaultTtl;
        this.cache.set(key, { value, expiration: timestamp + entryTtl });
    }

    // Gets a value from the cache if it's not expired
    get(key: K): V | null {
        const entry = this.cache.get(key);
        if (entry) {
            const currentTime = Date.now();
            if (currentTime < entry.expiration) {
                return entry.value;
            } else {
                this.cache.delete(key); // Remove expired entry
            }
        }
        return null;
    }

    // Clears the cache
    clear(): void {
        this.cache.clear();
    }

    // Deletes a value from the cache
    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    // Checks if the cache has a key
    has(key: K): boolean {
        const entry = this.cache.get(key);
        if (entry === undefined) {
            return false;
        }

        const currentTime = Date.now();
        if (currentTime < entry.expiration) {
            return true;
        } else {
            this.cache.delete(key); // Remove expired entry
            return false;
        }
    }

    // Returns all entries of the cache irregardless of whether they are expired
    getAll(): V[] {
        return [...this.cache.values()].map(({ value }) => value);
    }

    // Returns the size of the cache
    size(): number {
        return this.cache.size;
    }
    /**
     * Sets the a new ttl from the default (5m)
     * @param newTtl new time to live in ms
     */
    setDefaultTtl(newTtl: number) {
        this.defaultTtl = newTtl;
    }
}
