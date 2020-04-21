import { join } from 'path';
import { FileService } from '../../src/service/file.service';

const fileService = new FileService();

function getUserId(uri: string) {
  const userIdRegex = new RegExp(/userId=(userId_.*)&v=1/);
  const userId = new RegExp(userIdRegex).exec(uri) as any[];
  return userId[1];
}

function getFunctionname(uri: string) {
  const functionNameRegex = new RegExp(/&name=(.*)/);
  const functionName = new RegExp(functionNameRegex).exec(uri) as any[];
  return functionName[1];
}

export function getAllLambdas(url: string) {
  let foundLambdas = [];
  if (getUserId(url) === 'userId_1234_NoLambdas') {
    return {
      body: JSON.stringify(foundLambdas),
    };
  }
  const allLambdas = fileService.read(join(__dirname, 'lambdas.json'));
  foundLambdas = allLambdas.filter((e: any) => e.userId === getUserId(url));
  if (url.includes('name=')) {
    const functionName = getFunctionname(url);
    foundLambdas = foundLambdas.filter((e: any) => e.name === functionName);
  }
  allLambdas[0].state = 'Draft';
  allLambdas[1].state = 'Modified';
  return {
    body: JSON.stringify(foundLambdas),
  };
}

export function deploy(url: string) {
  if (getUserId(url).includes('under_deployment')) {
    // eslint-disable-next-line no-throw-literal
    throw {
      error: {
        errorMsg: 'Can not deploy a lambda during an active deployment',
      },
    };
  } else {
    let allLambdas = fileService.read(join(__dirname, 'lambdas.json'));
    allLambdas = allLambdas.map((e: any) => ({ ...e, state: 'Draft' }));
    fileService.write(join(__dirname, 'lambdas.json'), allLambdas);
    return {
      body: JSON.stringify({
        message: 'Successfully started deployment',
      }),
    };
  }
}

export function undeploy() {
  let allLambdas = fileService.read(join(__dirname, 'lambdas.json'));
  allLambdas = allLambdas.map((e: any) => ({ ...e, state: 'Productive' }));
  fileService.write(join(__dirname, 'lambdas.json'), allLambdas);
  return {
    body: JSON.stringify({
      message: 'Successfully started undeployment',
    }),
  };
}

function getUUID(uri: string) {
  const uuidRegex = new RegExp(
    /[\dA-F]{8}-[\dA-F]{4}-4[\dA-F]{3}-[89AB][\dA-F]{3}-[\dA-F]{12}/,
    'i',
  );
  const uuid = new RegExp(uuidRegex).exec(uri) as any[];
  return uuid[0];
}

function resetAttempts() {
  let allLambdas = fileService.read(join(__dirname, 'lambdas.json'));
  allLambdas = allLambdas.map((e: any) => ({ ...e, attempts: 0 }));
  fileService.write(join(__dirname, 'lambdas.json'), allLambdas);
}

export function getLambdaByUUID(url: string) {
  const allLambdas: any[] = fileService.read(join(__dirname, 'lambdas.json'));

  const index = allLambdas.findIndex(
    (e: any) => e.userId === getUserId(url) && e.uuid === getUUID(url),
  );
  allLambdas[index] = {
    ...allLambdas[index],
    attempts: allLambdas[index].attempts + 1,
  };
  fileService.write(join(__dirname, 'lambdas.json'), allLambdas);
  const lambda = allLambdas.filter(
    (e: any) => e.userId === getUserId(url) && e.uuid === getUUID(url),
  );

  if (allLambdas[index].attempts === 3) {
    lambda[0].state = lambda[0].state === 'Draft' ? 'Productive' : 'Draft';
    resetAttempts();
  }
  return {
    body: JSON.stringify(lambda),
  };
}

// eslint-disable-next-line consistent-return
export function invoke(url: string) {
  if (getUserId(url).includes('invoke_remote_success')) {
    return {
      body: JSON.stringify({
        result: 'StatusCode: 200',
        logs: [
          {
            level: 'Info',
            message: 'Secret Value: ',
            extras: ['TestValue'],
            timestamp: 1582625786150,
          },
        ],
      }),
    };
  }
  if (getUserId(url).includes('userId_invoke_remote_error')) {
    return {
      body: JSON.stringify({
        errorCode: 'com.liveperson.faas.handler.custom-failure',
        errorMsg: 'There is no Secret TestKey for this account',
        errorLogs: [
          {
            level: 'Error',
            message:
              'Failed during secret operation with There is no Secret TestKey for this account',
            extras: [],
            timestamp: 1582624673882,
          },
          {
            level: 'Error',
            message:
              'Received Error - There is no Secret TestKey for this account',
            extras: [],
            timestamp: 1582624673882,
          },
        ],
      }),
    };
  }
}

export function getLimitCounts() {
  return {
    body: JSON.stringify({
      limitTotalLambdas: 50,
      limitDeployedLambdas: 50,
      invocationLimitPerMonth: 150000,
    }),
  };
}
export function getLambdaCounts() {
  return {
    body: JSON.stringify({
      accountId: '123456789',
      total: 3,
      deployed: 3,
    }),
  };
}
export function getInvocationCounts() {
  return {
    body: JSON.stringify({
      accountId: '123456789',
      successfulInvocations: 0,
      unsuccessfulInvocations: 0,
    }),
  };
}

resetAttempts();
