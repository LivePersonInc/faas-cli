import { ISecretClient } from './IsecretClient';
import { SecretError } from '../errors/secretError';
import { ErrorCodes } from '../errors/errorCodes';
import { join } from 'path';

import * as fsDefault from 'fs-extra';
import { SecretEntry } from './types';

export class VaultSecretClient implements ISecretClient {
  private path: string;
  private fs: any;

  constructor(fs: any = fsDefault) {
    this.path = join(process.cwd(), 'functions', 'settings.json');
    this.fs = fs;
  }

  readSecret(key: string): Promise<SecretEntry> {
    return new Promise((resolve, reject) => {
      try {
        const settings = JSON.parse(this.fs.readFileSync(this.path, 'utf8'));
        const secret = settings.secrets.find((e: SecretEntry) => e.key === key);
        if (!secret) {
          throw Error;
        }
        resolve(secret);
      } catch (err) {
        reject(
          new SecretError(
            ErrorCodes.Secret.NotFound,
            `There is no Secret ${key} for this account`,
          ),
        );
      }
    });
  }

  updateSecret(updatedSecret: SecretEntry): Promise<SecretEntry> {
    return new Promise((resolve, reject) => {
      if (updatedSecret.value.length > 10000) {
        throw new SecretError(
          ErrorCodes.Secret.Invalid,
          'Provided Secret Value exceeds allowed length of 10000',
        );
      }
      try {
        const settings = JSON.parse(this.fs.readFileSync(this.path, 'utf8'));
        const index = settings.secrets.findIndex(
          (e: SecretEntry) => e.key === updatedSecret.key,
        );
        if (index === -1) {
          throw Error;
        }
        settings.secrets[index] = updatedSecret;
        this.fs.writeFileSync(this.path, JSON.stringify(settings, null, 4));
        resolve(updatedSecret);
      } catch {
        reject(
          new SecretError(
            ErrorCodes.Secret.Failure,
            `Updating Secret ${updatedSecret.key} failed`,
          ),
        );
      }
    });
  }
}
