import { IPayload } from '../service/faas.service';

interface IEnvironmentVariable {
  key: string;
  value: string;
}
export interface IFunctionConfig {
  environmentVariables: IEnvironmentVariable[] | [];
  name: string;
  description: string;
  event: string;
  input: IPayload;
}
