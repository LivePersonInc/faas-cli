import * as fs from 'fs-extra';
import { join } from 'path';
import { TaskList } from '../../src/view/printer';
import { InitController } from '../../src/controller/init.controller';
import { InitView } from '../../src/view/init.view';
import { FileService } from '../../src/service/file.service';

jest.setTimeout(50000);

describe('Init controller', () => {
  const testDir = join(__dirname, 'test');

  jest.spyOn(process, 'cwd').mockReturnValue(testDir);
  jest.spyOn(global.console, 'log').mockImplementation();

  const fileService = new FileService();
  fileService.getRoot = jest.fn(() => testDir);

  it('should run the tasklist with yarn', async () => {
    const execController = jest.fn((packageManager: string) => {
      if (packageManager.includes('npm')) {
        return '';
      }
      return '1.01.10';
    });
    const execView = jest.fn();
    const tasklist = new TaskList({ renderer: 'silent' });
    tasklist.run = jest.fn();
    const initView = new InitView({ tasklist, exec: execView });
    await new InitController({
      initView,
      exec: execController,
      fileService,
    }).init();
    expect(tasklist.getTasks()).toEqual([
      { task: expect.any(Function), title: 'Initializing structure' },
      { task: expect.any(Function), title: 'Install packages' },
    ]);
    fs.removeSync(testDir);
  });

  it('should throw an error if npm or yarn is not installed', async () => {
    const exec = jest.fn(() => false);
    try {
      await new InitController({ exec, fileService }).init();
    } catch (error) {
      expect(error.message).toBe(
        'Please make sure you have npm or yarn installed',
      );
    }
  });
});
