/* eslint-disable @typescript-eslint/no-empty-function */
import { defineFeature, loadFeature } from 'jest-cucumber';
import { DebugController } from '../../../src/controller/debug.controller';

const feature = loadFeature('test/commands/debug/debug.feature');

defineFeature(feature, (test) => {
  const consoleSpy = jest.spyOn(global.console, 'log').mockImplementation();
  jest.mock('child_process', () => {
    return {
      execFile: () => 'Calling debug.js',
    };
  });

  test('Run the debug command with provided function', ({
    given,
    when,
    then,
  }) => {
    given('I have a function locally', () => {});

    when('I run the debug command and pass this function', async () => {
      const mockFileService = {
        getPathToFunction: jest.fn(),
      } as any;
      const debugController = new DebugController({
        fileService: mockFileService,
      });
      await debugController.debug({ lambdaFunctions: ['Function1'] });
    });

    then('A debugger should run with the passed function', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Debugger is running on port \d{1,5}/),
      );
    });
  });
  test('Run the debug command with no provided function', ({
    given,
    when,
    then,
  }) => {
    given('I have no function locally', () => {});

    when('I run the debug command and pass no function', () => {
      const mockFileService = {
        getPathToFunction: jest.fn(() => {
          throw new Error('No Function available');
        }),
      } as any;
      const debugController = new DebugController({
        fileService: mockFileService,
      });
      debugController.debug({ lambdaFunctions: ['Function1'] });
    });

    then('An error message should tell me that there is no function', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/No Function available/),
      );
    });
  });
});
