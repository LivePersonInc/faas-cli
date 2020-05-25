/* eslint-disable no-console */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fork, spawn } from 'child_process';
import { join } from 'path';
import { performance } from 'perf_hooks';

interface IInvokeControllerConfig {
  indexPath?: string;
  configPath?: string;
  lambdaToInvoke?: string;
  cwd?: string;
}

interface IInvokeErrorLogs {
  errorCode: string;
  errorMsg: string;
  errorLogs: any[];
}

const EXECUTION_EXCEED_TIMEOUT = 60000;

function isLogLevel(input: any) {
  return Object.keys({
    Debug: 'Debug',
    Info: 'Info',
    Warn: 'Warn',
    Error: 'Error',
    Callback: 'Callback',
    History: 'History',
  }).some((e) => input.includes(`[${e}]`));
}

function didExecutionExceedTimewindow(timeStart: number, timeEnd: number) {
  return timeEnd - timeStart > EXECUTION_EXCEED_TIMEOUT;
}

function didExecutionFailWithError(result: any[]) {
  return (
    result.filter((e: any) => e.level === 'Error' && e.message?.errorMsg)
      .length > 0
  );
}

function throwInvalidProjectFolderError() {
  console.log(
    'Could not find index.js. Please make sure you have set up a functions folder with index.js and config.json',
  );
}

function didIncorrectErrorFormat(result: any[]) {
  return result.some(
    (e: any) =>
      e.extras[0]?.originalFailure &&
      e.message?.errorMsg.includes('incorrect format') &&
      e.level === 'Warn',
  );
}

export class FaasDebugger {
  private result: any;

  private configPath: string;

  private errorLogs: IInvokeErrorLogs;

  private indexPath: string;

  private lambdaToInvoke: string;

  private functionPath: string;

  private port: number | null;

  private cwd: string;

  constructor(
    /* istanbul ignore next */ {
      indexPath = '',
      configPath = '',
      lambdaToInvoke = '',
      cwd = process.cwd(),
    }: IInvokeControllerConfig = {},
  ) {
    this.indexPath = indexPath;
    this.configPath = configPath;
    this.result = {
      result: {},
      logs: [],
    };
    this.errorLogs = {
      errorCode: '',
      errorMsg: '',
      errorLogs: [],
    };
    this.cwd = cwd;
    this.lambdaToInvoke = lambdaToInvoke;
    this.functionPath = join(
      cwd,
      'functions',
      process.env.DEBUG_FUNCTION || process.argv[2],
    );
    this.port = process.env.DEBUG_PORT
      ? Number.parseInt(process.env.DEBUG_PORT, 10)
      : null;
  }

  public async runLocalInvocation() {
    try {
      this.updateLambdaFunctionForInvoke();
      this.setEnvironmentVariables(true);
      await this.createChildProcessForInvokeLocal();
    } catch {
      throwInvalidProjectFolderError();
    }
  }

  public async runDebugging() {
    try {
      this.updateLambdaFunctionForDebugging();
      this.setEnvironmentVariables();
      await this.createChildProcessForDebugging();
    } catch {
      throwInvalidProjectFolderError();
    }
  }

  private createChildProcessForInvokeLocal() {
    return new Promise((resolve) => {
      const childFork = fork(this.indexPath, [], {
        env: process.env,
        detached: true,
      });
      const timeStart = performance.now();
      childFork.on('message', (result: any[]) => {
        const timeEnd = performance.now();
        if (didExecutionExceedTimewindow(timeStart, timeEnd)) {
          this.errorLogs = {
            errorCode: 'com.liveperson.faas.handler.custom-failure',
            errorMsg:
              'Lambda did not call callback within execution time limit',
            errorLogs: result,
          };
          console.log(JSON.stringify(this.errorLogs, null, 4));
          return;
        }
        if (didIncorrectErrorFormat(result)) {
          const error = result.filter(
            (e) =>
              e.extras[0]?.originalFailure &&
              e.message?.errorMsg.includes('incorrect format') &&
              e.level === 'Warn',
          )[0];

          this.errorLogs.errorCode = error.message.errorCode;
          this.errorLogs.errorMsg = error.extras[0].originalFailure;
          result[
            result.findIndex(
              (e) =>
                e.level === 'Warn' &&
                e.message?.errorMsg.includes('incorrect format'),
            )
          ].message = error.message.errorMsg;
          this.errorLogs.errorLogs = result;
          console.log(JSON.stringify(this.errorLogs, null, 4));
          return;
        }

        if (didExecutionFailWithError(result)) {
          const enrichedError = result.filter(
            (e) => e.level === 'Error' && e.message?.errorMsg,
          )[0];
          /* istanbul ignore else */
          if (enrichedError) {
            this.errorLogs.errorCode = enrichedError.message.errorCode;
            this.errorLogs.errorMsg = enrichedError.message.errorMsg;
            result[
              result.findIndex(
                (e) => e.level === 'Error' && e.message?.errorMsg,
              )
            ].message = `Received Error - ${enrichedError.message.errorMsg}`;
          }
          this.errorLogs.errorLogs = result;
          console.log(JSON.stringify(this.errorLogs, null, 4));
          return;
        }

        this.result.logs = result.filter((e) => e.level !== 'Callback');
        const logs = result.filter((e) => e.level === 'Callback');
        this.result.result = logs.length > 0 ? logs[0].message : '';
        console.log(JSON.stringify(this.result, null, 4));
      });
      childFork.on('exit', () => {
        this.revertLambdaFunction(true);
        childFork.kill();
        resolve();
      });
      /* istanbul ignore next */
      process.on('SIGINT', () => {
        console.log('Interrupted lambda invocation');
        resolve();
      });
      /* istanbul ignore next */
      process.on('SIGHUP', () => {
        console.log('Interrupted lambda invocation');
        resolve();
      });
    });
  }

  private async createChildProcessForDebugging() {
    /* istanbul ignore next */
    if (!this.port) {
      /* eslint-disable */
      const getPort = require('./lp-faas-toolbelt/node_modules/get-port');
      /* eslint-enable */
      this.port = await getPort({ port: getPort.makeRange(30500, 31000) });
    }
    this.udpatePortForFiles();
    const args = [
      `--inspect-brk=${this.port}`,
      join(this.functionPath, 'index.js'),
    ];

    const child = spawn('node', args, {
      detached: false,
      stdio: 'pipe',
      serialization: 'advanced',
    });
    child.stdout.on('data', (e) => {
      // eslint-disable-next-line no-console
      if (isLogLevel(e.toString())) console.log(e.toString());
    });
    child.stderr.on('data', (e) => {
      // eslint-disable-next-line no-console
      if (isLogLevel(e.toString())) console.log(e.toString());
    });
    child.on('exit', () => {
      this.revertLambdaFunction();
      child.kill();
    });
    /* istanbul ignore next */
    process.on('SIGINT', () => {
      // eslint-disable-next-line no-console
      console.log('Interrupted lambda invocation');
    });
    /* istanbul ignore next */
    process.on('SIGHUP', () => {
      // eslint-disable-next-line no-console
      console.log('Interrupted lambda invocation');
    });
  }

  private setEnvironmentVariables(invoke = false) {
    const { environmentVariables } = JSON.parse(
      readFileSync(
        invoke ? this.configPath : join(this.functionPath, 'config.json'),
        'utf8',
      ),
    );
    for (const env of environmentVariables) {
      if (
        !Object.prototype.hasOwnProperty.call(env, 'key') ||
        !Object.prototype.hasOwnProperty.call(env, 'value')
      ) {
        // eslint-disable-next-line no-console
        console.log(
          'Invalid environment variables! Please make sure to have key-value pairs as variables',
        );
        return;
      }
      if (env.key === '') {
        return;
      }
      process.env[env.key] = env.value;
    }
  }

  private updateLambdaFunctionForInvoke() {
    let file = readFileSync(this.indexPath, 'utf8');
    file = `require("module").prototype.require = require('../../bin/rewire').proxy; // Rewire require

${file}

// This is an auto generated code during the invocation/debugging
// It rewires the requirements and parsing the output
(async () => {
  try {
    console = require('../../bin/rewire').InvokeLogger;
    const input = require('functions/${this.lambdaToInvoke}/config').input;
    const response = await require('../../bin/rewire').convertToPromisifiedLambda((input, cb) => lambda(input, cb))(input);
    console.response(response);
    process.send(console.getHistory());
  } catch (error) {
    console.customError(error);
    process.send(console.getHistory());
  }
})();`;
    writeFileSync(this.indexPath, file);
  }

  private updateLambdaFunctionForDebugging() {
    const originalCode = readFileSync(
      join(this.functionPath, 'index.js'),
      'utf8',
    );
    const updatedCode = `require("module").prototype.require = require('../../bin/rewire').proxy; // Rewire require

${originalCode}

// This is an auto generated code during the invocation/debugging
// It rewires the requirements and parsing the output
(async () => {
  try {
    console = require('../../bin/rewire').DebugLogger;
    const input = require('functions/${process.argv[2]}/config').input;
    const response = await require('../../bin/rewire').convertToPromisifiedLambda((input, cb) => lambda(input, cb))(input);;
    console.response(response);
    console.printHistory();
  } catch (error) {
    console.customError(error);
  }
})();`;
    writeFileSync(join(this.functionPath, 'index.js'), updatedCode);
  }

  private revertLambdaFunction(invoke = false) {
    const updatedCode = readFileSync(
      invoke ? this.indexPath : join(this.functionPath, 'index.js'),
      'utf8',
    );
    /* istanbul ignore else */
    if (updatedCode.includes('This is an auto generated code')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_1, originalCode1] = updatedCode.split(`// Rewire require

`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [originalCode2, _2] = originalCode1.split(`

// This is an auto`);
      writeFileSync(
        invoke ? this.indexPath : join(this.functionPath, 'index.js'),
        originalCode2,
      );
    }
  }

  private updatePort(filePath: string) {
    let content = readFileSync(filePath, 'utf8');
    const oldPort = content.match(new RegExp(/\d{4,5}/g)) as any[];
    oldPort.forEach((e) => (content = content.replace(e, `${this.port}`)));
    writeFileSync(filePath, content);
  }

  private udpatePortForFiles() {
    /* istanbul ignore else */
    if (existsSync(join(this.cwd, '.vscode', 'launch.json'))) {
      this.updatePort(join(this.cwd, '.vscode', 'launch.json'));
    }

    /* istanbul ignore else */
    if (
      existsSync(
        join(
          this.cwd,
          '.idea',
          'runConfigurations',
          'Attach_FaaS_Debugger.xml',
        ),
      )
    ) {
      this.updatePort(
        join(
          this.cwd,
          '.idea',
          'runConfigurations',
          'Attach_FaaS_Debugger.xml',
        ),
      );
    }
  }
}

/* istanbul ignore next */
if (process.argv.some((e) => e.includes('faas-debugger.js'))) {
  /* istanbul ignore next */
  new FaasDebugger().runDebugging();
}
