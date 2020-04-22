import { LogMessage } from '../../../src/view/printer';

describe('printer - log message', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

  it('should print a log message', () => {
    const logMessage = new LogMessage();

    logMessage.print('Logging');

    expect(consoleSpy).toBeCalledWith(expect.stringMatching(/Logging/));
  });
});
