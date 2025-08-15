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
  LPFnMeta,
  LPFnMetaUpdateParams,
  LPFunction,
  LPManifestUpdateParams,
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
  // eslint-disable-next-line no-use-before-define
  setup(): Promise<FaasService>;

  undeploy(uuid: string): Promise<IDeploymentResponse>;

  deploy(uuid: string): Promise<IDeploymentResponse>;

  getLambdasByNames(
    lambdaNames: string[],
  ): Promise<(LPFunction | { name: string })[]>;

  getAllFunctionMetas(): Promise<IFunction[]>;

  getFunctionByUuid(uuid: string): Promise<IFunction>;

  push(input: { method: HttpMethods; body: LPFunction; uuid?: string }): void;

  invoke(uuid: string, payload: IPayload): Promise<unknown>;

  createSchedule(schedule: LPScheduleCreateParams): Promise<LPSchedule>;

  getLogs(options: {
    uuid: string;
    start?: string;
    end?: string;
    levels?: string[];
    removeHeader?: boolean;
  }): Promise<void>;

  // ✅ Newly added signatures:
  getAllFunctions(): Promise<LPFunction[]>;

  getAllDeployments(): Promise<IDeployment[]>;

  getLambdaInvocationMetrics(options: {
    uuid: string;
    startTimestamp: number;
    endTimestamp: number;
    bucketSize: any;
  }): Promise<any>;

  getAccountStatistic(): Promise<AccountStatistics>;

  pushNewFunction(input: { body: LPFunction }): Promise<boolean>;

  pushNewMeta(meta: LPFnMeta): Promise<LPFunction>;

  pushFunctionMeta(
    uuid: string,
    meta: LPFnMetaUpdateParams,
  ): Promise<LPFunction | boolean>;


  pushFunctionManifest(
    uuid: string,
    manifest: LPManifestUpdateParams,
  ): Promise<boolean>;

  getEvents(): Promise<any[]>;
}

export interface IFaasServiceConfig {
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

  public async getLambdasByNames(lambdaNames: string[]): Promise<LPFunction[]> {
    const allFnMetas = await this.getAllFunctionMetas();
    const existingFunctions = allFnMetas.filter(({ name }) =>
      lambdaNames.includes(name),
    );

    const fns = (
      await Promise.all(
        existingFunctions.map(async (existingFunction) => {
          const fn = await this.doFetch({
            urlPart: `/functions/${existingFunction.uuid}`,
            method: 'GET',
          });
          if (fn && fn.versions) {
            return { ...fn, manifest: fn.versions[0] };
          }
          return fn;
        }),
      )
    ).flat();
    return fns;
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

    const uuids = fnMetas.map(({ uuid }) => uuid);

    const fns = await Promise.all(
      uuids.map(async (uuid) => {
        const fn = await this.doFetch({
          urlPart: `/functions/${uuid}`,
          method: 'GET',
        });
        if (fn && fn.versions) {
          return { ...fn, manifest: fn.versions[0] };
        }
        return fn;
      }),
    );

    return fns;
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
    const additionalParams = `&startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}&bucketSize=${bucketSize}&invocationStates=UNKNOWN&invocationStates=SUCCEEDED&invocationStates=CODING_FAILURE&invocationStates=PLATFORM_FAILURE&invocationStates=TIMEOUT`;
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
      const fn = await this.pushFunctionMeta(uuid, {
        description: body.description,
        skills: body.skills,
      });

      const manifestUpdate = await this.pushFunctionManifest(uuid, {
        id: fn ? (fn as LPFunction).manifest.id : body.manifest.id,
        ...body.manifest,
      });
      return manifestUpdate;
    } catch (error) {
      if (error.errorCode?.includes('validation')) {
        throw new Error(
          `Function Validation Error: ${error.errorMsg || error.message}`,
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
        {
          id: newFunction.manifest.id,
          ...newManifest,
          version: newFunction.manifest.version,
        },
      );
      return updateManifestResponse;
    } catch (error) {
      if (error.errorCode?.includes('validation')) {
        throw new Error(
          `Function Validation Error: ${error.errorMsg || error.message}`,
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
      resolveBody: true,
    });
    return response;
  }

  public async pushFunctionMeta(
    uuid: string,
    meta: LPFnMetaUpdateParams,
  ): Promise<LPFunction | boolean> {
    try {
      const newMeta = await this.doFetch({
        urlPart: `/functions/${uuid}`,
        method: 'PUT',
        body: meta,
        resolveBody: false,
      });
      return newMeta.body;
    } catch (error) {
      if (
        error.errorCode &&
        error.errorCode === 'com.liveperson.faas.function.unchanged'
      ) {
        return false;
      }
      throw error;
    }
  }

  public async pushFunctionManifest(
    uuid: string,
    manifest: LPManifestUpdateParams,
  ): Promise<boolean> {
    try {
      await this.doFetch({
        urlPart: `/functions/${uuid}/manifest`,
        method: 'PUT',
        body: { version: -1, ...manifest },
        resolveBody: false,
      });
      return true;
    } catch (error) {
      if (
        error.errorCode &&
        error.errorCode === 'com.liveperson.faas.function.unchanged'
      ) {
        return false;
      }
      throw error;
    }
  }

  public async getFunctionByUuid(uuid: string): Promise<IFunction> {
    const urlPart = `/functions/${uuid}`;
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
          errorCode: error.response.body.code,
          errorMsg: error.response.body.message,
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
      if (error.response.statusCode === 401) {
        throw {
          errorCode: '401',
          errorMsg:
            'You are not authorized to perform this action, please check your permissions',
        };
      }

      throw {
        errorCode: error.response.body.code,
        errorMsg: error.response.body.message,
        ...(error.response.body.errorLogs && {
          errorLogs: error.response.body.errorLogs,
        }),
      };
    }
  }
}
