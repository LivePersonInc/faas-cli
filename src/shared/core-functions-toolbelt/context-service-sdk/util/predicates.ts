import { RestError } from '../types/errors/restError';
import { RETRIABLE_NETWORK_ERRORS, BUILT_IN_NAMESPACES } from './constants';

export function isNullOrUndefined(o: unknown): boolean {
    return o === null || o === undefined;
}

export function isEmptyString(s: string): boolean {
    return s === '';
}

export function isNotFoundError(e: unknown): boolean {
    if (e instanceof RestError) {
        return e.statusCode === 404;
    }

    return false;
}

export function isBuiltInNamespace(namespace: string): boolean {
    return BUILT_IN_NAMESPACES.includes(namespace);
}

type NetworkError = { code?: string; errno?: string };

export function isNetworkError(e: Record<string, unknown>): boolean {
    if (isNullOrUndefined(e)) {
        return false;
    }

    return typeof e.code === 'string' || typeof e.errno === 'string';
}

export function isRetriableError(e: Record<string, unknown>): boolean {
    if (isNullOrUndefined(e)) {
        return false;
    }

    if (isNetworkError(e)) {
        return RETRIABLE_NETWORK_ERRORS.includes((e as NetworkError).code || (e as NetworkError).errno);
    }

    return false;
}
