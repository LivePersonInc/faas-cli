import { ISecretClient } from './IsecretClient';
import { ErrorCodes } from '../errors/errorCodes';
import { join } from 'path';
import * as fsDefault from 'fs-extra';
import {
  SecretClientOptions,
  SecretEntry,
  SecretRequestOptions,
} from './types';
import { makeSpecificError } from '../errors/toolbeltError';
import { ICache } from './ICache';
import { MAX_SECRET_SIZE, SYSTEM_SECRET_PREFIX } from '../shared/const';

const newSecretError = makeSpecificError('SecretStore');
export const defaultSecretClientOptions: SecretClientOptions = {
  cache: {
    ttl: 5 * 60 * 1000,
  },
};

const defaultRequestOptions: SecretRequestOptions = {
  useCache: true,
  timeout: 5000,
};

export class FunctionsSecretClient implements ISecretClient {
  private path: string;

  constructor(
    private readonly secretCache: ICache<string, SecretEntry>,

    private readonly options?: Partial<SecretClientOptions>,

    private fs: any = fsDefault,
  ) {
    this.path = join(process.cwd(), 'functions', 'settings.json');
    if (this.options?.cache?.ttl) {
      this.secretCache.setDefaultTtl(this.options.cache.ttl);
    }
  }

  readSecret(
    key: string,
    options?: Partial<SecretRequestOptions>,
  ): Promise<SecretEntry> {
    const finalOptions: SecretRequestOptions = Object.assign(
      {},
      defaultRequestOptions,
      options,
    );

    return new Promise((resolve, reject) => {
      try {
        if (finalOptions.useCache && this.secretCache.has(key)) {
          resolve(this.secretCache.get(key) as SecretEntry);
        } else {
          const settings = JSON.parse(this.fs.readFileSync(this.path, 'utf8'));
          const secret = settings.secrets.find(
            (e: SecretEntry) => e.key === key,
          );
          if (!secret) {
            throw Error;
          }
          this.secretCache.set(key, { key, value: secret });
          resolve(secret);
        }
      } catch (err) {
        reject(
          newSecretError(
            ErrorCodes.Secret.NotFound,
            `There is no Secret ${key} for this account`,
          ),
        );
      }
    });
  }

  updateSecret({
    key: secretKey,
    value: newSecretValue,
  }: SecretEntry): Promise<SecretEntry> {
    return new Promise((resolve, reject) => {
      try {
        if (secretKey.startsWith(SYSTEM_SECRET_PREFIX)) {
          throw newSecretError(
            ErrorCodes.Secret.SystemSecret,
            'You are not allowed to update secrets added by the system',
          );
        }

        if (typeof newSecretValue !== 'string') {
          throw newSecretError(
            ErrorCodes.Secret.Invalid,
            'Provided secret value must be of type string',
          );
        }

        if (newSecretValue.length > MAX_SECRET_SIZE) {
          throw newSecretError(
            ErrorCodes.Secret.Invalid,
            'Provided secret value exceeds allowed length of 16kb',
          );
        }
        const settings = JSON.parse(this.fs.readFileSync(this.path, 'utf8'));
        const index = settings.secrets.findIndex(
          (e: SecretEntry) => e.key === secretKey,
        );
        if (index === -1) {
          throw newSecretError(ErrorCodes.Secret.NotFound, 'Secret not found');
        }
        settings.secrets[index] = { key: secretKey, value: newSecretValue };
        this.fs.writeFileSync(this.path, JSON.stringify(settings, null, 4));
        this.secretCache.set(secretKey, {
          key: secretKey,
          value: newSecretValue,
        });

        resolve({
          key: secretKey,
          value: newSecretValue,
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
