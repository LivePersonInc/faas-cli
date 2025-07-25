import { ToolBeltError } from './toolbeltError.js';

/**
 * MTLS Error are usually raised by the MTLS Client directly and
 * are not related to the response of the called endpoint.
 */
export class MTLSError extends ToolBeltError {
    constructor(
        public component: string,
        public code: string,
        public message: string,
        public originalBody?: string,
    ) {
        super(component, code, message);
    }
}

export function makeSpecificMTLSError(component: 'MTLS' | 'LP-MTLS'): (code: string, message: string, originalBody?: string) => ToolBeltError {
    return (code: string, message, originalBody) => {
        return new MTLSError(component, code, message, originalBody);
    };
}
