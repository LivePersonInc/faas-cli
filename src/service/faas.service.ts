import got, { Got } from 'got';
import * as moment from 'moment';
import { Transform } from 'stream';
import {
  ILoginInformation,
  LoginController,
} from '../controller/login.controller';
import { ILambda, IRuntime, ISchedule, IDomain } from '../types';
import { IScheduleConfig } from '../controller/create.controller';
import { CsdsClient } from './csds.service';
import { LogsTransform } from '../transform/LogsTransform';

export type HttpMethods = 'POST' | 'GET' | 'DELETE' | 'PUT';

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
  setup(): Promise<FaasService>;

  /**
   * Undeploys a function on the LivePerson functions platform. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string} uuid - lambda uuid
   * @returns {Promise<IDeploymentResponse>}
   * @memberof IFaaSService
   */
  undeploy(uuid: string): Promise<IDeploymentResponse>;

  /**
   * Deploys a function on the LivePerson functions platform. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string} uuid - lambda uuid
   * @returns {Promise<IDeploymentResponse>}
   * @memberof IFaaSService
   */
  deploy(uuid: string): Promise<IDeploymentResponse>;

  /**
   * Gather all information from the LivePerson functions platform by lambda names. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string[]} lambdaNames - lambda names which should be collected
   * @returns {Promise<ILambda[]>}
   * @memberof IFaaSService
   */
  getLambdasByNames(
    lambdaNames: string[],
  ): Promise<(ILambda | { name: string })[]>;

  /**
   * Gather all information from the LivePerson functions platform. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @returns {Promise<ILambda[]>}
   * @memberof IFaaSService
   */
  getAllLambdas(): Promise<ILambda[]>;

  /**
   * Gather the information from one lambda by uuid. Setup before is necessary.
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string} uuid - lambda uuid
   * @returns {Promise<ILambda>}
   * @memberof IFaaSService
   */
  getLambdaByUUID(uuid: string): Promise<ILambda>;

  /**
   * Push a local lambda to the LP-Functions platform. Either creates
   * a new lambda or overwrites an existing one.
   * @param {Object} input - Object containing all the other inputs
   * @param {HttpMethods} input.method - The HTTP Method that will be used for the push request.
   * @param {ILambda} input.body - The HTTP body that will be used for the push request.
   * @param {string} input.uuid - Uuid that identifies a lambda to overwrite on the LP-Functions platform.
   * Only needed if the function already exists.
   * @returns {Promise<void>}
   * @memberof IFaaSService
   */
  push(input: { method: HttpMethods; body: ILambda; uuid?: string }): void;

  /**
   * Return the current runtime of the LivePerson functions platform
   * The correct LivePerson url will be fetched by the accountId.
   * @returns {Promise<IRuntime>}
   * @memberof IFaaSService
   */
  getRuntime(): Promise<IRuntime>;

  /**
   * Invokes a function on the LivePerson functions platform with a provided payload
   * The correct LivePerson url will be fetched by the accountId.
   * @param {string} uuid
   * @param {IPayload} payload
   * @returns {Promise<IInvokeResponse>}
   * @memberof IFaaSService
   */
  invoke(uuid: string, payload: IPayload): Promise<IInvokeResponse>;

  /**
   * Creates a schedule in an account based on a cron expression and the lambda uuid. Every function can only be scheduled once and must be deployed.
   * @param uuid uuid of lambda for which a schedule will be created
   * @param cronExpression string which is in the cron expression format
   */
  createSchedule(schedule: {
    uuid: string;
    cronExpression: string;
  }): Promise<ISchedule>;

  /**
   * Creates a schedule in an account based on a cron expression and the lambda uuid. Every function can only be scheduled once and must be deployed.
   * @param uuid uuid of lambda for which a schedule will be created
   * @param cronExpression string which is in the cron expression format
   */
  addDomain(domain: string): Promise<IDomain>;

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

export interface IPayload {
  headers: string[];
  payload: any;
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
  ): Promise<(ILambda | { name: string })[]> {
    const url = '/lambdas';
    return Promise.all(
      lambdaNames.map(async (name) => {
        const lambdas = await this.doFetch({
          urlPart: url,
          method: 'GET',
          additionalParams: `&name=${name}`,
        });
        const [foundLambda] = lambdas.filter((e: ILambda) => e.name === name);
        if (!foundLambda && !collectNonExistingLambas) {
          throw new Error(
            `Function ${name} were not found on the platform. Please make sure the function with the name ${name} was pushed to the LivePerson Functions platform`,
          );
        }
        return foundLambda || { name };
      }),
    );
  }

  public async getRuntime(): Promise<IRuntime> {
    const url = '/runtimes';
    const [runtime] = await this.doFetch({ urlPart: url, method: 'GET' });
    return runtime;
  }

  public async getAllLambdas(): Promise<ILambda[]> {
    const urlPart = '/lambdas';
    return this.doFetch({ urlPart, method: 'GET' });
  }

  public async createSchedule(schedule: IScheduleConfig): Promise<ISchedule> {
    const urlPart = '/schedules';
    return this.doFetch({
      urlPart,
      method: 'POST',
      body: { ...schedule, uuid: '' },
    });
  }

  public async addDomain(domain: string): Promise<IDomain> {
    return this.doFetch({
      urlPart: '/proxy-settings',
      method: 'POST',
      body: {
        domain,
        id: -1,
      },
    });
  }

  public async getAccountStatistic(): Promise<any> {
    const limitCountsUrl = '/reports/limitCounts';
    const lambdaCountsUrl = '/reports/lambdaCounts';
    const invocationUrl = '/reports/invocationCounts';

    const currentDate = Date.now();

    const firstDayOfMonth = moment.utc().startOf('month').format('x');

    const limitCounts = this.doFetch({
      urlPart: limitCountsUrl,
      method: 'GET',
    });
    const lambdaCounts = this.doFetch({
      urlPart: lambdaCountsUrl,
      method: 'GET',
    });
    const invocations = this.doFetch({
      urlPart: invocationUrl,
      method: 'GET',
      additionalParams: `&startTimestamp=${firstDayOfMonth}&endTimestamp=${currentDate}`,
    });

    return (await Promise.all([limitCounts, lambdaCounts, invocations])).reduce(
      (acc, e) => ({ ...acc, ...e }),
      {},
    );
  }

  public async push({
    method,
    body,
    uuid,
  }: {
    method: HttpMethods;
    body: ILambda;
    uuid?: string;
  }): Promise<boolean> {
    try {
      const urlPart = `/lambdas${uuid ? `/${uuid}` : ''}`;
      const response = await this.doFetch({
        urlPart,
        method,
        body,
        resolveBody: false,
      });
      return response.statusCode !== 304;
    } catch (error) {
      if (error.errorCode?.includes('contract-error')) {
        throw new Error(
          `Push Error: The code of function '${body.name}' you are trying to push is not a valid lambda.`,
        );
      }
      throw new Error(error.errorMsg || error.message);
    }
  }

  public async getLambdaByUUID(uuid: string): Promise<ILambda> {
    const urlPart = `/lambdas/${uuid}`;
    const [foundLambda] = await this.doFetch({ urlPart, method: 'GET' });
    return foundLambda;
  }

  public async invoke(
    uuid: string,
    payload: IPayload,
  ): Promise<IInvokeResponse> {
    const urlPart = `/lambdas/${uuid}/invoke`;
    return this.doFetch({
      urlPart,
      method: 'POST',
      body: payload,
      csds: 'faasGW',
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
    const urlPart = '/logs/export';
    let additionalParams = `&lambdaUUID=${uuid}&startTimestamp=${start}&endTimestamp=${
      end || Date.now()
    }`;

    if (levels && levels.length > 0) {
      for (const level of levels) {
        additionalParams += `&filterLevels=${level}`;
      }
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
      const {
        token,
        userId,
        username,
        accountId,
      }: ILoginInformation = await this.loginController.getLoginInformation();
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
      const url = `https://${domain}/api/account/${this.accountId}${urlPart}?userId=${this.userId}&v=1${additionalParams}`;
      await new Promise<void>((resolve, reject) => {
        this.got
          .stream(url, {
            headers: {
              Authorization: `Bearer ${this.token}`,
              'Content-Type': 'application/json',
              'user-agent': 'faas-cli',
            },
            responseType: 'json',
          })
          .on('error', (e) => {
            reject(e);
          })
          .pipe(transformer)
          .on('finish', function () {
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
      const url = `https://${domain}/api/account/${this.accountId}${urlPart}?userId=${this.userId}&v=1${additionalParams}`;
      const response = await this.got(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'user-agent': 'faas-cli',
        },
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
