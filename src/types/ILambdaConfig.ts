import { IPayload } from '../service/faas.service';

export interface ILambdaConfig {
  environmentVariables: IEnvironmentVariable[] | [];
  name: string;
  description: string;
  event: string;
  input: IPayload;
}

interface IEnvironmentVariable {
  key: string;
  value: string;
}
