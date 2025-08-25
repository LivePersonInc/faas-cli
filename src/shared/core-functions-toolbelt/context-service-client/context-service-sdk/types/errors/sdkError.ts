import { RestError } from './restError';
import { ErrorCodes } from '../../util/constants';
import { NetworkError } from './networkError';

export class SDKError extends Error {
    public readonly code: string;

    constructor(code: string, message: string) {
        super(message);
        this.code = code;
    }

    toString(): string {
        return `SDKError: ${this.code} ${this.message}`;
    }

    static from(error: unknown): SDKError {
        // No need for rewrapping
        if (error instanceof SDKError) {
            return error;
        }

        if (error instanceof RestError) {
            return mapRestErrorToSDKError(error);
        }

        if (error instanceof NetworkError) {
            return new SDKError(error.code, error.message);
        }

        if (error instanceof Error) {
            return new SDKError(ErrorCodes.General.Unknown, error.message);
        }

        return new SDKError(ErrorCodes.General.Unknown, 'Unknown Error occurred');
    }
}

function mapRestErrorToSDKError(error: RestError): SDKError {
    switch (error.statusCode) {
        case 403:
            return new SDKError(ErrorCodes.Authorization.Invalid, 'Provided API Key is either invalid or lacks permission');
        case 404:
            return new SDKError(ErrorCodes.Data.NotFound, 'Requested Resource does not exist');
        case 500:
        case 503:
            return new SDKError(ErrorCodes.General.Issue, 'Internal Server Error occurred during processing request');
        default:
            return new SDKError(ErrorCodes.General.Unknown, `Unknown Error ${error.message} occurred`);
    }
}
