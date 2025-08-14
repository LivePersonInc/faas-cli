/* eslint-disable no-useless-catch */
/* eslint-disable class-methods-use-this */
import { Got } from 'got/dist/source/types';
import {
  deploy,
  undeploy,
  getFunctionByUuid,
  invoke,
  getLimitCounts,
  getLambdaCounts,
  getInvocationCounts,
  getEvents,
  push,
  getAllFunctionMetas,
  getAllDeployments,
  pushManifest,
} from './faasEndpoint';
import { FileService } from '../../src/service/file.service';
import {
  IDeployment,
  IFaasServiceConfig,
} from '../../src/service/faas.service';
import { LoginController } from '../../src/controller/login.controller';
import { CsdsClient } from '../../src/service/csds.service';
import {
  LPFnMeta,
  LPFnMetaUpdateParams,
  LPFunction,
  LPManifestUpdateParams,
} from '../../src/types/IFunction';

export class FaasService {
  public username: string;

  public accountId: string | undefined;

  public userId: string | undefined;

  public token: string | undefined;

  public fileService: FileService;

  private readonly loginController: LoginController;

  private readonly csdsClient: CsdsClient;

  private readonly got: Got;

  constructor({ username }: Partial<IFaasServiceConfig> = {}) {
    this.username = username || 'cliUser';
    this.accountId = undefined;
    this.token = undefined;
    this.userId = undefined;
    this.fileService = new FileService();
  }

  public pull(): void {
    throw new Error('Method not implemented.');
  }

  public async getAccountStatistic() {
    return {
      numberOfFunctions: 1,
      numberOfInvocations: 123,
      numberOfDeployments: 1,
    };
  }

  public async undeploy(uuid: string) {
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

  public async deploy(uuid: string) {
    const urlPart = `/deployments/${uuid}`;
    try {
      const response = await this.doFetch({ urlPart, method: 'POST' });
      return {
        message: response.message,
      };
    } catch (error) {
      return {
        message: error.errorMsg,
        uuid,
      };
    }
  }

  public async getLambdasByNames(lambdaNames: string[]) {
    const urlPart = `/functions`;
    const allLambdas = await this.doFetch({
      urlPart,
      method: 'GET',
    });
    const existingFunctions = allLambdas.filter(({ name }) =>
      lambdaNames.includes(name),
    );

    const lambdas = (
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
    return lambdas;
  }

  public async getAllFunctionMetas() {
    const urlPart = `/functions`;
    return this.doFetch({ urlPart, method: 'GET' });
  }

  public async getFunctionByUuid(uuid: string) {
    const urlPart = `/functions/${uuid}`;
    try {
      const [foundLambda] = await this.doFetch({ urlPart, method: 'GET' });
      return foundLambda;
    } catch (error) {
      throw error;
    }
  }

  public async createSchedule(schedule): Promise<any> {
    return {
      uuid: '1111-2222-3333-4444',
      lambdaUUID: schedule.lambdaUUID,
      cronExpression: schedule.cronExpression,
      nextExecution: '2020-11-10T09:47:00.850Z',
      lastExecution: '2020-11-10T09:46:00.850Z',
      didLastExecutionFail: true,
      isActive: schedule.isActive,
      createdBy: 'user',
    };
  }

  public async push({
    body,
    uuid,
  }: {
    body: LPFunction;
    uuid: string;
  }): Promise<boolean> {
    try {
      await this.pushFunctionMeta(uuid, {
        description: body.description,
        skills: body.skills,
      });

      const manifestUpdate = await this.pushFunctionManifest(uuid, {
        ...body.manifest,
      });
      return manifestUpdate;
    } catch (error) {
      if (body.manifest?.code.includes('validation')) {
        throw new Error(
          `Push Error: The code of function '${body.name}' you are trying to push is not a valid lambda.`,
        );
      }
      throw new Error(error.errorMsg);
    }
  }

  public async invoke(uuid: string, payload: any) {
    const urlPart = `/functions/${uuid}/test`;
    try {
      return await this.doFetch({ urlPart, method: 'POST', body: payload });
    } catch (error) {
      throw error;
    }
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
          ...newManifest,
        },
      );
      return updateManifestResponse;
    } catch (error) {
      if (error.errorCode?.includes('validation')) {
        throw new Error(
          `Push Error: The code of function '${body.name}' you are trying to push is not a valid lambda.`,
        );
      }
      throw new Error(error.errorMsg);
    }
  }

  public async pushNewMeta(meta: LPFnMeta): Promise<LPFunction> {
    const response = await this.doFetch({
      urlPart: `/functions`,
      method: 'POST',
      body: meta,
    });
    return response;
  }

  public async pushFunctionMeta(
    uuid: string,
    meta: LPFnMetaUpdateParams,
  ): Promise<LPFunction | undefined> {
    try {
      const fn = await this.doFetch({
        urlPart: `/functions/${uuid}`,
        method: 'PUT',
        body: meta,
      });
      return fn;
    } catch (error) {
      if (
        error.errorCode &&
        error.errorCode === 'com.liveperson.faas.function.unchanged'
      ) {
        return undefined;
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
        body: { ...manifest },
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

  public async setup(): Promise<FaasService> {
    try {
      const tempFile = await this.fileService.getTempFile();
      const activeAccountId: string = Object.keys(tempFile).find(
        (e) => tempFile[e].active,
      ) as string;
      this.token = tempFile[activeAccountId].token;
      this.userId = tempFile[activeAccountId].userId;
      this.username = tempFile[activeAccountId].username;
      this.accountId = activeAccountId;
      return this;
    } catch {
      this.token = undefined;
      this.userId = undefined;
      return this;
    }
  }

  public async getEvents(): Promise<any> {
    return this.doFetch({ urlPart: '/events', method: 'GET' });
  }

  private async getCsdsEntry(csdsType: string): Promise<string> {
    return `${csdsType}.liveperson.com`;
  }

  public async getLogs(options: {
    uuid: string;
    start?: string;
    end?: string;
    levels?: string[];
    removeHeader?: boolean;
  }): Promise<void> {
    if (options.uuid === 'error') throw new Error('expected');
    else process.stdout.write(JSON.stringify(options)); // TODO WHAT IS THIS?
  }

  public async getLambdaInvocationMetrics(options: {
    uuid: string;
    startTimestamp: number;
    endTimestamp: number;
    bucketSize: any;
  }): Promise<any> {
    process.stdout.write(JSON.stringify(options));
    return {
      uuid: '7c44ffea-71e9-429f-bdad-1fade90329c4',
      invocationStatistics: [
        {
          from: options.startTimestamp ?? 1656420000000,
          to: options.endTimestamp ?? 1656420300000,
          UNKNOWN: 12,
          SUCCEEDED: 15,
          CODING_FAILURE: 34,
          PLATFORM_FAILURE: 84,
          TIMEOUT: 33,
        },
      ],
    };
  }

  // eslint-disable-next-line complexity
  private async doFetch({
    urlPart,
    method,
    additionalParams = '',
    body,
  }: {
    urlPart: string;
    method: 'POST' | 'GET' | 'DELETE' | 'PUT';
    additionalParams?: string;
    body?: any;
  }) {
    try {
      const domain = await this.getCsdsEntry('faasUI');
      const url = `https://${domain}/api/account/${this.accountId}${urlPart}?userId=${this.userId}${additionalParams}`;
      let response: any;
      if (method === 'POST' && urlPart.includes('test')) {
        response = invoke(url);
      } else if (
        (method === 'PUT' || method === 'POST') &&
        urlPart.includes('manifest')
      ) {
        response = pushManifest(body, method);
      } else if (
        (method === 'PUT' || method === 'POST') &&
        urlPart.includes('functions')
      ) {
        response = push(body, method);
      } else if (method === 'GET' && urlPart.includes('reports/limitCounts')) {
        response = getLimitCounts();
      } else if (method === 'GET' && urlPart.includes('reports/lambdaCounts')) {
        response = getLambdaCounts();
      } else if (
        method === 'GET' &&
        urlPart.includes('reports/invocationCounts')
      ) {
        response = getInvocationCounts();
      } else if (method === 'DELETE' && urlPart.includes('deployments')) {
        response = undeploy();
      } else if (method === 'GET' && urlPart.includes('deployments')) {
        response = getAllDeployments();
      } else if (method === 'POST' && urlPart.includes('deployments')) {
        response = deploy(url);
      } else if (method === 'GET' && urlPart.includes('functions/')) {
        response = getFunctionByUuid(url);
      } else if (method === 'GET' && urlPart.includes('/functions')) {
        response = getAllFunctionMetas(url);
      } else if (method === 'GET' && urlPart.includes('events')) {
        response = getEvents();
      }
      return JSON.parse(response?.body);
    } catch (error) {
      if (error.message?.includes('401')) {
        throw new Error('401 (Unauthorized)');
      }
      throw error;
    }
  }
}
