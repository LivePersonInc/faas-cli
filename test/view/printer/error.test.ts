import { ErrorMessage } from '../../../src/view/printer';

describe('printer - error message', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

  beforeEach(() => {
    consoleSpy.mockReset();
  });

  it('should print a error message', () => {
    const redBoldFunction = jest.fn((message) => message);
    const warnMessage = new ErrorMessage({ red: { bold: redBoldFunction } });

    warnMessage.print('Error');

    expect(redBoldFunction).toBeCalledWith('Error');
    expect(consoleSpy).toBeCalledWith(expect.stringMatching(/Error/));
  });

  it('should print a error message (default)', () => {
    const warnMessage = new ErrorMessage();

    warnMessage.print('Error');

    expect(consoleSpy).toBeCalledWith(expect.stringMatching(/Error/));
  });
});
