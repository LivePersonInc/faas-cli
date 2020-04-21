import { WarnMessage } from '../../../src/view/printer';

require('events').EventEmitter.defaultMaxListeners = 15;

describe('printer - warn message', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

  afterEach(() => {
    consoleSpy.mockReset();
  });

  it('should print a warn message', () => {
    const yellowBoldFunction = jest.fn((message) => message);
    const warnMessage = new WarnMessage({
      yellow: { bold: yellowBoldFunction },
    });

    warnMessage.print('Warning');

    expect(yellowBoldFunction).toBeCalledWith('Warning');
    expect(consoleSpy).toBeCalledWith(expect.stringMatching(/Warning/));
  });

  it('should print a warn message (default)', () => {
    const warnMessage = new WarnMessage();

    warnMessage.print('Warning');

    expect(consoleSpy).toBeCalledWith(expect.stringMatching(/Warning/));
  });
});
