import type { CachedSecret, SecretClientOptions, SecretEntry, SecretRequestOptions } from './types.js';
import type { ISecretClient } from './IsecretClient.js';
import type { ICache } from './ICache.js';

import { makeSpecificError } from '../errors/toolbeltError.js';
import { ErrorCodes } from '../errors/errorCodes.js';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { isError, isGCPError, isToolbeltError } from '../shared/typesPredicates.js';
import { SYSTEM_SECRET_PREFIX } from '../shared/const.js';

const DEADLINE_EXCEEDED_CODE = 1;
const NOT_FOUND_CODE = 5;
const PERMISSION_ISSUE_CODE = 7;

const MAX_KEPT_VERSIONS = 2;

const newSecretClientError = makeSpecificError('SecretClient');
export const defaultSecretClientOptions: SecretClientOptions = {
    cache: {
        ttl: 5 * 60 * 1000,
    },
};

const defaultRequestOptions: SecretRequestOptions = {
    useCache: true,
    timeout: 5000,
};

const MAX_SECRET_SIZE = 16384;
export class FunctionsSecretClient implements ISecretClient {
    /**
     *
     * @param options used for configuring the secret client e.g. caching secrets
     */
    constructor(
        private readonly secretCache: ICache<string, CachedSecret>,
        private readonly gcpSecretManagerClient: SecretManagerServiceClient,

        private readonly options?: Partial<SecretClientOptions>,

        private readonly projectId = process.env.X_LIVEPERSON_PROJECT_ID,
    ) {
        if (this.options?.cache?.ttl) {
            this.secretCache.setDefaultTtl(this.options.cache.ttl);
        }
    }

    public async readSecret(key: string, options?: Partial<SecretRequestOptions>): Promise<SecretEntry> {
        const finalOptions: SecretRequestOptions = Object.assign({}, defaultRequestOptions, options);

        try {
            if (finalOptions.useCache && this.secretCache.has(key)) {
                const cached = this.secretCache.get(key)!;
                return { key, value: this.parseString(cached?.value) };
            }

            // see: https://cloud.google.com/secret-manager/docs/samples/secretmanager-access-secret-version?hl=en#secretmanager_access_secret_version-nodejs
            const [version] = await this.gcpSecretManagerClient.accessSecretVersion(
                { name: `projects/${this.projectId}/secrets/${key}/versions/latest` },
                { timeout: finalOptions.timeout },
            );

            const stringSecret = version?.payload?.data?.toString() ?? '';
            this.secretCache.set(key, { key, value: stringSecret });

            return { key, value: this.parseString(stringSecret) };
        } catch (error) {
            if (isGCPError(error)) {
                if (error.code === NOT_FOUND_CODE) {
                    throw newSecretClientError(ErrorCodes.Secret.NotFound, `There is no secret ${key} for this account`);
                }

                if (error.code === PERMISSION_ISSUE_CODE) {
                    throw newSecretClientError(ErrorCodes.Secret.AuthFailure, `Failed to authenticate with secret store for secret ${key}`);
                }

                if (error.code === DEADLINE_EXCEEDED_CODE) {
                    throw newSecretClientError(ErrorCodes.Secret.Timeout, `Failed to read secret ${key} within ${finalOptions.timeout}ms`);
                }
            }

            throw newSecretClientError(ErrorCodes.Secret.Failure, `Reading secret ${key} failed: ${isError(error) ? error.message : 'unknown'}`);
        }
    }

    public async updateSecret({ key: secretKey, value: newSecretValue }: SecretEntry, options?: Omit<SecretRequestOptions, 'useCache'>): Promise<SecretEntry> {
        const finalOptions: SecretRequestOptions = Object.assign({}, defaultRequestOptions, options);
        if (secretKey.startsWith(SYSTEM_SECRET_PREFIX)) {
            throw newSecretClientError(ErrorCodes.Secret.SystemSecret, 'You are not allowed to update secrets added by the system');
        }

        let stringifiedSecret = '';
        try {
            stringifiedSecret = JSON.stringify(newSecretValue);
        } catch (error) {
            // will throw if is BigInt or JSON has circular references
            throw newSecretClientError(ErrorCodes.Secret.Invalid, `Provided secret value cannot be stringified: ${isError(error) ? error.message : ''}`);
        }

        if (stringifiedSecret.length > MAX_SECRET_SIZE) {
            throw newSecretClientError(ErrorCodes.Secret.Invalid, 'Provided secret value exceeds allowed length of 16kb');
        }

        try {
            const parent = `projects/${this.projectId}/secrets/${secretKey}`;

            await this.gcpSecretManagerClient.addSecretVersion(
                {
                    parent,
                    payload: {
                        data: Buffer.from(stringifiedSecret, 'utf-8'),
                    },
                },
                { timeout: finalOptions.timeout },
            );

            this.secretCache.set(secretKey, { key: secretKey, value: stringifiedSecret });
            this.limitSecretVersionsInBackground(parent).catch((error) =>
                console.warn('Limiting secret versions threw error', { error: isError(error) ? `${error.name}: ${error.message}` : 'unknown' }),
            );

            return {
                key: secretKey,
                value: newSecretValue,
            };
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }

            if (isGCPError(error)) {
                if (error.code === NOT_FOUND_CODE) {
                    throw newSecretClientError(ErrorCodes.Secret.NotFound, `There is no secret ${secretKey} for this account`);
                }

                if (error.code === PERMISSION_ISSUE_CODE) {
                    throw newSecretClientError(ErrorCodes.Secret.AuthFailure, `Failed to authenticate with secret store for secret ${secretKey}`);
                }

                if (error.code === DEADLINE_EXCEEDED_CODE) {
                    throw newSecretClientError(ErrorCodes.Secret.Timeout, `Failed to read secret ${secretKey} within ${finalOptions.timeout}ms`);
                }
            }

            throw newSecretClientError(ErrorCodes.Secret.Failure, `Updating secret ${secretKey} failed: ${isError(error) ? error.message : 'unknown'}`);
        }
    }
    /**
     * Limit the secrets to the two latest versions
     * @param parent string for identifying secret
     */
    private async limitSecretVersionsInBackground(parent: string): Promise<void> {
        const [versions] = await this.gcpSecretManagerClient.listSecretVersions({
            parent,
            filter: 'state:ENABLED',
        });

        if (versions.length > MAX_KEPT_VERSIONS) {
            // Index 0 is the latest
            for (let i = 2; i < versions.length; i++) {
                const version = versions[i];
                await this.gcpSecretManagerClient.destroySecretVersion({ name: version.name, etag: version.etag });
            }
        }
    }

    private parseString(str: string): unknown {
        if (str === undefined || str === '') {
            return '';
        }

        try {
            return JSON.parse(str);
        } catch (error) {
            return str;
        }
    }
}
