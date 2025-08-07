/* eslint-disable import/first */
jest.mock('../../../src/service/file.service', () => ({
  FileService: jest.fn().mockImplementation(() => ({
    getTempFile: jest.fn(),
  })),
}));

import { checkV2Migration } from '../../../src/hooks/init/accountMigrated';
import { FileService } from '../../../src/service/file.service';

describe('checkV2Migration', () => {
  const consoleSpy = jest.spyOn(global.console, 'log').mockImplementation();
  const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
    return undefined as never;
  });

  let mockFileService: jest.Mocked<FileService>;

  beforeEach(() => {
    mockFileService = new FileService() as jest.Mocked<FileService>;
    (FileService as jest.Mock).mockImplementation(() => mockFileService);
  });

  afterEach(() => {
    consoleSpy.mockReset();
    processExitSpy.mockReset();
    jest.clearAllMocks();
  });

  it('should return early for v2notRequired commands (login)', async () => {
    const opts = { id: 'login' };

    await checkV2Migration(opts);

    expect(mockFileService.getTempFile).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should return early for v2notRequired commands (logout)', async () => {
    const opts = { id: 'logout' };

    await checkV2Migration(opts);

    expect(mockFileService.getTempFile).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should return early for v2notRequired commands (init)', async () => {
    const opts = { id: 'init' };

    await checkV2Migration(opts);

    expect(mockFileService.getTempFile).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should proceed normally when account is migrated to v2', async () => {
    const opts = { id: 'deploy' };
    const mockTempFile = {
      account123: {
        active: true,
        isV2: true,
      },
    };

    mockFileService.getTempFile.mockResolvedValue(mockTempFile);

    await checkV2Migration(opts);

    expect(mockFileService.getTempFile).toHaveBeenCalledTimes(1);
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should display downgrade message and exit when account is not migrated to v2', async () => {
    const opts = { id: 'deploy' };
    const mockTempFile = {
      account123: {
        active: true,
        isV2: false,
      },
    };

    mockFileService.getTempFile.mockResolvedValue(mockTempFile);

    await checkV2Migration(opts);

    expect(mockFileService.getTempFile).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith('');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/⚠ Account Migration Required/),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/npm install -g liveperson-functions-cli@1\.31\.3/),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle multiple accounts and find the active one', async () => {
    const opts = { id: 'deploy' };
    const mockTempFile = {
      account123: {
        active: false,
        isV2: false,
      },
      account456: {
        active: true,
        isV2: true,
      },
      account789: {
        active: false,
        isV2: false,
      },
    };

    mockFileService.getTempFile.mockResolvedValue(mockTempFile);

    await checkV2Migration(opts);

    expect(mockFileService.getTempFile).toHaveBeenCalledTimes(1);
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should display warning when getTempFile throws an error', async () => {
    const opts = { id: 'deploy' };
    const error = new Error('File not found');

    mockFileService.getTempFile.mockRejectedValue(error);

    await checkV2Migration(opts);

    expect(mockFileService.getTempFile).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /Warning: Could not verify Functions v2 migration status/,
      ),
    );
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should handle case where no active account is found', async () => {
    const opts = { id: 'deploy' };
    const mockTempFile = {
      account123: {
        active: false,
        isV2: true,
      },
      account456: {
        active: false,
        isV2: false,
      },
    };

    mockFileService.getTempFile.mockResolvedValue(mockTempFile);

    // This should cause an error when trying to access tempFile[undefined].isV2
    await checkV2Migration(opts);

    expect(mockFileService.getTempFile).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /Warning: Could not verify Functions v2 migration status/,
      ),
    );
  });

  it('should handle empty temp file', async () => {
    const opts = { id: 'deploy' };
    const mockTempFile = {};

    mockFileService.getTempFile.mockResolvedValue(mockTempFile);

    await checkV2Migration(opts);

    expect(mockFileService.getTempFile).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /Warning: Could not verify Functions v2 migration status/,
      ),
    );
  });

  it('should handle case where isV2 property is undefined', async () => {
    const opts = { id: 'deploy' };
    const mockTempFile = {
      account123: {
        active: true,
        // isV2 property missing
      },
    };

    mockFileService.getTempFile.mockResolvedValue(mockTempFile);

    await checkV2Migration(opts);

    expect(mockFileService.getTempFile).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/⚠ Account Migration Required/),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
