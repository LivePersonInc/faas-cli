import { LPFunction } from '../../src/types/IFunction';

export const mockLoginInformation = {
  token: 'aReallyToken',
  userId: 'userId',
  username: 'username',
  accountId: '123456789',
};

export const mockUndeployResponse = {
  message: 'started undeployment process',
};

export const mockDeployResponse = {
  message: 'started deployment process',
};

export const mockErrorResponse = (message: string, uuid?: string) => ({
  message,
  ...(uuid && { uuid }),
});

export const mockAllFunctionMetas = [
  {
    uuid: '123-123-123',
    name: 'lambda1',
    description: 'test',
    state: 'Draft',
    isCompV1: false,
  },
  {
    uuid: '456-456-456',
    name: 'lambda2',
    description: 'test2',
    state: 'Productive',
    isCompV1: false,
  },
];

export const mockFunction1: LPFunction = {
  uuid: '123-123-123',
  name: 'lambda1',
  description: 'test',
  state: 'Draft',
  isCompV1: false,
  skills: [],
  manifest: {
    id: 'manifest-1',
    version: 1,
    runtime: 'nodejs14.x',
    spec: 'v1.0.0',
    code: 'function handler() {}',
    customDependencies: {},
    environment: {},
  },
};

export const mockFunction2: LPFunction = {
  uuid: '456-456-456',
  name: 'lambda2',
  description: 'test2',
  state: 'Productive',
  isCompV1: false,
  skills: [],
  manifest: {
    id: 'manifest-2',
    version: 1,
    runtime: 'nodejs14.x',
    spec: 'v1.0.0',
    code: 'function handler2() {}',
    customDependencies: {},
    environment: {},
  },
};

export const mockInvokeResponse = {
  result: 'StatusCode: 200',
  logs: [
    {
      level: 'Info',
      message: 'Secret Value: ',
      extras: ['TestValue'],
      timestamp: 1583241003935,
    },
    {
      level: 'Info',
      message: 'PROCESS ENV',
      extras: ['TestValue'],
      timestamp: 1583241003935,
    },
  ],
};

export const mockLogs = {
  header: 'lambdaUUID;requestID;timestamp;level;message;extras',
  data: '9db52a6a-fd2d-47cf-926d-f7c958391ba1;9636597d-238c-fb4e-1f70-eeff5248b20c;1626330360217;Info;info log 1626330360217;[]\n9db52a6a-fd2d-47cf-926d-f7c958391ba1;9636597d-238c-fb4e-1f70-eeff5248b20c;1626330360217;Warn;warn log 1626330360217;[]\n9db52a6a-fd2d-47cf-926d-f7c958391ba1;9636597d-238c-fb4e-1f70-eeff5248b20c;1626330360217;Error;error log 1626330360217;[]',
};

export const mockInvocationMetrics = {
  name: '345678ertzui',
  uuid: '7c44ffea-71e9-429f-bdad-1fade90329c4',
  invocationStatistics: {
    CODING_FAILURE: 0,
    PLATFORM_FAILURE: 0,
    SUCCEEDED: 0,
    TIMEOUT: 0,
    UNKNOWN: 0,
    from: 1656680700000,
    to: 1656681000000,
  },
};

export const mockSchedule = {
  createdBy: 'LPA-man',
  cronExpression: '* * * *',
  didLastExecutionFail: true,
  isActive: true,
  lambdaUUID: '1234-1234-1234',
  lastExecution: '11-12-13',
  nextExecution: '12-13-14',
  uuid: '4321-4321-4321',
};

export const mockEvents = ['Event', 'Event'];

export const mockDeployments = [
  {
    id: 1,
    functionUuid: '123-123-123',
    manifestVersion: 1,
    deploymentState: 'successful',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    deployedAt: '2023-01-01T00:00:00Z',
    createdBy: 'testUser',
    updatedBy: 'testUser',
    functionSize: 'S',
  },
  {
    id: 2,
    functionUuid: '456-456-456',
    manifestVersion: 2,
    deploymentState: 'failed',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    deployedAt: '2023-01-02T00:00:00Z',
    createdBy: 'testUser2',
    updatedBy: 'testUser2',
    functionSize: 'M',
  },
];

export const mockAccountStatistic = {
  numberOfFunctions: 5,
  numberOfInvocations: 28,
  numberOfDeployments: 8,
};
