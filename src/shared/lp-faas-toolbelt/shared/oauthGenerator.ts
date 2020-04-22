const oauth = require('oauth-1.0a');
const crypto = require('crypto');
import { IOauthConsumerCreds } from './IOauthConsumerCreds';
import { IOauthTokenCreds } from './IOauthTokenCreds';

/**
 * Returns a new OAuth Client, which is configured based on the provided oauthConsumerCreds.
 * @param oauthConsumerCreds needed to configure the client
 */
function createOauthClient({ consumerKey: key, consumerSecret: secret }: IOauthConsumerCreds): any {
    const oauthClient = oauth({
        consumer: {
            key,
            secret,
        },
        signature_method: 'HMAC-SHA1',
        hash_function(baseString, hmacKey) {
            return crypto
                .createHmac('sha1', hmacKey)
                .update(baseString)
                .digest('base64');
        },
    });

    return oauthClient;
}

/**
 * Returns a new OAuth-header, which which can be used for HTTP-request authentication
 * @param oauthClient initialized OAuth-Client which creates the header
 * @param oauthTokenCreds needed for header creation
 * @param request the request to generate the OAuth-Header for
 */
function createOauthHeader(oauthClient: any, { token: key, tokenSecret: secret }: IOauthTokenCreds, request: any): any {
    const token = {
        key,
        secret,
    };

    return oauthClient.toHeader(oauthClient.authorize(request, token));
}

export { createOauthClient, createOauthHeader };
