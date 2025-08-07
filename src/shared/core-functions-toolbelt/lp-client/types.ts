import { WellKnownLPServices } from './lpServices.js';

export type ILpClientOptions = { appKeySecretName?: string } & RequestInit;

export type ILpClient = (service: WellKnownLPServices | string, path: string, options: ILpClientOptions) => Promise<Response>;
