/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable global-require */
const { join } = require('path');

/**
 * Is used for rewiring the require, so the lambda code will stay the same
 * Uses the proxy to overwrite the module.require.
 * Based on the passed path it will rewire the following two things:
 * 1. The require('lp-faas-toolbelt') will be mapped to the local one (../../bin/lp-faas-toolbelt)
 * 2. The require of the config.json will be mapped to the one of the passed function
 */
const proxy = new Proxy(require('module').prototype.require, {
  apply(target, thisArg, argumentsList) {
    const name = argumentsList.length > 0 ? argumentsList[0] : '';
    if (name.includes('lp-faas-toolbelt')) {
      argumentsList[0] = join('..', '..', 'bin', 'lp-faas-toolbelt');
    }
    if (name.match(/functions\/.*\/config/)) {
      const [_, functionName] = name.split('/');
      argumentsList[0] = process.env.DEBUG_PATH
        ? './config.json'
        : join(process.cwd(), 'functions', functionName, 'config.json');
    }
    return Reflect.apply(target, thisArg, argumentsList);
  },
});

const stdout = console;

const LogLevels = {
  Debug: 'Debug',
  Info: 'Info',
  Warn: 'Warn',
  Error: 'Error',
  Callback: 'Callback',
  History: 'History',
};

const CUSTOM_FAILURE_CODE = 'com.liveperson.faas.handler.custom-failure';
const RUNTIME_ERROR_CODE = 'com.liveperson.faas.handler.runtime-exception';

function hasOptionals(optionals) {
  return optionals && optionals.length > 0;
}

function isRuntimeError(e) {
  return (
    !!e &&
    (e.constructor === TypeError ||
      e.constructor === SyntaxError ||
      e.constructor === ReferenceError)
  );
}

function isLoggableError(error) {
  return error && error.message;
}

class Logger {
  constructor(debug) {
    this.debug = debug;
    this.history = [];
  }

  writeLogs(level, message, ...optionalParams) {
    // if (!this.isDebugMode && level === LogLevels.Debug) return;
    if (this.debug) {
      if (Object.hasOwnProperty.call(message, 'errorMsg')) {
        stdout.log(`[${level}] - ${message.errorMsg}`, ...optionalParams);
      } else if (hasOptionals(optionalParams)) {
        stdout.log(`[${level}] - ${message}`, ...optionalParams);
      } else {
        stdout.log(`[${level}] - ${message}`);
      }
    }

    const log = {
      level,
      message,
      extras: optionalParams,
      timestamp: Date.now(),
    };
    this.history.push(log);
  }

  debug(message, ...optionalParams) {
    this.writeLogs(LogLevels.Debug, message, ...optionalParams);
  }

  info(message, ...optionalParams) {
    this.writeLogs(LogLevels.Info, message, ...optionalParams);
  }

  warn(message, ...optionalParams) {
    this.writeLogs(LogLevels.Warn, message, ...optionalParams);
  }

  error(message, ...optionalParams) {
    this.writeLogs(LogLevels.Error, message, ...optionalParams);
  }

  customError(message, ...optionalParams) {
    if (isLoggableError(message)) {
      if (message instanceof Error) {
        if (isRuntimeError(message)) {
          this.writeLogs(
            LogLevels.Error,
            { errorMsg: message.message, errorCode: RUNTIME_ERROR_CODE },
            ...optionalParams,
          );
        } else {
          this.writeLogs(
            LogLevels.Error,
            { errorMsg: message.message, errorCode: CUSTOM_FAILURE_CODE },
            ...optionalParams,
          );
        }
      } else {
        this.writeLogs(LogLevels.Error, message, ...optionalParams);
      }
    } else {
      this.notLoggableErrorWarning(message);
    }
  }

  response(message, ...optionalParams) {
    this.writeLogs(LogLevels.Callback, message, ...optionalParams);
  }

  printHistory() {
    stdout.log('[History]', this.getHistory());
  }

  getHistory() {
    return this.history;
  }

  notLoggableErrorWarning(error) {
    this.writeLogs(
      LogLevels.Warn,
      {
        errorMsg:
          'Received error in an incorrect format. Please provide an error object to the callback.',
        errorCode: CUSTOM_FAILURE_CODE,
      },
      {
        originalFailure: error,
      },
    );
  }
}

function convertToPromisifiedLambda(fn) {
  return (input) => {
    // eslint-disable-next-line consistent-return
    return new Promise((resolve, reject) => {
      try {
        // Resolving will be only possible via callback
        const callback = (err, response) => {
          if (err === undefined || err === null) {
            return resolve(response);
          }
          return reject(err);
        };
        const returnValue = fn(input, callback);

        if (returnValue && typeof returnValue.then === 'function') {
          // We only consider the result returned via the callback. However we will catch errors.
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return returnValue.then((_) => {}).catch(reject);
        }
      } catch (error) {
        return reject(error);
      }
    });
  };
}

module.exports = {
  proxy,
  DebugLogger: new Logger(true),
  InvokeLogger: new Logger(),
  LogLevels,
  convertToPromisifiedLambda,
};
