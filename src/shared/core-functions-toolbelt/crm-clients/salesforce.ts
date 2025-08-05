import type { ConnectionOptions } from './types';
import pkg from 'jsforce';

const { Connection } = pkg;

/**
 * ConnectToSalesforce creates a standard JSForce Connection object and preconfigures it
 * to allow it to communicate and send Requests in the correct format.
 *
 * @param {ConnectionOptions} params
 * @returns Salesforce {Connection}
 *
 * ### Example
 * ```ts
 *     ConnectToSalesforce({loginUrl:'https://test.salesforce.com',accessToken:'secret',refreshToken:'secret'})
 * ```
 */
export function ConnectToSalesforce(params: ConnectionOptions) {
  return new Connection(params);
}
