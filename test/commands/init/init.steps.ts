import * as fs from 'fs-extra';
import { join } from 'path';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { InitController } from '../../../src/controller/init.controller';
import { InitView } from '../../../src/view/init.view';
import { TaskList } from '../../../src/view/printer';
import { FileService } from '../../../src/service/file.service';

const feature = loadFeature('test/commands/init/init.feature');

defineFeature(feature, (test) => {
  const testDir = join(__dirname, 'test');
  const consoleSpy = jest.spyOn(global.console, 'log').mockImplementation();
  jest.spyOn(process, 'cwd').mockReturnValue(testDir);
  jest.setTimeout(100000);
  jest.useFakeTimers();
  const fileService = new FileService({ cwd: testDir });

  function resetDirectory() {
    fs.removeSync(testDir);
    consoleSpy.mockReset();
  }

  afterAll(() => {
    jest.resetAllMocks();
  });

  test('Run the init command', async ({ when, then, and }) => {
    let initController: InitController;
    const tasklist = new TaskList({ renderer: 'silent' });
    const initView = new InitView({ tasklist });

    when('I run the init command with lpf init', async () => {
      fs.ensureDirSync(testDir);
      initController = new InitController({ initView });
      await initController.init();
    });

    then('It should print a success message', () => {
      expect(tasklist.getTasks()).toEqual([
        { task: expect.any(Function), title: 'Initialise example function' },
        { task: expect.any(Function), title: 'Install packages' },
      ]);
    });

    and(
      'A folder with the appropirate files should be created on the root directory',
      () => {
        setTimeout(() => {
          expect(fs.existsSync(join(testDir, 'README.md'))).toBeTruthy();
          expect(fs.existsSync(join(testDir, '.vscode'))).toBeTruthy();
          expect(fs.existsSync(join(testDir, '.idea'))).toBeTruthy();
          expect(fs.existsSync(join(testDir, '.gitignore'))).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'bin', 'faas-debugger.js')),
          ).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'bin', 'lp-faas-toolbelt.js')),
          ).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'bin', 'package.json')),
          ).toBeTruthy();
          expect(fs.existsSync(join(testDir, 'bin', 'services'))).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'functions', 'settings.json')),
          ).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'functions', 'exampleFunction')),
          ).toBeTruthy();
          expect(
            fs.existsSync(
              join(testDir, 'functions', 'exampleFunction', 'index.js'),
            ),
          ).toBeTruthy();
          expect(
            fs.existsSync(
              join(testDir, 'functions', 'exampleFunction', 'config.json'),
            ),
          ).toBeTruthy();
        }, 250);
      },
    );
  });

  test('Run the init command with name flag', ({ when, then, and }) => {
    let initController: InitController;
    const tasklist = new TaskList({ renderer: 'silent' });
    const exec = jest.fn();
    const initView = new InitView({ tasklist, exec });

    when(/I run the init command with lpf init ("--.*") (".*")/, async () => {
      fs.ensureDirSync(testDir);
      fs.writeFileSync(
        join(testDir, 'bin', 'lp-faas-toolbelt', 'package-lock.json'),
        JSON.stringify({}),
      );
      fs.ensureDirSync(
        join(testDir, 'bin', 'lp-faas-toolbelt', 'node_modules'),
      );
      initController = new InitController({ initView });
      await initController.init({ functionNames: ['functionWithName'] });
    });

    then('It should print a success message', () => {
      expect(tasklist.getTasks()).toEqual([
        { task: expect.any(Function), title: 'Initialise functionWithName' },
      ]);
    });

    and(
      'A folder with the appropirate files and function name should be created on the root directory',
      () => {
        setTimeout(() => {
          expect(fs.existsSync(join(testDir, 'README.md'))).toBeTruthy();
          expect(fs.existsSync(join(testDir, '.vscode'))).toBeTruthy();
          expect(fs.existsSync(join(testDir, '.idea'))).toBeTruthy();
          expect(fs.existsSync(join(testDir, '.gitignore'))).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'bin', 'faas-debugger.js')),
          ).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'bin', 'lp-faas-toolbelt.js')),
          ).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'bin', 'package.json')),
          ).toBeTruthy();
          expect(fs.existsSync(join(testDir, 'bin', 'services'))).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'functions', 'settings.json')),
          ).toBeTruthy();
          expect(
            fs.existsSync(join(testDir, 'functions', 'functionWithName')),
          ).toBeTruthy();
          expect(
            fs.existsSync(
              join(testDir, 'functions', 'functionWithName', 'index.js'),
            ),
          ).toBeTruthy();
          expect(
            fs.existsSync(
              join(testDir, 'functions', 'functionWithName', 'config.json'),
            ),
          ).toBeTruthy();

          const fileData = fileService.read(
            join(testDir, 'functions', 'functionWithName', 'config.json'),
          );
          expect(fileData.name).toEqual('functionWithName');

          resetDirectory();
        }, 250);
      },
    );
  });

  test('Show an error message when something goes wrong during the execution', ({
    when,
    then,
  }) => {
    const initView = new InitView();
    initView.showInitialiseTaskList = jest.fn(() => {
      throw new Error('Error during init command');
    });

    when(
      'I run the init command with lpf init and an error occurs',
      async () => {
        try {
          await new InitController({ initView }).init({
            functionNames: ['functionWithName'],
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(error);
        }
      },
    );

    then('An error message should be displayed', () => {
      expect(consoleSpy).toBeCalledWith(
        expect.stringMatching(/Error during init command/),
      );
      resetDirectory();
    });
  });
});
