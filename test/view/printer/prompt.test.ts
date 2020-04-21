import { Prompt } from '../../../src/view/printer';

describe('printer - prompt', () => {
  // prevent prompt output
  jest.spyOn(process.stdout, 'write').mockImplementation();

  it('should run the prompt with questions', async () => {
    const inquirer = {
      prompt: jest.fn((prompts) => prompts),
    } as any;
    const prompt = new Prompt(inquirer);

    const question1 = {
      name: 'loginType',
      type: 'list',
      message: 'What type do you want to choose for login?',
      choices: ['LiveEngage', 'ClientCredentials'],
    };
    const question2 = {
      name: 'accountId',
      type: 'input',
      message: 'AccountId',
    };
    const question3 = {
      name: 'username',
      type: 'input',
      message: 'username',
    };

    prompt.addQuestion(question1);
    prompt.addQuestion([question2, question3]);

    const result = await prompt.run();

    expect(result).toEqual([
      {
        choices: ['LiveEngage', 'ClientCredentials'],
        message: 'What type do you want to choose for login?',
        name: 'loginType',
        type: 'list',
      },
      { message: 'AccountId', name: 'accountId', type: 'input' },
      { message: 'username', name: 'username', type: 'input' },
    ]);
  });

  it('should get the questions from the prompt', () => {
    const prompt = new Prompt();
    prompt.addQuestion({
      name: 'accountId',
      type: 'input',
      message: 'AccountId',
    });
    expect(prompt.getQuestions()).toEqual([
      { message: 'AccountId', name: 'accountId', type: 'input' },
    ]);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
});
