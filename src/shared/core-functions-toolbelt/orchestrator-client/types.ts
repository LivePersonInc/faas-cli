export type OrchestratorOptions = {
    /**
     * Request timeout for each invocation
     */
    timeout?: number;
    /**
     * Set this flag to true, to automatically stringify response body to json.
     */
    json?: boolean;
    /**
     * Defines the strategy to follow in case on error.
     */
    errorStrategy?: ErrorStrategy;
    /**
     * If true, it will execute all invocations in parallel
     */
    invokeParallel?: boolean;
};

export type RetryFunction = (statusCode?: number, error?: unknown) => boolean;

export type OrchestratorInvocation = {
    /**
     * function UUID
     */
    uuid: string;
    /**
     * Invocation headers
     */
    headers?: Record<string, string>;
    /**
     * Invocation Payload
     */
    payload: unknown;
    /**
     * Default 3
     */
    retries?: number;
    /**
     * This function is used to determine if a received status code/error should be retried or aborted.
     * The default tactic is to retry on 429 and 5xx. This excludes retries on errors raised by the function.
     */
    retryFunction?: RetryFunction;
};

export type OrchestratorResponse = {
    /**
     * function UUID that was invoked
     */
    uuid: string;
    /**
     * Response body, should be a JSON object or string
     */
    body?: unknown;
    /**
     * Response headers
     */
    headers?: Record<string, string>;
    /**
     * Status Code returned by the invoked function.
     */
    statusCode?: number;
    /**
     * If present will contain error code and message
     */
    error?: { code: string; message: string };
};

export enum ErrorStrategy {
    /**
     * Will throw an exception at the first invocation error canceling the rest of requests
     */
    EXIT_ON_ERROR = 'ExitOnError',
    /**
     * Errors will be ignored and send back in the orchestrator response array
     */
    CONTINUE_ON_ERROR = 'ContinueOnError',
}
