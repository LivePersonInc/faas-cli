import { FaasService } from './faas.service';

export interface IFaasServiceFactory {
  get(accountId: string): FaasService;
}

export const factory = {
  async get(): Promise<FaasService> {
    return new FaasService().setup();
  },
};
