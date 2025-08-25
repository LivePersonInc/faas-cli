import { FunctionsSecretClient } from '../../../../src/shared/core-functions-toolbelt/secret-storage/secretClient';
import { ErrorCodes } from '../../../../src/shared/core-functions-toolbelt/errors/errorCodes';
import { ICache } from '../../../../src/shared/core-functions-toolbelt/secret-storage/ICache';

import {
  CachedSecret,
  SecretEntry,
} from '../../../../src/shared/core-functions-toolbelt/secret-storage/types';
import {
  MAX_SECRET_SIZE,
  SYSTEM_SECRET_PREFIX,
} from '../../../../src/shared/core-functions-toolbelt/shared/const';

// Mock the cache
const mockCache: jest.Mocked<ICache<string, CachedSecret>> = {
  get: jest.fn(),
  getAll: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  size: jest.fn(),
  setDefaultTtl: jest.fn(),
};

// Mock fs
const mockFs = {
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
} as any;

describe('FunctionsSecretClient', () => {
  let secretClient: FunctionsSecretClient;

  beforeEach(() => {
    jest.clearAllMocks();
    secretClient = new FunctionsSecretClient(mockCache, {}, mockFs);
  });

  describe('constructor', () => {
    it('should set default TTL when cache TTL option is provided', () => {
      const ttl = 10000;
      // eslint-disable-next-line no-new
      new FunctionsSecretClient(mockCache, { cache: { ttl } }, mockFs);

      expect(mockCache.setDefaultTtl).toHaveBeenCalledWith(ttl);
    });

    it('should not set default TTL when no cache TTL option is provided', () => {
      // eslint-disable-next-line no-new
      new FunctionsSecretClient(mockCache, {}, mockFs);

      expect(mockCache.setDefaultTtl).not.toHaveBeenCalled();
    });
  });

  describe('readSecret', () => {
    const mockSecret: CachedSecret = { key: 'TestKey', value: '"TestValue"' };
    const mockSettings = {
      secrets: [mockSecret],
    };

    it('should return secret from cache when useCache is true and secret exists in cache', async () => {
      mockCache.has.mockReturnValue(true);
      mockCache.get.mockReturnValue(mockSecret);

      const result = await secretClient.readSecret('TestKey');

      expect(result).toEqual(mockSecret);
      expect(mockCache.has).toHaveBeenCalledWith('TestKey');
      expect(mockCache.get).toHaveBeenCalledWith('TestKey');
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it('should read secret from file system when not in cache', async () => {
      mockCache.has.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSettings));

      const result = await secretClient.readSecret('TestKey');

      expect(result).toEqual({
        key: mockSecret.key,
        value: JSON.parse(mockSecret.value),
      });
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('functions/settings.json'),
        'utf8',
      );
      expect(mockCache.set).toHaveBeenCalledWith('TestKey', {
        key: 'TestKey',
        value: '"TestValue"',
      });
    });

    it('should read secret from file system when useCache is false', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSettings));

      const result = await secretClient.readSecret('TestKey', {
        useCache: false,
      });

      expect(result).toEqual({
        key: mockSecret.key,
        value: JSON.parse(mockSecret.value),
      });
      expect(mockCache.has).not.toHaveBeenCalled();
      expect(mockFs.readFileSync).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith('TestKey', {
        key: 'TestKey',
        value: mockSecret.value,
      });
    });

    it('should throw error when secret is not found in file', async () => {
      mockCache.has.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ secrets: [] }));

      await expect(
        secretClient.readSecret('NonExistentKey'),
      ).rejects.toMatchObject({
        code: ErrorCodes.Secret.NotFound,
        message: 'There is no secret NonExistentKey for this account',
      });
    });

    it('should throw error when file cannot be read', async () => {
      mockCache.has.mockReturnValue(false);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(secretClient.readSecret('TestKey')).rejects.toMatchObject({
        code: ErrorCodes.Secret.NotFound,
        message: 'There is no secret TestKey for this account',
      });
    });

    it('should throw error when JSON is malformed', async () => {
      mockCache.has.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue('invalid json');

      await expect(secretClient.readSecret('TestKey')).rejects.toMatchObject({
        code: ErrorCodes.Secret.NotFound,
        message: 'There is no secret TestKey for this account',
      });
    });
  });

  describe('updateSecret', () => {
    const mockSettings = {
      secrets: [
        { key: 'ExistingKey', value: '"ExistingValue"' },
        { key: 'AnotherKey', value: '"AnotherValue"' },
      ],
    };

    beforeEach(() => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSettings));
    });

    it('should successfully update an existing secret', async () => {
      const updatedSecret: SecretEntry = {
        key: 'ExistingKey',
        value: 'NewValue',
      };

      const result = await secretClient.updateSecret(updatedSecret);

      expect(result).toEqual(updatedSecret);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('functions/settings.json'),
        expect.stringContaining('"\\"NewValue\\""'),
      );
      expect(mockCache.set).toHaveBeenCalledWith('ExistingKey', {
        key: 'ExistingKey',
        value: '"NewValue"',
      });
    });

    it('should throw error when trying to update system secret', async () => {
      const systemSecret: SecretEntry = {
        key: `${SYSTEM_SECRET_PREFIX}SystemKey`,
        value: 'SystemValue',
      };

      await expect(
        secretClient.updateSecret(systemSecret),
      ).rejects.toMatchObject({
        code: ErrorCodes.Secret.SystemSecret,
        message: 'You are not allowed to update secrets added by the system',
      });

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should throw error when secret value is not a string', async () => {
      const invalidSecret = {
        key: 'TestKey',
        value: BigInt(9007199254740991) as any,
      };

      await expect(
        secretClient.updateSecret(invalidSecret),
      ).rejects.toMatchObject({
        code: ErrorCodes.Secret.Invalid,
        message:
          'Provided secret value cannot be stringified: Do not know how to serialize a BigInt',
      });

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should throw error when secret value exceeds maximum size', async () => {
      const largeValue = 'x'.repeat(MAX_SECRET_SIZE + 1);
      const largeSecret: SecretEntry = { key: 'TestKey', value: largeValue };

      await expect(
        secretClient.updateSecret(largeSecret),
      ).rejects.toMatchObject({
        code: ErrorCodes.Secret.Invalid,
        message: 'Provided secret value exceeds allowed length of 16kb',
      });

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should throw error when secret key does not exist', async () => {
      const nonExistentSecret: SecretEntry = {
        key: 'NonExistentKey',
        value: 'Value',
      };

      await expect(
        secretClient.updateSecret(nonExistentSecret),
      ).rejects.toThrow();

      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should handle file read errors during update', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const secret: SecretEntry = { key: 'TestKey', value: 'TestValue' };

      await expect(secretClient.updateSecret(secret)).rejects.toThrow();

      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should handle JSON parse errors during update', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      const secret: SecretEntry = { key: 'TestKey', value: 'TestValue' };

      await expect(secretClient.updateSecret(secret)).rejects.toThrow();

      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should preserve other secrets when updating one', async () => {
      const updatedSecret: SecretEntry = {
        key: 'ExistingKey',
        value: 'UpdatedValue',
      };

      await secretClient.updateSecret(updatedSecret);

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1]);

      expect(writtenData.secrets).toHaveLength(2);
      expect(writtenData.secrets[0]).toEqual({
        key: 'ExistingKey',
        value: '"UpdatedValue"',
      });
      expect(writtenData.secrets[1]).toEqual({
        key: 'AnotherKey',
        value: '"AnotherValue"',
      });
    });

    it('should format JSON with proper indentation', async () => {
      const updatedSecret: SecretEntry = {
        key: 'ExistingKey',
        value: 'NewValue',
      };

      await secretClient.updateSecret(updatedSecret);

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const writtenContent = writeCall[1];

      // Check that JSON is formatted with 4-space indentation
      expect(writtenContent).toContain('    ');
      expect(() => JSON.parse(writtenContent)).not.toThrow();
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle empty secrets array in settings file', async () => {
      mockCache.has.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ secrets: [] }));

      await expect(secretClient.readSecret('AnyKey')).rejects.toMatchObject({
        code: ErrorCodes.Secret.NotFound,
        message: 'There is no secret AnyKey for this account',
      });
    });

    it('should handle missing secrets property in settings file', async () => {
      mockCache.has.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({}));

      await expect(secretClient.readSecret('AnyKey')).rejects.toMatchObject({
        code: ErrorCodes.Secret.NotFound,
        message: 'There is no secret AnyKey for this account',
      });
    });

    it('should handle null secret value in file', async () => {
      mockCache.has.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({
          secrets: [{ key: 'TestKey', value: null }],
        }),
      );

      const result = await secretClient.readSecret('TestKey');
      expect(result).toEqual({ key: 'TestKey', value: null });
    });

    it('should handle empty string secret value', async () => {
      const emptySecret: SecretEntry = { key: 'ExistingKey', value: '' };
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({
          secrets: [{ key: 'ExistingKey', value: 'old value' }],
        }),
      );

      const result = await secretClient.updateSecret(emptySecret);
      expect(result).toEqual(emptySecret);
    });

    it('should use default request options when none provided', async () => {
      mockCache.has.mockReturnValue(true);
      mockCache.get.mockReturnValue({ key: 'TestKey', value: 'TestValue' });

      await secretClient.readSecret('TestKey');

      // Should use cache by default (useCache: true)
      expect(mockCache.has).toHaveBeenCalled();
    });
  });
});
