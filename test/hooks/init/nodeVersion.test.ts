/* eslint-disable import/first */
jest.mock('../../../src/service/faas.service', () =>
  jest.requireActual('../../__mocks__/faas.service.ts'),
);
jest.mock('../../../src/service/faasFactory.service', () =>
  jest.requireActual('../../__mocks__/faasFactory.service.ts'),
);
import { nodeVersion } from '../../../src/hooks/init/nodeVersion';

describe('node version', () => {
  const consoleSpy = jest.spyOn(global.console, 'log').mockImplementation();

  afterEach(() => {
    consoleSpy.mockReset();
  });

  it('should show a message that the node versions are different', async () => {
    const opts = {
      id: 'invoke',
    };

    await nodeVersion(opts, '13.0.0');

    expect(consoleSpy).toBeCalledWith(
      expect.stringMatching(/Please be aware that your Node.js /),
    );
  });

  it('should not show a message if the versions are equal', async () => {
    const opts = {
      id: 'invoke',
    };

    await nodeVersion(opts, '22.0.0');

    expect(consoleSpy).toBeCalledTimes(0);
  });

  it('should not show a message if the command is not invoke', async () => {
    const opts = {
      id: 'login',
    };

    await nodeVersion(opts, '10.0.0');

    expect(consoleSpy).toBeCalledTimes(0);
  });

  it('should throw an error if was not able to catch node version from server', async () => {
    const opts = {
      id: 'login',
    };

    await nodeVersion(opts, '10.0.0');

    expect(consoleSpy).toBeCalledTimes(0);
  });
});
