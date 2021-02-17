import * as fs from 'fs-extra';
import { join } from 'path';
import { DefaultStructureService } from '../../src/service/defaultStructure.service';
import { FileService } from '../../src/service/file.service';

describe('Default structure service', () => {
  const testDir = join(__dirname, 'test');
  const fileService = new FileService({ cwd: testDir });
  fileService.getRoot = jest.fn(() => testDir);
  const defaultStructureService = new DefaultStructureService({
    cwd: testDir,
    fileService,
  });

  jest.spyOn(process, 'cwd').mockReturnValue(testDir);
  jest.setTimeout(100000);
  jest.useFakeTimers();

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.removeSync(testDir);
    }
  });

  it('should create the default structure service', () => {
    defaultStructureService.create();

    expect(fs.existsSync(join(testDir, 'README.md'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, '.vscode'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, '.idea'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, '.gitignore'))).toBeTruthy();
    expect(
      fs.existsSync(join(testDir, 'bin', 'faas-debugger.js')),
    ).toBeTruthy();
    expect(fs.existsSync(join(testDir, 'bin', 'rewire.js'))).toBeTruthy();
    expect(
      fs.existsSync(join(testDir, 'bin', 'lp-faas-toolbelt/')),
    ).toBeTruthy();
    expect(
      fs.existsSync(join(testDir, 'functions', 'settings.json')),
    ).toBeTruthy();
    expect(
      fs.existsSync(join(testDir, 'functions', 'exampleFunction')),
    ).toBeFalsy();
    expect(
      fs.existsSync(join(testDir, 'functions', 'exampleFunction', 'index.js')),
    ).toBeFalsy();
    expect(
      fs.existsSync(
        join(testDir, 'functions', 'exampleFunction', 'config.json'),
      ),
    ).toBeFalsy();
  });

  it('should create the default structure service with function name', () => {
    defaultStructureService.create('functionWithName');

    expect(fs.existsSync(join(testDir, 'README.md'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, '.vscode'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, '.idea'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, '.gitignore'))).toBeTruthy();
    expect(
      fs.existsSync(join(testDir, 'bin', 'faas-debugger.js')),
    ).toBeTruthy();
    expect(fs.existsSync(join(testDir, 'bin', 'rewire.js'))).toBeTruthy();
    expect(
      fs.existsSync(join(testDir, 'bin', 'lp-faas-toolbelt/')),
    ).toBeTruthy();
    expect(
      fs.existsSync(join(testDir, 'functions', 'settings.json')),
    ).toBeTruthy();
    expect(
      fs.existsSync(join(testDir, 'functions', 'functionWithName')),
    ).toBeTruthy();
    expect(
      fs.existsSync(join(testDir, 'functions', 'functionWithName', 'index.js')),
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
  });

  it('should throw an error if the same function already exists', () => {
    try {
      defaultStructureService.create('functionWithName1');
      defaultStructureService.create('functionWithName1');
    } catch (error) {
      expect(error.message).toBe(
        'Folder with same name already exists (functionWithName1)',
      );
    }
  });

  it('should only create the bin folder for the update', () => {
    defaultStructureService.create(undefined, true);

    expect(fs.existsSync(join(testDir, 'README.md'))).toBeFalsy();
    expect(fs.existsSync(join(testDir, '.vscode'))).toBeFalsy();
    expect(fs.existsSync(join(testDir, '.idea'))).toBeFalsy();

    expect(
      fs.existsSync(join(testDir, 'bin', 'faas-debugger.js')),
    ).toBeTruthy();
    expect(fs.existsSync(join(testDir, 'bin', 'rewire.js'))).toBeTruthy();
    expect(
      fs.existsSync(join(testDir, 'bin', 'lp-faas-toolbelt/')),
    ).toBeTruthy();
  });

  it('should throw an error if folder with same function already exists', () => {
    defaultStructureService.createFunction({
      description: 'foo',
      event: 'bar',
      name: 'baz',
    });

    try {
      defaultStructureService.createFunction({
        description: 'foo',
        event: 'bar',
        name: 'baz',
      });
    } catch (error) {
      expect(error.message).toBe('Folder with same name already exists (baz)');
    }
  });

  it('should throw an error if lambda name not defined', () => {
    try {
      defaultStructureService.createFunction({
        description: 'foo',
        event: 'bar',
        name: '',
      });
    } catch (error) {
      expect(error.message).toBe('Name is required');
    }
  });

  it('should make valid default values if no event and/or description is given', () => {
    defaultStructureService.createFunction({
      description: '',
      event: '',
      name: 'undescribedNoEventFunction',
    });

    expect(
      fs.existsSync(join(testDir, 'functions', 'undescribedNoEventFunction')),
    ).toBeTruthy();

    const lambdaConfiguration = fileService.read(
      join(testDir, 'functions', 'undescribedNoEventFunction', 'config.json'),
    );

    expect(lambdaConfiguration.name).toEqual('undescribedNoEventFunction');
    expect(lambdaConfiguration.event).toEqual('No Event');
    expect(lambdaConfiguration.description).toEqual(
      'undescribedNoEventFunction description',
    );
  });
});
