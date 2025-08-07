export interface ICache<K, V> {
    set(key: K, value: V, ttl?: number): void;
    get(key: K): V | null;
    clear(): void;
    delete(key: K): boolean;
    has(key: K): boolean;
    size(): number;
    setDefaultTtl(newTtl: number): void;
    getAll(): V[];
}
