import { FaasService } from './faas.service';

let service: FaasService;

export interface IFaasServiceFactory {
  get(accountId: string): FaasService;
}

export const factory = {
  /**
   * Get a faas service instance
   * If not created, it will created one.
   * @returns {Promise<FaasService>} - faas service
   */
  async get(): Promise<FaasService> {
    if (service) {
      return service;
    }

    // eslint-disable-next-line require-atomic-updates
    service = await new FaasService().setup();
    return service;
  },
};
