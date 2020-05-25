/* eslint-disable @typescript-eslint/no-empty-function */
import { defineFeature, loadFeature } from 'jest-cucumber';
import { join } from 'path';
import * as fs from 'fs-extra';
import { DebugController } from '../../../src/controller/debug.controller';
import { FileService } from '../../../src/service/file.service';
import { InitController } from '../../../src/controller/init.controller';
import { InitView } from '../../../src/view/init.view';
import { DefaultStructureService } from '../../../src/service/defaultStructure.service';

const feature = loadFeature('test/commands/debug/debug.feature');

defineFeature(feature, (test) => {
  beforeAll(() => {
    jest.resetAllMocks();
  });

  const testDir = join(__dirname, 'test');

  jest.spyOn(process.stdout, 'write').mockImplementation();
  const consoleSpy = jest.spyOn(global.console, 'log').mockImplementation();
  jest.mock('child_process', () => {
    return {
      execFile: () => 'Calling debug.js',
    };
  });

  afterAll(() => {
    fs.removeSync(testDir);
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
        needUpdateBinFolder: jest.fn().mockReturnValue(false),
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

  test('Run the debug command with provided function and an update of the bin folder is required', ({
    given,
    when,
    then,
  }) => {
    const mockFileService = new FileService({
      cwd: testDir,
      dirname: join(testDir, 'test', 'test'),
    });
    fs.ensureDirSync(testDir);
    fs.writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        version: '1.0.0',
      }),
    );
    fs.ensureDirSync(join(testDir, 'bin', 'lp-faas-toolbelt'));
    fs.writeFileSync(
      join(testDir, 'bin', 'lp-faas-toolbelt', 'package.json'),
      JSON.stringify({
        version: '0.0.9',
      }),
    );

    given('I have a function locally', () => {});

    when('I run the debug command and pass this function', async () => {
      mockFileService.getPathToFunction = jest.fn();
      mockFileService.getRoot = jest.fn().mockReturnValue(testDir);
      const defaultStructureService = new DefaultStructureService();
      defaultStructureService.create = jest.fn(() => {
        fs.copySync(
          join(testDir, 'package.json'),
          join(testDir, 'bin', 'lp-faas-toolbelt', 'package.json'),
        );
      });
      const initView = new InitView({ defaultStructureService });
      const initController = new InitController({ initView });
      const debugController = new DebugController({
        fileService: mockFileService,
        initController,
      });
      await debugController.debug({ lambdaFunctions: ['Function1'] });
    });

    then('Bin folder gets updated', async () => {
      const toolbeltPackage = JSON.parse(
        await fs.readFile(
          join(testDir, 'bin', 'lp-faas-toolbelt', 'package.json'),
          'utf8',
        ),
      );
      expect(toolbeltPackage.version).toBe('1.0.0');
    });

    then('A debugger should run with the passed function', async () => {
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
        needUpdateBinFolder: jest.fn().mockReturnValue(false),
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
