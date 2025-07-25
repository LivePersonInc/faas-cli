import { ToolBeltError } from './toolbeltError.js';

/**
 * Orchestrator Fn Error raised by the Function Orchestrator Client directly and
 * can be related to the response of the invocation endpoint in some cases.
 */
export class OrchestratorError extends ToolBeltError {
    constructor(
        public component: string,
        public code: string,
        public message: string,
        public statusCode?: number,
        public originalError?: unknown,
        public headers?: Record<string, string>,
    ) {
        super(component, code, message);
    }
}

export function makeSpecificOrchestratorError(
    component = 'Orchestrator-FN',
): (code: string, message: string, statusCode?: number, originalError?: string, headers?: Record<string, string>) => ToolBeltError {
    return (code: string, message, statusCode, originalError, headers) => {
        return new OrchestratorError(component, code, message, statusCode, originalError, headers);
    };
}
