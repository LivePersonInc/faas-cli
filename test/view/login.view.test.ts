import { LoginView } from '../../src/view/login.view';
import { Prompt } from '../../src/view/printer/prompt';

const consoleSpy = jest.spyOn(global.console, 'log').mockImplementation();

afterEach(() => {
  jest.resetAllMocks();
});

describe('login view', () => {
  it('should print the welcome banner', () => {
    const loginView = new LoginView();
    loginView.showWelcomeBanner(true);

    expect(consoleSpy).toBeCalledWith(expect.stringMatching(/Welcome to/));
  });

  it('should print an error message', () => {
    const loginView = new LoginView();
    loginView.errorDuringLogin();

    expect(consoleSpy).toBeCalledWith(
      expect.stringMatching(/Looks like something went wrong/),
    );
  });

  it('should ask for choosing or entering accountId (multiple accountIds)', async () => {
    const inquirer = {
      prompt: jest.fn((prompts) => prompts),
    } as any;
    const prompt = new Prompt(inquirer);

    const loginView = new LoginView({ prompt });
    const result = await loginView.chooseOrEnterAccountId([
      '123456789',
      '987654321',
    ]);

    expect(result).toEqual([
      {
        choices: ['123456789', '987654321', 'other'],
        message: 'Choose accountId or select other',
        name: 'accountId',
        type: 'list',
      },
      {
        message: 'AccountId',
        name: 'other',
        type: 'Input',
        when: expect.any(Function),
      },
    ]);
  });

  it('should ask for choosing or entering accountId (no accountIds)', async () => {
    const inquirer = {
      prompt: jest.fn((prompts) => prompts),
    } as any;
    const prompt = new Prompt(inquirer);

    const loginView = new LoginView({ prompt });
    const result = await loginView.chooseOrEnterAccountId([]);

    expect(result).toEqual([
      { message: 'AccountId', name: 'accountId', type: 'Input' },
    ]);
  });

  it('should ask for username and password', async () => {
    const inquirer = {
      prompt: jest.fn((prompts) => prompts),
    } as any;
    const prompt = new Prompt(inquirer);

    const loginView = new LoginView({ prompt });
    const result = await loginView.askForUsernameAndPassword();

    expect(result).toEqual([
      {
        message: 'username',
        name: 'username',
        type: 'input',
        when: expect.any(Function),
      },
      {
        message: 'password',
        name: 'password',
        type: 'password',
        when: expect.any(Function),
      },
    ]);
  });

  it('should map the answer if other was selected', async () => {
    const prompt = {
      addQuestion: jest.fn(),
      run: jest.fn(() => ({
        accountId: 'other',
        other: '123456789',
      })),
    } as any;

    const loginView = new LoginView({ prompt });
    const result = await loginView.chooseOrEnterAccountId(['123456789']);

    expect(result).toEqual({ accountId: '123456789', other: '123456789' });
  });
});
