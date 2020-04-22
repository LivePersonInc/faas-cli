import * as fs from 'fs-extra';
import { join } from 'path';
import { warnIfUpdateAvailable } from '../../../src/hooks/init/warnIfUpdateAvailable';

jest.mock('latest-version', () =>
  jest.requireActual('../../__mocks__/latest-version.ts'),
);

describe('warn if update is available', () => {
  const consoleSpy = jest.spyOn(global.console, 'log').mockImplementation();

  afterEach(() => {
    fs.removeSync(join(__dirname, 'version'));
    consoleSpy.mockReset();
  });

  fs.writeFileSync(
    join(__dirname, 'version'),
    JSON.stringify({ current: '0.0.0' }),
  );

  it('should show a message with the new update note', async () => {
    const config = {
      pjson: {
        oclif: {
          'warn-if-update-available': {
            timeoutInDays: 0,
            npmjsRegistry: 'liveperson-functions-cli',
          },
        },
      },
      cacheDir: __dirname,
      version: '0.0.0',
    } as any;

    await warnIfUpdateAvailable(config);

    expect(consoleSpy).toBeCalledWith(
      expect.stringMatching(/Update available/),
    );
  }, 500);

  it('should show a message if the version file is missing', async () => {
    const config = {
      pjson: {
        oclif: {
          'warn-if-update-available': {
            timeoutInDays: 0,
            npmjsRegistry: 'liveperson-functions-cli',
          },
        },
      },
      cacheDir: __dirname,
      version: '0.0.0',
    } as any;

    await warnIfUpdateAvailable(config);

    expect(consoleSpy).toBeCalledWith(
      expect.stringMatching(/Update available/),
    );
  });

  it('should show a message if the configuration in package.json is missing', async () => {
    const config = {
      pjson: {
        oclif: {},
      },
      cacheDir: __dirname,
      version: '0.0.0',
    } as any;

    await warnIfUpdateAvailable(config);

    expect(consoleSpy).toBeCalledWith(
      expect.stringMatching(/Update available/),
    );
  });

  it('should show a message that there was an error during fetching lastest version ', async () => {
    const config = {
      pjson: {
        oclif: {
          'warn-if-update-available': {
            timeoutInDays: 0,
            npmjsRegistry: 'liveperson-functions-cli-error',
          },
        },
      },
      cacheDir: __dirname,
      version: '0.0.0',
    } as any;

    await warnIfUpdateAvailable(config);

    expect(consoleSpy).toBeCalledWith(
      'Error during fetching latest npm version:',
      'Wrong registry',
    );
  });
});
