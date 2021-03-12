export class RestError extends Error {
    public statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }

    toString(): string {
        return `Rest Error: [${this.statusCode}] - ${this.message}`;
    }
}
