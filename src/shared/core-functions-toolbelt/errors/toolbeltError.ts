export class ToolBeltError extends Error {
    constructor(
        public component = 'General',
        public code: string,
        public message: string,
    ) {
        super(`${component}: ${message}`);
    }
}

export function makeSpecificError(component: string): (code: string, message: string) => ToolBeltError {
    return (code: string, message) => {
        return new ToolBeltError(component, code, message);
    };
}
