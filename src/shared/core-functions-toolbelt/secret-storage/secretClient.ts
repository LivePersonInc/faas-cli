import type {
  CachedSecret,
  SecretClientOptions,
  SecretEntry,
  SecretRequestOptions,
} from './types.js';
import type { ISecretClient } from './IsecretClient';
import type { ICache } from './ICache.js';

import { ErrorCodes } from '../errors/errorCodes';
import { join } from 'path';
import * as fsDefault from 'fs';
import { isError } from '../shared/typesPredicates';
import { SYSTEM_SECRET_PREFIX } from '../shared/const';
import { makeSpecificError } from '../errors/toolbeltError';

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
  private path: string;
  constructor(
    private readonly secretCache: ICache<string, CachedSecret>,

    private readonly options?: Partial<SecretClientOptions>,
    private readonly fs: typeof fsDefault = fsDefault,
  ) {
    this.path = join(process.cwd(), 'functions', 'settings.json');
    if (this.options?.cache?.ttl) {
      this.secretCache.setDefaultTtl(this.options.cache.ttl);
    }
  }

  public async readSecret(
    key: string,
    options?: Partial<SecretRequestOptions>,
  ): Promise<SecretEntry> {
    const finalOptions: SecretRequestOptions = Object.assign(
      {},
      defaultRequestOptions,
      options,
    );

    try {
      if (finalOptions.useCache && this.secretCache.has(key)) {
        const cached = this.secretCache.get(key);
        return cached;
      }

      const settingsString = await this.fs.readFileSync(this.path, 'utf8');
      const settings = JSON.parse(settingsString);
      const secret: SecretEntry = settings.secrets.find(
        (e: SecretEntry) => e.key === key,
      );

      if (!secret) {
        throw Error;
      }

      this.secretCache.set(secret.key, secret as CachedSecret);

      return { key: secret.key, value: secret.value };
    } catch (error) {
      throw newSecretClientError(
        ErrorCodes.Secret.NotFound,
        `There is no secret ${key} for this account`,
      );
    }
  }

  public async updateSecret({
    key: secretKey,
    value: newSecretValue,
  }: SecretEntry): Promise<SecretEntry> {
    if (secretKey.startsWith(SYSTEM_SECRET_PREFIX)) {
      throw newSecretClientError(
        ErrorCodes.Secret.SystemSecret,
        'You are not allowed to update secrets added by the system',
      );
    }

    let stringifiedSecret = '';
    try {
      stringifiedSecret = JSON.stringify(newSecretValue);
    } catch (error) {
      // will throw if is BigInt or JSON has circular references
      throw newSecretClientError(
        ErrorCodes.Secret.Invalid,
        `Provided secret value cannot be stringified: ${
          isError(error) ? error.message : ''
        }`,
      );
    }

    if (stringifiedSecret.length > MAX_SECRET_SIZE) {
      throw newSecretClientError(
        ErrorCodes.Secret.Invalid,
        'Provided secret value exceeds allowed length of 16kb',
      );
    }

    try {
      const settings = JSON.parse(this.fs.readFileSync(this.path, 'utf8'));
      const index = settings.secrets.findIndex(
        (e: SecretEntry) => e.key === secretKey,
      );

      if (index === -1) {
        throw Error('Secret not found!');
      }

      this.secretCache.set(secretKey, {
        key: secretKey,
        value: stringifiedSecret,
      });

      settings.secrets[index] = {
        key: secretKey,
        value: newSecretValue,
      };
      this.fs.writeFileSync(this.path, JSON.stringify(settings, null, 4));

      return {
        key: secretKey,
        value: JSON.parse(stringifiedSecret),
      };
    } catch (error) {
      throw newSecretClientError(
        ErrorCodes.Secret.Failure,
        `Updating secret ${secretKey} failed: ${
          isError(error) ? error.message : 'unknown'
        }`,
      );
    }
  }
}
