"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaasDebugger = void 0;
/* eslint-disable no-console */
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const path_1 = require("path");
const perf_hooks_1 = require("perf_hooks");
const EXECUTION_EXCEED_TIMEOUT = 60000;
function isLogLevel(input) {
    return Object.keys({
        Debug: 'Debug',
        Info: 'Info',
        Warn: 'Warn',
        Error: 'Error',
        Callback: 'Callback',
        History: 'History',
    }).some((e) => input.includes(`[${e}]`));
}
function didExecutionExceedTimewindow(timeStart, timeEnd) {
    return timeEnd - timeStart > EXECUTION_EXCEED_TIMEOUT;
}
function didExecutionFailWithError(result) {
    return (result.filter((e) => { var _a; return e.level === 'Error' && ((_a = e.message) === null || _a === void 0 ? void 0 : _a.errorMsg); })
        .length > 0);
}
function throwInvalidProjectFolderError() {
    console.log('Could not find index.js. Please make sure you have set up a functions folder with index.js and config.json');
}
function didIncorrectErrorFormat(result) {
    return result.some((e) => {
        var _a, _b;
        return ((_a = e.extras[0]) === null || _a === void 0 ? void 0 : _a.originalFailure) && ((_b = e.message) === null || _b === void 0 ? void 0 : _b.errorMsg.includes('incorrect format')) &&
            e.level === 'Warn';
    });
}
class FaasDebugger {
    constructor(
    /* istanbul ignore next */ { indexPath = '', configPath = '', lambdaToInvoke = '', cwd = process.cwd(), } = {}) {
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
        this.functionPath = path_1.join(cwd, 'functions', process.env.DEBUG_FUNCTION || process.argv[2]);
        this.port = process.env.DEBUG_PORT
            ? Number.parseInt(process.env.DEBUG_PORT, 10)
            : null;
    }
    async runLocalInvocation() {
        try {
            this.updateLambdaFunctionForInvoke();
            this.setEnvironmentVariables(true);
            await this.createChildProcessForInvokeLocal();
        }
        catch (_a) {
            throwInvalidProjectFolderError();
        }
    }
    async runDebugging() {
        try {
            this.updateLambdaFunctionForDebugging();
            this.setEnvironmentVariables();
            await this.createChildProcessForDebugging();
        }
        catch (_a) {
            throwInvalidProjectFolderError();
        }
    }
    createChildProcessForInvokeLocal() {
        return new Promise((resolve) => {
            const childFork = child_process_1.fork(this.indexPath, [], {
                env: process.env,
                detached: true,
            });
            const timeStart = perf_hooks_1.performance.now();
            childFork.on('message', (result) => {
                const timeEnd = perf_hooks_1.performance.now();
                if (didExecutionExceedTimewindow(timeStart, timeEnd)) {
                    this.errorLogs = {
                        errorCode: 'com.liveperson.faas.handler.custom-failure',
                        errorMsg: 'Lambda did not call callback within execution time limit',
                        errorLogs: result,
                    };
                    console.log(JSON.stringify(this.errorLogs, null, 4));
                    return;
                }
                if (didIncorrectErrorFormat(result)) {
                    const error = result.filter((e) => {
                        var _a, _b;
                        return ((_a = e.extras[0]) === null || _a === void 0 ? void 0 : _a.originalFailure) && ((_b = e.message) === null || _b === void 0 ? void 0 : _b.errorMsg.includes('incorrect format')) &&
                            e.level === 'Warn';
                    })[0];
                    this.errorLogs.errorCode = error.message.errorCode;
                    this.errorLogs.errorMsg = error.extras[0].originalFailure;
                    result[result.findIndex((e) => {
                        var _a;
                        return e.level === 'Warn' && ((_a = e.message) === null || _a === void 0 ? void 0 : _a.errorMsg.includes('incorrect format'));
                    })].message = error.message.errorMsg;
                    this.errorLogs.errorLogs = result;
                    console.log(JSON.stringify(this.errorLogs, null, 4));
                    return;
                }
                if (didExecutionFailWithError(result)) {
                    const enrichedError = result.filter((e) => { var _a; return e.level === 'Error' && ((_a = e.message) === null || _a === void 0 ? void 0 : _a.errorMsg); })[0];
                    /* istanbul ignore else */
                    if (enrichedError) {
                        this.errorLogs.errorCode = enrichedError.message.errorCode;
                        this.errorLogs.errorMsg = enrichedError.message.errorMsg;
                        result[result.findIndex((e) => { var _a; return e.level === 'Error' && ((_a = e.message) === null || _a === void 0 ? void 0 : _a.errorMsg); })].message = `Received Error - ${enrichedError.message.errorMsg}`;
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
    async createChildProcessForDebugging() {
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
            path_1.join(this.functionPath, 'index.js'),
        ];
        const child = child_process_1.spawn('node', args, {
            detached: false,
            stdio: 'pipe',
            serialization: 'advanced',
        });
        child.stdout.on('data', (e) => {
            // eslint-disable-next-line no-console
            if (isLogLevel(e.toString()))
                console.log(e.toString());
        });
        child.stderr.on('data', (e) => {
            // eslint-disable-next-line no-console
            if (isLogLevel(e.toString()))
                console.log(e.toString());
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
    setEnvironmentVariables(invoke = false) {
        const { environmentVariables } = JSON.parse(fs_1.readFileSync(invoke ? this.configPath : path_1.join(this.functionPath, 'config.json'), 'utf8'));
        for (const env of environmentVariables) {
            if (!Object.prototype.hasOwnProperty.call(env, 'key') ||
                !Object.prototype.hasOwnProperty.call(env, 'value')) {
                // eslint-disable-next-line no-console
                console.log('Invalid environment variables! Please make sure to have key-value pairs as variables');
                return;
            }
            if (env.key === '') {
                return;
            }
            process.env[env.key] = env.value;
        }
    }
    updateLambdaFunctionForInvoke() {
        let file = fs_1.readFileSync(this.indexPath, 'utf8');
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
        fs_1.writeFileSync(this.indexPath, file);
    }
    updateLambdaFunctionForDebugging() {
        const originalCode = fs_1.readFileSync(path_1.join(this.functionPath, 'index.js'), 'utf8');
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
        fs_1.writeFileSync(path_1.join(this.functionPath, 'index.js'), updatedCode);
    }
    revertLambdaFunction(invoke = false) {
        const updatedCode = fs_1.readFileSync(invoke ? this.indexPath : path_1.join(this.functionPath, 'index.js'), 'utf8');
        /* istanbul ignore else */
        if (updatedCode.includes('This is an auto generated code')) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [, originalCode1] = updatedCode.split(`// Rewire require

`);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [originalCode2] = originalCode1.split(`

// This is an auto`);
            fs_1.writeFileSync(invoke ? this.indexPath : path_1.join(this.functionPath, 'index.js'), originalCode2);
        }
    }
    updatePort(filePath) {
        let content = fs_1.readFileSync(filePath, 'utf8');
        const oldPort = content.match(new RegExp(/\d{4,5}/g));
        oldPort.forEach((e) => (content = content.replace(e, `${this.port}`)));
        fs_1.writeFileSync(filePath, content);
    }
    udpatePortForFiles() {
        /* istanbul ignore else */
        if (fs_1.existsSync(path_1.join(this.cwd, '.vscode', 'launch.json'))) {
            this.updatePort(path_1.join(this.cwd, '.vscode', 'launch.json'));
        }
        /* istanbul ignore else */
        if (fs_1.existsSync(path_1.join(this.cwd, '.idea', 'runConfigurations', 'Attach_FaaS_Debugger.xml'))) {
            this.updatePort(path_1.join(this.cwd, '.idea', 'runConfigurations', 'Attach_FaaS_Debugger.xml'));
        }
    }
}
exports.FaasDebugger = FaasDebugger;
/* istanbul ignore next */
if (process.argv.some((e) => e.includes('faas-debugger.js'))) {
    /* istanbul ignore next */
    new FaasDebugger().runDebugging();
}
//# sourceMappingURL=faas-debugger.js.map