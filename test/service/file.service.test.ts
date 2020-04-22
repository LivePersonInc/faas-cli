/* eslint-disable no-shadow */
import * as fs from 'fs-extra';
import * as os from 'os';
import { join } from 'path';
import { FileService } from '../../src/service/file.service';

describe('file service', () => {
  const testDir = join(__dirname, 'test');
  const fileService = new FileService({ cwd: testDir });
  jest.spyOn(os, 'tmpdir').mockReturnValue(testDir);

  beforeEach(() => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
    jest.spyOn(process, 'cwd').mockReturnValue(testDir);
  });

  afterEach(() => {
    fs.removeSync(testDir);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should throw an error while reading a file', () => {
    try {
      fileService.copy(join(__dirname, 'noPath', 'noPath'), __dirname);
    } catch (error) {
      expect(error.message).toContain(
        'Error: ENOENT: no such file or directory',
      );
    }
  });

  it('should throw an error while writing a file', () => {
    try {
      fileService.write(join(__dirname, 'noPath', 'no', 'noFile.js'), {});
    } catch (error) {
      expect(error.message).toContain(
        'Error: ENOENT: no such file or directory',
      );
    }
  });

  it('should get the functions directory names', () => {
    fs.ensureDirSync(join(testDir, 'functions', 'TestFunction1'));
    fs.ensureDirSync(join(testDir, 'functions', 'TestFunction2'));
    expect(fileService.getFunctionsDirectories()).toEqual([
      'TestFunction1',
      'TestFunction2',
    ]);
  });

  it('should throw an error if no local lambda information is available', () => {
    try {
      fileService.collectLocalLambdaInformation();
    } catch (error) {
      expect(error.message).toContain(
        'Could not find function. Please make sure you are in a function folder or pass a function name.',
      );
    }
  });

  it('should return the local lambdaInformation if the user is in the lambda folder', () => {
    fs.ensureDirSync(testDir);
    fileService.write(join(testDir, 'config.json'), { name: 'Function1' });
    const lamda = fileService.collectLocalLambdaInformation();
    expect(lamda).toEqual([{ name: 'Function1' }]);
  });

  it('should get the path to the settings.json (inner)', () => {
    fs.ensureFileSync(join(testDir, 'functions', 'settings.json'));

    const path = fileService.getPathToSettings();
    expect(path).toContain('functions/settings.json');
  });

  it('should get the path to the settings.json (outer)', () => {
    fs.ensureDirSync(join(testDir, 'functions'));
    fs.ensureDirSync(join(testDir, 'functions', 'settings.json'));
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
    fs.ensureDirSync(join(testDir, 'functions', 'settings.json'));

    const fileService = new FileService({ cwd: join(testDir, 'functions') });

    const path = fileService.getPathToSettings();
    expect(path).toContain('functions/settings.json');
  });

  it('should throw an error if no settings.json is avaiable', () => {
    expect(() => {
      fileService.getPathToSettings();
    }).toThrowError(
      "Could not find settings.json. Please make sure it's available in the functions folder.",
    );
  });

  it('should get the path to the function', () => {
    fs.ensureDirSync(join(testDir, 'functions', 'function1'));

    const path = fileService.getPathToFunction('function1');

    expect(path).toContain('/functions/function1');
  });

  it('should throw an error while getting path to function', () => {
    fs.ensureDirSync(join(testDir, 'functions'));

    const functionName = (undefined as unknown) as string;

    expect(() => {
      fileService.getPathToFunction(functionName);
    }).toThrowError(
      'Could not find function. Please make sure you are in a function folder or pass a function name.',
    );
  });

  it('should get the path to the function (inner)', () => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
    fs.ensureDirSync(join(testDir, 'functions', 'function1'));
    fs.ensureDirSync(join(testDir, 'functions', 'function1', 'config.json'));

    const fileService = new FileService({ cwd: join(testDir, 'functions') });

    const path = fileService.getPathToFunction('function1', 'config.json');
    expect(path).toContain('functions/function1/config.json');
  });

  it('should get the path to the function (inner inner)', () => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
    fs.ensureDirSync(join(testDir, 'functions', 'function1'));
    fs.ensureDirSync(join(testDir, 'functions', 'function1', 'config.json'));

    const fileService = new FileService({
      cwd: join(testDir, 'functions', 'function1'),
    });

    const path = fileService.getPathToFunction('function1', 'config.json');
    expect(path).toContain('functions/function1/config.json');
  });

  it('should throw an error while getting path to function', () => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
    fs.ensureDirSync(join(testDir, 'functions/'));

    const fileService = new FileService({ cwd: join(testDir, 'functions/') });

    expect(() => {
      fileService.getPathToFunction('function1');
    }).toThrowError(
      "Could not find the folder of function function1. Please make sure it's available in the functions folder.",
    );
  });

  it('should read a file and not parse json', () => {
    fs.writeFileSync(
      join(testDir, 'test.json'),
      JSON.stringify({
        test: 'TEST',
      }),
    );

    const file = fileService.read(join(testDir, 'test.json'), false);
    expect(file).toBe('{"test":"TEST"}');
  });

  it('should return the function config', () => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
    fs.ensureDirSync(join(testDir, 'functions', 'function1'));
    fs.writeFileSync(
      join(testDir, 'functions', 'function1', 'config.json'),
      JSON.stringify({ name: 'function1' }),
    );

    const config = fileService.getFunctionConfig('function1');

    expect(config).toEqual({ name: 'function1' });
  });

  it('should return the name of the current function folder', () => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
    fs.ensureDirSync(join(testDir, 'functions', 'function1'));
    fs.writeFileSync(
      join(testDir, 'functions', 'function1', 'config.json'),
      JSON.stringify({ name: 'function1' }),
    );

    const fileService = new FileService({
      cwd: join(testDir, 'functions', 'function1'),
    });

    const functionName = fileService.getFunctionFolderName();
    expect(functionName).toContain('function1');
  });

  it('should throw an error if no local function is found', () => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
    fs.ensureDirSync(join(testDir, 'functions', 'function1'));

    const fileService = new FileService({
      cwd: join(testDir, 'functions', 'function1'),
    });

    try {
      fileService.getFunctionFolderName();
    } catch (error) {
      expect(error.message).toBe(
        'Could not find function. Please make sure you are in a function folder or pass a function name.',
      );
    }
  });

  it('should collect all local information about lambdas', () => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
    fs.ensureDirSync(join(testDir, 'functions', 'function1'));
    fs.writeFileSync(
      join(testDir, 'functions', 'function1', 'config.json'),
      JSON.stringify({ name: 'function1' }),
    );
    fs.ensureDirSync(join(testDir, 'functions', 'function2'));
    fs.writeFileSync(
      join(testDir, 'functions', 'function2', 'config.json'),
      JSON.stringify({ name: 'function1' }),
    );

    const lambdaConfigs = fileService.collectLocalLambdaInformation([
      'function1',
      'function2',
    ]);

    expect(lambdaConfigs).toEqual([
      { name: 'function1' },
      { name: 'function1' },
    ]);
  });

  it('should use the system uuid to encrypt the temp file', async () => {
    const sysinfo = jest.fn(() => ({
      uuid: '123-123-123-123',
    }));
    const fileService = new FileService({ sysinfo });
    await fileService.writeTempFile({ test: 'Data' });
    const tempFile = fs.readFileSync(join(testDir, 'faas-tmp.json'), 'utf8');
    expect(tempFile).toBe('"983b7f3d8046229b64dad05e7a779ff0"');
  });

  it('should use the default uuid to encrypt the temp file', async () => {
    const sysinfo = jest.fn(() => {
      throw new Error('Error during getting system uuid');
    });
    const fileService = new FileService({ sysinfo });
    await fileService.writeTempFile({ test: 'Data' });
    const tempFile = fs.readFileSync(join(testDir, 'faas-tmp.json'), 'utf8');
    expect(tempFile).toBe('"f080ab472c4dc27a681711b8dda46c7f"');
  });

  it('should get the root directory', () => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));

    const fileService = new FileService({ cwd: testDir });

    expect(fileService.getRoot()).toContain('test/service/test');
  });

  it('should get the root directory (inner)', () => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));

    const fileService = new FileService({ cwd: join(testDir, 'functions') });

    expect(fileService.getRoot()).toContain('test/service/test');
  });

  it('should get the root directory (inner inner)', () => {
    fs.ensureDirSync(join(testDir, 'bin'));
    fs.ensureDirSync(join(testDir, 'functions'));
    fs.ensureDirSync(join(testDir, 'functions', 'testFunction1'));

    const fileService = new FileService({
      cwd: join(testDir, 'functions', 'testFunction1'),
    });

    expect(fileService.getRoot()).toContain('test/service/test');
  });

  it('should throw an error during finding the root directory', () => {
    const fileService = new FileService();

    fs.removeSync(testDir);

    try {
      fileService.getRoot();
    } catch (error) {
      expect(error.message).toBe(
        'Could not find root directory. Please make sure you are in a faas project.',
      );
    }
  });

  it('should write a file without stringify', () => {
    fs.ensureDirSync(testDir);
    const fileService = new FileService({ cwd: testDir });

    fileService.write(join(testDir, 'test.js'), 'test', false);

    const file = fileService.read(join(testDir, 'test.js'), false);

    expect(file).toEqual('test');
  });

  it('should return undefined if the file could not be read (no parsing)', () => {
    fs.ensureDirSync(testDir);
    const fileService = new FileService({ cwd: testDir });

    expect(fileService.read(join(testDir, 'index.js'), false)).toBeUndefined();
  });
});
