import {
  ensureDirSync,
  writeFileSync,
  removeSync,
  copySync,
  readFileSync,
} from 'fs-extra';
import { join } from 'path';
import { FaasDebugger } from '../../src/shared/faas-debugger';

jest.mock('child_process', () => {
  return {
    spawn: () => ({
      stdout: {
        on: jest.fn(),
      },
      stderr: {
        on: jest.fn(),
      },
      on: jest.fn(),
    }),
  };
});

describe('debugger', () => {
  const testDir = join(__dirname, 'test');

  jest.spyOn(process.stdout, 'write').mockImplementation();

  beforeEach(() => {
    ensureDirSync(testDir);
  });

  afterEach(() => {
    removeSync(testDir);
  });

  it("should throw an error if the env variables aren't correct set (debug)", async () => {
    ensureDirSync(join(testDir, 'functions'));
    ensureDirSync(join(testDir, 'functions', 'DebugFunction'));
    writeFileSync(
      join(testDir, 'functions', 'DebugFunction', 'config.json'),
      JSON.stringify({
        name: 'InvokeFunctionLocal',
        event: null,
        input: {
          headers: [],
          payload: {},
        },
        environmentVariables: ['TestValue'],
      }),
    );
    writeFileSync(
      join(testDir, 'functions', 'DebugFunction', 'index.js'),
      `async function lambda(input) {
return 'Hello World';
}
`,
    );

    const debug = new FaasDebugger({ cwd: testDir });

    process.argv = ['', '', 'DebugFunction'];

    try {
      await debug.runDebugging();
    } catch (error) {
      expect(error.message).toBe(
        'Invalid environment variables! Please make sure to have key-value pairs as variables',
      );
    }
  });

  it('should throw an error if the project structure is not correct (debug)', async () => {
    ensureDirSync(join(testDir, 'functions'));
    ensureDirSync(join(testDir, 'functions', 'DebugFunction'));
    writeFileSync(
      join(testDir, 'functions', 'DebugFunction', 'config.json'),
      JSON.stringify({
        name: 'InvokeFunctionLocal',
        event: null,
        input: {
          headers: [],
          payload: {},
        },
        environmentVariables: {
          TestKey: 'TestValue',
        },
      }),
    );

    const debug = new FaasDebugger({ cwd: testDir });

    process.argv = ['', '', 'DebugFunction'];

    try {
      await debug.runDebugging();
    } catch (error) {
      expect(error.message).toBe(
        'Could not find index.js. Please make sure you have set up a functions folder with index.js and config.json',
      );
    }
  });

  it('should throw an error if the project structure is not correct (invoke)', async () => {
    ensureDirSync(join(testDir, 'functions'));
    ensureDirSync(join(testDir, 'functions', 'InvokeFunction'));
    writeFileSync(
      join(testDir, 'functions', 'InvokeFunction', 'config.json'),
      JSON.stringify({
        name: 'InvokeFunction',
        event: null,
        input: {
          headers: [],
          payload: {},
        },
        environmentVariables: {
          TestKey: 'TestValue',
        },
      }),
    );

    const debug = new FaasDebugger({
      indexPath: join(testDir, 'functions', 'InvokeFunction', 'index.js'),
      configPath: join(testDir, 'functions', 'InvokeFunction', 'config.json'),
      lambdaToInvoke: 'InvokeFunction',
      cwd: testDir,
    });

    try {
      await debug.runLocalInvocation();
    } catch (error) {
      expect(error.message).toBe(
        'Could not find index.js. Please make sure you have set up a functions folder with index.js and config.json',
      );
    }
  });

  it('should run the debugger and make the required set up', async () => {
    ensureDirSync(join(testDir, 'functions'));
    ensureDirSync(join(testDir, 'functions', 'DebugFunction'));
    ensureDirSync(join(testDir, '.vscode'));
    ensureDirSync(join(testDir, '.idea'));
    writeFileSync(
      join(testDir, 'functions', 'DebugFunction', 'config.json'),
      JSON.stringify({
        name: 'DebugFunction',
        event: null,
        input: {
          headers: [],
          payload: {},
        },
        environmentVariables: {
          TestKey: 'TestValue',
        },
      }),
    );
    writeFileSync(
      join(testDir, 'functions', 'DebugFunction', 'index.js'),
      `async function lambda(input {
return 'Hello World';
}
`,
    );

    copySync('./bin/example/vscode', join(testDir, '.vscode'));
    copySync('./bin/example/idea', join(testDir, '.idea'));

    process.env.DEBUG_FUNCTION = 'DebugFunction';
    process.env.DEBUG_PORT = '55555';

    const debug = new FaasDebugger({ cwd: testDir });

    await debug.runDebugging();

    const vsCodeConfig = readFileSync(
      join(testDir, '.vscode', 'launch.json'),
      'utf8',
    );
    expect(vsCodeConfig).toContain('55555');

    const ideaCodeConfig = readFileSync(
      join(testDir, '.idea', 'runConfigurations', 'Attach_FaaS_Debugger.xml'),
      'utf8',
    );
    expect(ideaCodeConfig).toContain('55555');
  });

  it('should set map external packages to the toolbelt modules', async () => {
    ensureDirSync(join(testDir, 'functions'));
    ensureDirSync(join(testDir, 'functions', 'DebugFunction'));
    ensureDirSync(join(testDir, '.vscode'));
    ensureDirSync(join(testDir, '.idea'));
    writeFileSync(
      join(testDir, 'functions', 'DebugFunction', 'config.json'),
      JSON.stringify({
        name: 'DebugFunction',
        event: null,
        input: {
          headers: [],
          payload: {},
        },
        environmentVariables: {
          TestKey: 'TestValue',
        },
      }),
    );
    writeFileSync(
      join(testDir, 'functions', 'DebugFunction', 'index.js'),
      `async function lambda(input) {
  import { Toolbelt } from "core-functions-toolbelt";
  import luxon from 'luxon';
  import jsonwebtoken from 'jsonwebtoken';

  return 'Hello World';
}
`,
    );
    copySync('./bin/example/vscode', join(testDir, '.vscode'));
    copySync('./bin/example/idea', join(testDir, '.idea'));

    process.env.DEBUG_FUNCTION = 'DebugFunction';
    process.env.DEBUG_PORT = '55555';

    const debug = new FaasDebugger({ cwd: testDir });

    await debug.runDebugging();

    const indexFile = readFileSync(
      join(testDir, 'functions', 'DebugFunction', 'index.js'),
      'utf8',
    );
    expect(indexFile).toContain('require("core-functions-toolbelt")');
    expect(indexFile).toContain('require("luxon")');
    expect(indexFile).toContain('require("jsonwebtoken")');
  });
});
