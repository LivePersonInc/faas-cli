/* eslint-disable no-useless-catch */
/* eslint-disable class-methods-use-this */
import {
  getAllLambdas,
  deploy,
  undeploy,
  getLambdaByUUID,
  invoke,
  getLimitCounts,
  getLambdaCounts,
  getInvocationCounts,
  getEvents,
  push,
} from './faasEndpoint';
import { FileService } from '../../src/service/file.service';
import { ILambda, IRuntime } from '../../src/types';
import { HttpMethods } from '../../src/service/faas.service';

export class FaasService {
  public username: string;

  public accountId: string | undefined;

  public userId: string | undefined;

  public token: string | undefined;

  public fileService: FileService;

  constructor({
    username,
    fileService = new FileService(),
  }: { username?: string; fileService?: FileService } = {}) {
    this.username = username || 'cliUser';
    this.accountId = undefined;
    this.token = undefined;
    this.userId = undefined;
    this.fileService = fileService;
  }

  public pull(): void {
    throw new Error('Method not implemented.');
  }

  public async getAccountStatistic() {
    const limitCountsUrl = '/reports/limitCounts';
    const lambdaCountsUrl = '/reports/lambdaCounts';
    const invocationUrl = '/reports/invocationCounts';

    const date = new Date();
    const currentDate = date.getTime();
    const firstDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
      1,
    ).getTime();

    const limitCounts = await this.doFetch({
      urlPart: limitCountsUrl,
      method: 'GET',
    });
    const lambdaCounts = await this.doFetch({
      urlPart: lambdaCountsUrl,
      method: 'GET',
    });
    const invocations = await this.doFetch({
      urlPart: invocationUrl,
      method: 'GET',
      additionalParams: `&startTimestamp=${firstDayOfMonth}&endTimestamp=${currentDate}`,
    });

    return (await Promise.all([limitCounts, lambdaCounts, invocations])).reduce(
      (acc, e) => ({ ...acc, ...e }),
      {},
    );
  }

  public async undeploy(uuid: string) {
    const urlPart = `/deployments/${uuid}`;
    try {
      const response = await this.doFetch({ urlPart, method: 'DELETE' });
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

  public async getAllLambdas() {
    const urlPart = `/lambdas`;
    try {
      return await this.doFetch({ urlPart, method: 'GET' });
    } catch (error) {
      throw error;
    }
  }

  public async getLambdasByNames(
    lambdaNames: string[],
    collectNonExistingLambas?: boolean,
  ) {
    const urlPart = `/lambdas`;
    try {
      return await Promise.all(
        lambdaNames.map(async (name) => {
          const [foundLambdas] = await this.doFetch({
            urlPart,
            method: 'GET',
            additionalParams: `&name=${name}`,
          });
          if (!foundLambdas && !collectNonExistingLambas) {
            throw new Error(
              `Function ${name} were not found on the platform. Please make sure the function with the name ${name} was pushed to the LivePerson Functions platform`,
            );
          }
          return foundLambdas || { name };
        }),
      );
    } catch (error) {
      throw error;
    }
  }

  public async getLambdaByUUID(uuid: string) {
    const urlPart = `/lambdas/${uuid}`;
    try {
      const response = await this.doFetch({ urlPart, method: 'GET' });
      return response[0];
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

  public async addDomain(domain: string): Promise<any> {
    return {
      id: '1111-2222-3333-4444',
      domain,
      additionalProp1: {},
    };
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
      const response = await this.doFetch({ urlPart, method, body });
      return response.statusCode !== 304;
    } catch (error) {
      if (body.implementation.code.includes('lammbda')) {
        throw new Error(
          `Push Error: The code of function '${body.name}' you are trying to push is not a valid lambda.`,
        );
      }
      throw new Error(error.errorMsg);
    }
  }

  public async getRuntime(): Promise<IRuntime> {
    return {
      baseImageName: 'baseImage',
      name: 'Node.js 10',
      uuid: 'Runtime-uuid',
    };
  }

  public async invoke(uuid: string, payload: any) {
    const urlPart = `/lambdas/${uuid}/invoke`;
    try {
      return await this.doFetch({ urlPart, method: 'POST', body: payload });
    } catch (error) {
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
    else process.stdout.write(JSON.stringify(options));
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
      const url = `https://${domain}/api/account/${this.accountId}${urlPart}?userId=${this.userId}&v=1${additionalParams}`;
      let response: any;
      if (method === 'POST' && urlPart.includes('invoke')) {
        response = invoke(url);
      } else if ((method === 'PUT' || method === 'POST') && urlPart.includes('lambdas')) {
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
      } else if (method === 'POST' && urlPart.includes('deployments')) {
        response = deploy(url);
      } else if (method === 'GET' && urlPart.includes('lambdas/')) {
        response = getLambdaByUUID(url);
      } else if (method === 'GET' && urlPart.includes('lambdas')) {
        response = getAllLambdas(url);
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
