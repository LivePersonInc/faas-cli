import { WellKnownLPServices } from '../lp-client/lpServices.js';

export interface ICsdsClient {
    /**
     * Get the host for a CSDS service name.
     * The CsdsClient will get all hosts for the account and cache them as configured in ttInSeconds (see constructor).
     * @param service
     */
    get(service: WellKnownLPServices | string): Promise<string>;

    /**
     * Returns all the available services domains per account
     */
    getAll(): Promise<Record<string, string>[]>;
}
