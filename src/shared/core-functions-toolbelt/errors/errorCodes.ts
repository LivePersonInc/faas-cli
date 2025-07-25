export const ErrorCodes = {
    Platform: {
        Secret: {
            NoToken: 'com.liveperson.faas.handler.no-sa-token',
        },
    },
    Secret: {
        Invalid: 'com.liveperson.faas.secret.invalid-format',
        Failure: 'com.liveperson.faas.secret.op-failed',
        Timeout: 'com.liveperson.faas.secret.op-timed-out',
        NotFound: 'com.liveperson.faas.secret.not-found',
        AuthFailure: 'com.liveperson.faas.secret.auth-failed',
        SystemSecret: 'com.liveperson.faas.secret.forbidden',
    },
    Csds: {
        NotFound: 'com.liveperson.faas.csds.domain.not-found',
        Failure: 'com.liveperson.faas.csds.op-failed',
    },
    Mtls: {
        General: 'com.liveperson.faas.mtls.general-issue',
        Remote: 'com.liveperson.faas.mtls.remote-threw',
        Missing: 'com.liveperson.faas.mtls.missing-conf',
        Invalid: {
            Key: 'com.liveperson.faas.mtls.invalid-key',
            Cert: 'com.liveperson.faas.mtls.invalid-cert',
        },
        BadRequest: 'com.liveperson.faas.mtls.invalid-request',
        Creds: {
            Format: 'com.liveperson.faas.lp-mtls.credentials-wrong-format',
            Failure: 'com.liveperson.faas.lp-mtls.get-credentials-failure',
        },
        Timeout: 'com.liveperson.faas.mtls.request-timeout',
    },
    OAuth2: {
        General: 'com.liveperson.faas.oauth2.general-issue',
        UnexpectedResponse: 'com.liveperson.faas.oauth2.unexpected-response',
    },
    LpClient: {
        Creds: {
            Format: 'com.liveperson.faas.lp-client.credentials-wrong-format',
            Failure: 'com.liveperson.faas.lp-client.get-credentials-failure',
        },
    },
    ConversationUtil: {
        General: 'com.liveperson.faas.conversation-util-general',
        NotFound: 'com.liveperson.faas.conversation-util.conversation.not-found',
        UnexpectedResponse: 'com.liveperson.faas.conversation-util.unexpected-response',
        Timeout: 'com.liveperson.faas.conversation-util.timeout',
    },
    GDPRUtil: {
        General: 'com.liveperson.faas.gdpr-util-general',
        AuthFailure: 'com.liveperson.faas.gdpr-util.auth-failed',
        ReplaceFileFailed: 'com.liveperson.faas.gdpr-util.replace-file-failed',
    },
    SDEsUtil: {
        General: 'com.liveperson.faas.sdes-util-general',
        UnexpectedResponse: 'com.liveperson.faas.sdes-util.unexpected-response',
    },
    OrchestratorFN: {
        General: 'com.liveperson.faas.orchestrator-fn-general',
        Timeout: 'com.liveperson.faas.orchestrator-fn.invoke.timeout',
        Invocation: {
            StatusError: 'com.liveperson.faas.orchestrator-fn.invoke.status-code-error',
        },
        Creds: {
            Format: 'com.liveperson.faas.orchestrator-fn.credentials-wrong-format',
            Failure: 'com.liveperson.faas.orchestrator-fn.get-credentials-failure',
        },
    },
};
