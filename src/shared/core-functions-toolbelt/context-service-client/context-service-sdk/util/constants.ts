/* eslint-disable @typescript-eslint/naming-convention */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DEFAULT_ENTITIY = '__default__';
export const TEN_SECONDS = 10 * 1000;
export const CALL_DELAY = 2 * 1000;
// Got list from here: https://lpgithub.dev.lprnd.net/Core-AI/lp-mavencontext-app/blob/master/src/models/constants.js
export const BUILT_IN_NAMESPACES = ['faas', 'consumer', 'custom', 'operational', 'conversation'];
export const RETRIABLE_NETWORK_ERRORS = [
    'ECONNRESET',
    'ENOTFOUND',
    'ESOCKETTIMEDOUT',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'EPIPE',
    'EAI_AGAIN',
];

/**
 * Domains for the Context Service API.
 * Please choose the domain based on the
 * location of your account.
 */
export const DOMAINS = {
    US: 'z1.context.liveperson.net',
    EMEA: 'z2.context.liveperson.net',
    APAC: 'z3.context.liveperson.net',
};

export const ErrorCodes = {
    General: {
        Issue: 'com.liveperson.context-service-sdk.internal-server-error',
        Unknown: 'com.liveperson.context-service-sdk.unknown',
        Timeout: 'com.liveperson.context-service-sdk.response-timeout',
    },
    Parameter: {
        Incorrect: 'com.liveperson.context-service-sdk.parameter.invalid',
    },
    Authorization: {
        Invalid: 'com.liveperson.context-service-sdk.authorization.invalid',
    },
    Data: {
        NotFound: 'com.liveperson.context-service-sdk.data.does-not-exist',
    },
};
