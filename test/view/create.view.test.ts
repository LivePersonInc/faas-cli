import { CreateView } from '../../src/view/create.view';
import { Prompt } from '../../src/view/printer/prompt';

afterEach(() => {
  jest.resetAllMocks();
});

describe('create view', () => {
  it('should ask for a function name', async () => {
    const inquirer = {
      prompt: jest.fn((prompts) => prompts),
    } as any;
    const prompt = new Prompt(inquirer);
    const loginView = new CreateView({ prompt });
    const result = await loginView.askForFunctionName();

    expect(result).toEqual([
      {
        name: 'name',
        type: 'Input',
        message: 'Name',
        validate: expect.any(Function),
      },
    ]);
  });

  it('should ask for a function description', async () => {
    const inquirer = {
      prompt: jest.fn((prompts) => prompts),
    } as any;
    const prompt = new Prompt(inquirer);
    const loginView = new CreateView({ prompt });
    const result = await loginView.askForFunctionDescription();

    expect(result).toEqual([
      {
        name: 'description',
        type: 'Input',
        message: 'Description',
        validate: expect.any(Function),
      },
    ]);
  });

  it('should ask for an eventId', async () => {
    const inquirer = {
      prompt: jest.fn((prompts) => prompts),
    } as any;
    const prompt = new Prompt(inquirer);
    const loginView = new CreateView({ prompt });
    const result = await loginView.askForEventID();

    expect(result).toEqual([
      {
        name: 'eventId',
        type: 'Input',
        message: 'Event ID',
        default: 'No Event',
      },
    ]);
  });

  it('should give a list of eventIds', async () => {
    const inquirer = {
      prompt: jest.fn((prompts) => prompts),
    } as any;
    const prompt = new Prompt(inquirer);
    const loginView = new CreateView({ prompt });
    const result = await loginView.askForEventID(['Event1', 'Event2']);

    expect(result).toEqual([
      {
        name: 'eventId',
        type: 'list',
        message: 'Choose an eventId',
        choices: ['Event1', 'Event2'],
      },
    ]);
  });

  it('should give a list of deployed lambdas', async () => {
    const inquirer = {
      prompt: jest.fn((prompts) => prompts),
    } as any;
    const prompt = new Prompt(inquirer);
    const loginView = new CreateView({ prompt });
    const result = await loginView.askForDeployedLambda(['Lambda1', 'Lambda2']);

    expect(result).toEqual([
      {
        name: 'name',
        type: 'list',
        message: 'Choose a deployed lambda',
        choices: ['Lambda1', 'Lambda2'],
      },
    ]);
  });

  it('should ask for a cron expression', async () => {
    const inquirer = {
      prompt: jest.fn((prompts) => prompts),
    } as any;
    const prompt = new Prompt(inquirer);
    const loginView = new CreateView({ prompt });
    const result = await loginView.askForCronExpression();

    expect(result).toEqual([
      {
        name: 'cronExpression',
        type: 'Input',
        default: '* * * * *',
        message: 'Cron Expression',
      },
    ]);
  });
});
