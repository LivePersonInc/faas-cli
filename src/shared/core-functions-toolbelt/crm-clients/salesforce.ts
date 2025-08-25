type Connection = {};
type ConnectionConfig = {
  version?: string;
  loginUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
  sessionId?: string;
  serverUrl?: string;
  signedRequest?: string;
  oauth2?: unknown;
  maxRequest?: number;
  proxyUrl?: string;
  httpProxy?: string;
  logLevel?: unknown;
  callOptions?: {
    [name: string]: string;
  };
  refreshFn?: unknown;
};
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
export function ConnectToSalesforce(params: ConnectionConfig): Connection {
  return { params } as unknown as Connection;
}
