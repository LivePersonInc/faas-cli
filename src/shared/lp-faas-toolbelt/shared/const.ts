export const Environment = {
    General: {
        Account: 'BRAND_ID',
        Lambda: 'LAMBDA_UUID',
    },
    Datacenter: {
        Domain: 'DOMAIN',
        Name: 'DC',
    },
    Proxy: {
        HTTPS: 'HTTPS_PROXY',
        HTTP: 'HTTP_PROXY',
        Exceptions: 'NO_PROXY',
    },
    Secrets: {
        VaultK8SMount: 'VAULT_K8S_MOUNT',
        VaultDomain: 'VAULT_DOMAIN',
        VaultServiceEnv: 'VAULT_SERVICE_ENV',
        VaultRole: 'VAULT_LAMBDA_ROLE',
    },
    Debug: {
        Watchdog: 'WATCHDOG_VERSION',
    },
    Node: { Modus: 'NODE_ENV' },
};

export const defaultAppKeySecretName = 'lp-faas-default-app-key';
