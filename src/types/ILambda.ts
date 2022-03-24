export interface IRuntime {
  uuid: string;
  name: string;
  baseImageName: string;
}

/**
 * Structure of the lambda
 * @export
 * @interface ILambda
 */
export interface ILambda {
  uuid: string;
  version: number;
  name: string;
  description: string;
  eventId: string;
  samplePayload: object;
  state: string;
  runtime: IRuntime;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  lastDeployment:
    | {
        uuid: string;
        name: string;
        lambdaUUID: string;
        lambdaVersion: 0;
        imageName: string;
        deploymentState: string;
        deploymentError: {
          errorCode: string;
          errorMsg: string;
          errorLogs: [
            {
              level: string;
              message: string;
              timestamp: number;
              extras: any[];
            },
          ];
        };
        createdAt: string;
        updatedAt: string;
        deployedAt: string;
        createdBy: string;
        updatedBy: string;
      }
    | Record<string, unknown>;
  implementation: {
    code: string;
    dependencies:
      | [
          {
            key: string;
            value: string;
          },
        ]
      | [];
    environmentVariables: [
      {
        key: string;
        value: string;
      },
    ];
  };
}
