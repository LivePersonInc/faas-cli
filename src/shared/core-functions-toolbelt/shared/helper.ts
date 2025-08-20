import { randomUUID } from 'node:crypto';

/**
 *  This function will convert the Fetch response headers to more human readable object
 * @param headers
 * @returns
 */
export function transformFetchResponseHeaders(headers: Headers): Record<string, string> {
    const responseHeaders: Record<string, string> = {};

    const keys = headers.keys();
    let headerName: IteratorResult<string | undefined> = keys.next();

    while (headerName.value !== undefined && typeof headerName.value == 'string') {
        const headerValue = headers.get(headerName.value);

        if (headerValue !== null && typeof headerValue === 'string') {
            responseHeaders[headerName.value] = headerValue;
        }

        headerName = keys.next();
    }
    return responseHeaders;
}

export type LpConsole = Console & { getTraceId: () => string };
export function getTraceId(): string {
    return (console as LpConsole).getTraceId() || randomUUID();
}
