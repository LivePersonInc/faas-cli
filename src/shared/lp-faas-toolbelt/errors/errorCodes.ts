export const ErrorCodes = {
    Platform: {
        Secret: {
            NoToken: 'com.liveperson.faas.handler.no-sa-token',
        },
    },
    Secret: {
        Invalid: 'com.liveperson.faas.secret.invalid-format',
        Failure: 'com.liveperson.faas.secret.op-failed',
        NotFound: 'com.liveperson.faas.secret.not-found',
        AuthFailure: 'com.liveperson.faas.secret.auth-failed',
    },
    Csds: {
        NotFound: 'com.liveperson.faas.csds.domain.not-found',
        Failure: 'com.liveperson.faas.csds.op-failed',
    },
};
