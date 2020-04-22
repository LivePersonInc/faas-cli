import { Connection, ConnectionOptions } from 'jsforce';
import { GenerateHeaders } from '../shared/headers-gen';

function injectRequiredOptions(currentOptions: any): any {
    let mergedOptions: any;

    if (process.env.HTTPS_PROXY) {
        mergedOptions = Object.assign({}, currentOptions, {
            rejectUnauthorized: false, // Currently there are issues with the HTTPS Cert
            tunnel: false, // For the Proxy Communication
            headers: {},
            proxy: process.env.HTTPS_PROXY || 'https://lp-faasproxy-web.faas',
            agentOptions: {
                secureProtocol: 'TLSv1_2_method',
            },
        });
    } else {
        mergedOptions = Object.assign({}, currentOptions, {
            rejectUnauthorized: false, // Currently there are issues with the HTTPS Cert
            headers: {},
            agentOptions: {
                secureProtocol: 'TLSv1_2_method',
            },
        });
    }

    mergedOptions.headers = Object.assign({}, currentOptions.headers, GenerateHeaders());
    return mergedOptions;
}

/**
 * ConnectToSalesforce creates a standard JSForce Connection object and preconfigures it
 * to allow it to communicate with the Proxy and send Requests in the correct format.
 * @param params Connection Options
 * @returns Salesforce Connection
 */
export function ConnectToSalesforce(params: ConnectionOptions): Connection {
    const con: any = new Connection(params);

    // Intercepting all outgoing HTTP Calls
    const originalTransport = con._transport.httpRequest.bind(con._transport);
    // Correcting the format of the HTTP Calls to satisfy the needs of our proxy
    con._transport.httpRequest = (request: any, options: any, cb: any) => {
        const newRequest = injectRequiredOptions(request);
        return originalTransport(newRequest, options, cb);
    };

    return con;
}
