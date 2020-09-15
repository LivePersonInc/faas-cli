export class NetworkError extends Error {
    public readonly code: string;

    constructor(code: string, message: string) {
        super(message);
        this.code = code;
    }

    toString(): string {
        return `Network Error: ${this.code} - ${this.message}`;
    }
}
