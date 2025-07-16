import got, { Got } from 'got';
import * as moment from 'moment';
import { Transform } from 'stream';
import { HttpsProxyAgent } from 'hpagent';
import {
  ILoginInformation,
  LoginController,
} from '../controller/login.controller';
import { IScheduleConfig } from '../controller/create.controller';
import { CsdsClient } from './csds.service';
import { LogsTransform } from '../transform/LogsTransform';
import {
  IFunction,
  LPFnManifest,
  LPFnMeta,
  LPFunction,
} from '../types/IFunction';
import { LPSchedule, LPScheduleCreateParams } from '../types/ISchedule';

export type HttpMethods = 'POST' | 'GET' | 'DELETE' | 'PUT';

export interface IPayload {
  headers: string[];
  payload: any;
}
export type AccountStatistics = {
  numberOfFunctions: number;
  numberOfInvocations: number;
  numberOfDeployments: number;
};

export interface IDeployment {
  id: number;
  functionUuid: string;
  manifestVersion: number;
  deploymentState: 'successful' | 'failed' | 'pending';
  createdAt: string;
  updatedAt: string;
  deployedAt: string;
  createdBy: string;
  updatedBy: string;
  functionSize: 'S' | 'M' | 'L';
}
export interface IInvokeResponse {
  result: any;
  logs: {
    level: string;
    message: any;
    extras: any[];
    timestamp: number;
  }[];
}

interface IFetchConfig {
  urlPart: string;
  method: HttpMethods;
  additionalParams?: string;
  body?: any;
  csds?: string;
  resolveBody?: boolean;
}

interface IGetStreamConfig {
  urlPart: string;
  additionalParams?: string;
  csds?: string;
}

export interface IDeploymentResponse {
  /**
   * Deployment message from the LivePerson functions platform
   * @type {string}
   * @memberof IDeploymentResponse
   */
  message: string;

  /**
   * UUID of the lambda that was deployed (optional)
   * @type {string}
   * @memberof IDeploymentResponse
   */
  uuid?: string;
}

export interface IFaaSService {
  /**
   * Runs the initial setup for the faas service.
   * Checks if a valid temp file is available and will use this for authentication.
   * If not, the user will have to enter his accountId, username and password.
   * Have to be called before all other functions.
   * @returns {Promise<FaasService>}
   * @memberof IFaaSService
   */
  // eslint-disable-next-line no-use-before-define
  setup(): Promise<FaasService>;

  /**
   * Undeploys a function on the LivePerson functions platform. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string} uuid - lambda uuid
   * @returns {Promise<void>}
   * @memberof IFaaSService
   */
  undeploy(uuid: string): Promise<IDeploymentResponse>;

  /**
   * Deploys a function on the LivePerson functions platform. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string} uuid - lambda uuid
   * @returns {Promise<void>}
   * @memberof IFaaSService
   */
  deploy(uuid: string): Promise<IDeploymentResponse>;

  /**
   * Gather all information from the LivePerson functions platform by lambda names. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string[]} lambdaNames - lambda names which should be collected
   * @returns {Promise<IFunction[]>}
   * @memberof IFaaSService
   */
  getLambdasByNames(
    lambdaNames: string[],
  ): Promise<(LPFunction | { name: string })[]>;

  /**
   * Gather all information from the LivePerson functions platform. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @returns {Promise<IFunction[]>}
   * @memberof IFaaSService
   */
  getAllFunctionMetas(): Promise<IFunction[]>;

  /**
   * Gather the information from one lambda by uuid. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string} uuid - lambda uuid
   * @returns {Promise<IFunction>}
   * @memberof IFaaSService
   */
  getFunctionByUuid(uuid: string): Promise<IFunction>;

  /**
   * Push a local lambda to the LP-Functions platform. Either creates
   * a new lambda or overwrites an existing one.
   * @param {Object} input - Object containing all the other inputs
   * @param {HttpMethods} input.method - The HTTP Method that will be used for the push request.
   * @param {LPFunction} input.body - The HTTP body that will be used for the push request.
   * @param {string} input.uuid - Uuid that identifies a lambda to overwrite on the LP-Functions platform.
   * Only needed if the function already exists.
   * @returns {Promise<void>}
   * @memberof IFaaSService
   */
  push(input: { method: HttpMethods; body: LPFunction; uuid?: string }): void;

  /**
   * Invokes a function on the LivePerson functions platform with a provided payload
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string} uuid
   * @param {IPayload} payload
   * @returns {Promise<unknown>}
   * @memberof IFaaSService
   */
  invoke(uuid: string, payload: IPayload): Promise<unknown>;

  /**
   * Creates a schedule in an account based on a cron expression and the lambda uuid. Every function can only be scheduled once and must be deployed.
   * @param uuid uuid of lambda for which a schedule will be created
   * @param cronExpression string which is in the cron expression format
   */
  createSchedule(schedule: LPScheduleCreateParams): Promise<LPSchedule>;

  /**
   * Get logs from the LivePerson functions platform by lambda names. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string} uuid uuid of lambda for which logs should be fetched
   * @param {number} start  start timestamp for logs
   * @param {number} end  end timestamp for logs
   * @param {string[]} levels  which is in the cron expression format
   * @returns {Promise<void>}
   * @memberof IFaaSService
   */
  getLogs(options: {
    uuid: string;
    start?: string;
    end?: string;
    levels?: string[];
    removeHeader?: boolean;
  }): Promise<void>;
}

interface IFaasServiceConfig {
  username?: string;
  loginController?: LoginController;
  csdsClient?: CsdsClient;
  gotDefault?: Got;
}

export class FaasService implements IFaaSService {
  public username: string;

  public accountId: string | undefined;

  public userId: string | undefined;

  public token: string | undefined;

  private readonly loginController: LoginController;

  private readonly csdsClient: CsdsClient;

  private readonly got: Got;

  constructor(
    /* istanbul ignore next */ {
      username,
      loginController = new LoginController(),
      csdsClient = new CsdsClient(),
      gotDefault = got,
    }: IFaasServiceConfig = {},
  ) {
    this.username = username || 'cliUser';
    this.accountId = undefined;
    this.token = undefined;
    this.userId = undefined;
    this.loginController = loginController;
    this.csdsClient = csdsClient;
    this.got = gotDefault;
  }

  public async undeploy(uuid: string): Promise<IDeploymentResponse> {
    const urlPart = `/deployments/${uuid}`;
    try {
      return await this.doFetch({ urlPart, method: 'DELETE' });
    } catch (error) {
      return {
        message: error.errorMsg,
        uuid,
      };
    }
  }

  public async deploy(uuid: string): Promise<IDeploymentResponse> {
    const urlPart = `/deployments/${uuid}`;
    try {
      const response = await this.doFetch({ urlPart, method: 'POST' });
      return response;
    } catch (error) {
      return {
        message: error.errorMsg,
        uuid,
      };
    }
  }

  public async getLambdasByNames(
    lambdaNames: string[],
    collectNonExistingLambas?: boolean,
  ): Promise<LPFunction[]> {
    const allFnMetas = await this.getAllFunctionMetas();
    return Promise.all(
      lambdaNames.map(async (name) => {
        const foundFnMeta = allFnMetas.find((e: LPFnMeta) => e.name === name);
        if (!foundFnMeta && !collectNonExistingLambas) {
          throw new Error(
            `Function ${name} were not found on the platform. Please make sure the function with the name ${name} was pushed to the LivePerson Functions platform`,
          );
        }

        const fn = await this.doFetch({
          urlPart: `/functions/${foundFnMeta.uuid}`,
          method: 'GET',
        });
        if (fn && fn.versions) {
          return { ...fn, manifest: fn.versions[0] };
        }
        return fn;
      }),
    );
  }

  public async getAllFunctionMetas(): Promise<LPFnMeta[]> {
    const urlPart = '/functions';
    return this.doFetch({ urlPart, method: 'GET' });
  }

  public async getAllFunctions(): Promise<LPFunction[]> {
    const urlPart = '/functions';
    const fnMetas = (await this.doFetch({
      urlPart,
      method: 'GET',
    })) as LPFnMeta[];

    return this.getLambdasByNames(fnMetas.map(({ name }) => name));
  }

  public async getAllDeployments(): Promise<IDeployment[]> {
    const urlPart = '/deployments';
    return this.doFetch({ urlPart, method: 'GET' });
  }

  public async createSchedule(schedule: IScheduleConfig): Promise<LPSchedule> {
    const urlPart = '/schedules';
    return this.doFetch({
      urlPart,
      method: 'POST',
      body: { ...schedule, uuid: '' },
    });
  }

  public async getLambdaInvocationMetrics({
    uuid,
    startTimestamp,
    endTimestamp,
    bucketSize,
  }: {
    uuid: string;
    startTimestamp: number;
    endTimestamp: number;
    bucketSize: any;
  }) {
    const url = `/reports/invocations/${uuid}`;
    const additionalParams = `&startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}&bucketSize=${bucketSize}&invocationStates=UNKOWN&invocationStates=SUCCEEDED&invocationStates=CODING_FAILURE&invocationStates=PLATFORM_FAILURE&invocationStates=TIMEOUT`;
    return this.doFetch({
      urlPart: url,
      additionalParams,
      method: 'GET',
    });
  }

  public async getAccountStatistic(): Promise<AccountStatistics> {
    const lambdaCountsUrl = '/functions/count';
    const deploymentUrl = '/deployments/count';
    const invocationUrl = '/reports/invocationCounts';

    const currentDate = Date.now();

    const firstDayOfMonth = moment.utc().startOf('month').format('x');

    const lambdaCounts = this.doFetch({
      urlPart: lambdaCountsUrl,
      method: 'GET',
    });

    const invocations = this.doFetch({
      urlPart: invocationUrl,
      method: 'GET',
      additionalParams: `&startTimestamp=${firstDayOfMonth}&endTimestamp=${currentDate}`,
    });

    const deployments = this.doFetch({
      urlPart: deploymentUrl,
      method: 'GET',
    });

    const results = await Promise.all([lambdaCounts, invocations, deployments]);

    return {
      numberOfFunctions: results[0],
      numberOfInvocations: results[1].reduce(
        (acc, fn) => fn.successfulInvocations + fn.failedInvocations + acc,
        0,
      ),
      numberOfDeployments: results[2],
    };
  }

  public async push({
    body,
    uuid,
  }: {
    body: LPFunction;
    uuid?: string;
  }): Promise<boolean> {
    try {
      const manifestUpdate = await this.pushFunctionManifest(
        uuid,
        body.manifest,
      );
      const metaUpdate = this.pushFunctionMeta(uuid, {
        description: body.description,
        skills: body.skills,
      });
      const updates = await Promise.all([manifestUpdate, metaUpdate]);
      return updates.some((u) => !!u);
    } catch (error) {
      if (error.errorCode?.includes('contract-error')) {
        throw new Error(
          `Push Error: The code of function '${body.name}' you are trying to push is not a valid lambda.`,
        );
      }
      throw new Error(error.errorMsg || error.message);
    }
  }

  public async pushNewFunction({
    body,
  }: {
    body: LPFunction;
  }): Promise<boolean> {
    try {
      const { manifest: newManifest, ...newMeta } = body;
      const newFunction = await this.pushNewMeta(newMeta);
      const updateManifestResponse = await this.pushFunctionManifest(
        newFunction.uuid,
        newManifest,
      );
      return updateManifestResponse;
    } catch (error) {
      if (error.errorCode?.includes('contract-error')) {
        throw new Error(
          `Push Error: The code of function '${body.name}' you are trying to push is not a valid lambda.`,
        );
      }
      throw new Error(error.errorMsg || error.message);
    }
  }

  public async pushNewMeta(meta: LPFnMeta): Promise<LPFunction> {
    const response = await this.doFetch({
      urlPart: `/functions`,
      method: 'POST',
      body: meta,
      resolveBody: false,
    });
    return response.body;
  }

  public async pushFunctionMeta(
    uuid: string,
    meta: Pick<LPFnMeta, 'description' | 'skills'>,
  ): Promise<boolean> {
    const response = await this.doFetch({
      urlPart: `/functions/${uuid}`,
      method: 'PUT',
      body: meta,
      resolveBody: false,
    });
    // TODO THIS IS NOT SENDING 304s on FAILURE
    return response.statusCode !== 304;
  }

  public async pushFunctionManifest(
    uuid: string,
    manifest: LPFnManifest,
  ): Promise<boolean> {
    const response = await this.doFetch({
      urlPart: `/functions/${uuid}/manifest`,
      method: 'PUT',
      body: { versoion: 123, ...manifest },
      resolveBody: false,
    });
    // TODO THIS IS NOT SENDING 304s on FAILURE
    return response.statusCode !== 304;
  }

  public async getFunctionByUuid(uuid: string): Promise<IFunction> {
    const urlPart = `/lambdas/${uuid}`;
    const [foundLambda] = await this.doFetch({ urlPart, method: 'GET' });
    return foundLambda;
  }

  public async invoke(uuid: string, payload: IPayload): Promise<unknown> {
    const urlPart = `/functions/${uuid}/test`;
    return this.doFetch({
      urlPart,
      method: 'POST',
      body: payload,
    });
  }

  public async getEvents(): Promise<any[]> {
    return this.doFetch({ urlPart: '/events', method: 'GET' });
  }

  public async getLogs({
    uuid,
    start,
    end,
    levels,
    removeHeader,
  }: {
    uuid: string;
    start?: string;
    end?: string;
    levels?: string[];
    removeHeader?: boolean;
  }): Promise<void> {
    const urlPart = `/functions/${uuid}/logs/export`;
    let additionalParams = `&startTimestamp=${start}&endTimestamp=${
      end || Date.now()
    }`;

    if (levels && levels.length > 0) {
      levels.forEach((level) => {
        additionalParams += `&filterLevels=${level}`;
      });
    }
    return this.getStream(
      {
        urlPart,
        additionalParams,
      },
      new LogsTransform(removeHeader),
    );
  }

  public async setup(): Promise<FaasService> {
    try {
      const { token, userId, username, accountId }: ILoginInformation =
        await this.loginController.getLoginInformation();
      this.token = token;
      this.userId = userId;
      this.username = username;
      this.accountId = accountId;
      return this;
    } catch {
      this.token = undefined;
      this.userId = undefined;
      return this;
    }
  }

  private async getCsdsEntry(csdsType: string): Promise<string> {
    return this.csdsClient.getUri(this.accountId as string, csdsType);
  }

  private async getStream(
    { urlPart, additionalParams = '', csds = 'faasUI' }: IGetStreamConfig,
    transformer: Transform,
  ): Promise<void> {
    try {
      const domain = await this.getCsdsEntry(csds);
      const url = `https://${domain}/api/account/${this.accountId}${urlPart}?userId=${this.userId}${additionalParams}`;
      const { HTTPS_PROXY, https_proxy: httpsProxy } = process.env;
      const proxyURL = HTTPS_PROXY || httpsProxy || '';
      await new Promise<void>((resolve, reject) => {
        this.got
          .stream(url, {
            headers: {
              Authorization: `Bearer ${this.token}`,
              'Content-Type': 'application/json',
              'user-agent': 'faas-cli',
            },
            ...(proxyURL && {
              agent: {
                https: new HttpsProxyAgent({
                  keepAlive: true,
                  keepAliveMsecs: 1000,
                  maxSockets: 256,
                  maxFreeSockets: 256,
                  scheduling: 'lifo',
                  proxy: proxyURL,
                }),
              },
            }),
            responseType: 'json',
          })
          .on('error', (e) => {
            reject(e);
          })
          .pipe(transformer)
          .on('finish', () => {
            resolve();
          });
      });
    } catch (error) {
      /* eslint-disable no-throw-literal */
      if (error.message?.includes('401')) {
        throw {
          errorCode: '401',
          errorMsg:
            'You are not authorized to perform this action, please check your permissions',
        };
      }
      if (error.response?.body) {
        throw {
          errorCode: error.response.body.errorCode,
          errorMsg: error.response.body.errorMsg,
          ...(error.response.body.errorLogs && {
            errorLogs: error.response.body.errorLogs,
          }),
        };
      }
      throw error;
      /* eslint-enable no-throw-literal */
    }
  }

  private async doFetch({
    urlPart,
    method,
    additionalParams = '',
    body,
    csds = 'faasUI',
    resolveBody = true,
  }: IFetchConfig): Promise<any> {
    try {
      const domain = await this.getCsdsEntry(csds);
      const url = `https://${domain}/api/account/${this.accountId}${urlPart}?userId=${this.userId}${additionalParams}`;
      const { HTTPS_PROXY, https_proxy: httpsProxy } = process.env;
      const proxyURL = HTTPS_PROXY || httpsProxy || '';
      const response = await this.got(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'user-agent': 'faas-cli',
        },
        ...(proxyURL && {
          agent: {
            https: new HttpsProxyAgent({
              keepAlive: true,
              keepAliveMsecs: 1000,
              maxSockets: 256,
              maxFreeSockets: 256,
              scheduling: 'lifo',
              proxy: proxyURL,
            }),
          },
        }),
        responseType: 'json',
        ...(body && { json: { timestamp: 0, ...body } }),
      });
      return resolveBody ? response.body : response;
    } catch (error) {
      /* eslint-disable no-throw-literal */
      if (error.message?.includes('401')) {
        throw {
          errorCode: '401',
          errorMsg:
            'You are not authorized to perform this action, please check your permissions',
        };
      }
      throw {
        errorCode: error.response.body.errorCode,
        errorMsg: error.response.body.errorMsg,
        ...(error.response.body.errorLogs && {
          errorLogs: error.response.body.errorLogs,
        }),
      };
      /* eslint-enable no-throw-literal */
    }
  }
}
