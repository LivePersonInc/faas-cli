export type LPFnDeploymentSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export type LPFnMeta = {
  /**
   * UUID that is unique for a each function
   *
   * @maxLength 36
   */
  uuid: string;
  /**
   * Name of the function, which is unique per brand.
   *
   * @maxLength 50
   */
  name: string;
  /**
   * Description of the function.
   *
   * @maxLength 200
   */
  description: string;
  /**
   * The current state of the function.
   *
   * @maxLength 30
   */
  state: string;

  /**
   * The skill identifiers to which the function reacts.
   *
   * @maxLength 500
   */
  skills?: string[];

  /**
   * The event id on which the function reacts. It can only be set during creation.
   * You may not modify it during an update, otherwise you receive an exception.
   * If no event id is provided, the function can only be invoked directly
   *
   * @maxLength 60
   */
  eventId?: string;

  size?: LPFnDeploymentSize;

  /**
   * Flag that indicates if a function was imported from V1 or is a V2.
   * V1 can only be imported, but then need to be adjusted to the new interface.
   */
  isCompV1: boolean;

  /**
   * Creation date of the function
   */
  createdAt?: Date;
  /**
   * Created by user name
   */
  createdBy?: string;
  /**
   * Date of last update
   */
  updatedAt?: Date;
  /**
   * Updated by user name
   */
  updatedBy?: string;
};

export type LPFnManifest = {
  /**
   * Id of the manifest
   *
   */
  id: string;
  /**
   * Version of the manifest, get's increased during an deployment
   */
  version: number;
  /**
   * Used Runtime of Function.
   * @maxLength 20
   */
  runtime: string;
  /**
   * Spec Version of the Manifest in semver format vMM.mm.PP
   * @maxLength 10
   */
  spec: string;
  /**
   * The actual code of the Function.
   * @maxLength 100000
   */
  code: string;
  /**
   * Unused at the moment, list of additional dependencies in format: "packageName": "semver"
   */
  customDependencies: Record<string, string>;
  /**
   * Environment variables made available to Function during runtime.
   */
  environment: Record<string, string>;
  /**
   * Creation date of the manifest
   */
  createdAt?: Date;
  /**
   * Created by user name
   */
  createdBy?: string;
  /**
   * Date of last update
   */
  updatedAt?: Date;
  /**
   * Updated by user name
   */
  updatedBy?: string;
};

export type LPFnDeployment = {
  /**
   * UUID that is unique for a each deployment
   *
   * @maxLength 36
   */
  uuid: string;
  /**
   *  UUID of the deployed function
   */
  functionUuid: string;
  /**
   * Function Manifest UUID of the deployed function
   */
  manifestUUID: string;
  /**
   *  Version of the deployed manifest, a function can have multiple manifests versions
   */
  manifestVersion: number;
  /**
   * The current state of the deployment
   *
   * @maxLength 30
   */
  deploymentState: 'deploying' | 'redeploying' | 'successful' | 'failed';
  /**
   * Creation date of the Deployment
   */
  createdAt?: Date;
  /**
   * Update Date of the current deployment (based on version)
   */
  updatedAt?: Date;
  /**
   * Actual deployment date of the lambda on OpenFaaS
   */
  deployedAt?: Date;
  /**
   * Created by user name
   */
  createdBy?: string;
  /**
   * Updated by user name
   */
  updatedBy?: string;
  /**
   *  CPU units assigned to the Funtion
   */
  cpu?: number;
  /**
   *  Memory in MB assinged to the FUnction
   */
  memory?: number;
  /**
   * Undeployment Date of the linked lambda version.
   */
  undeployedAt?: Date;
};

// Only use as input during create and update deployment
export type LPFnDeploymentConfig = Pick<LPFnDeployment, 'cpu' | 'memory'>;


export type LPFnDeploymentCreateParams = Pick<
  LPFnDeployment,
  'functionUuid' | 'manifestUUID' | 'manifestVersion' | 'cpu' | 'memory'
>;

export type IFunction = LPFnMeta & {
  lastDeployment?: LPFnDeployment;
  implementation?: LPFnManifest;
};
export type LPFunction = LPFnMeta & { manifest: LPFnManifest };
export type LPFnHistory = LPFnMeta & { versions: LPFnManifest[] };

export type LPFnCreateParams = Pick<
  LPFunction,
  'name' | 'description' | 'eventId' | 'skills'
> & {
  manifest: Pick<
    LPFnManifest,
    'code' | 'customDependencies' | 'environment' | 'runtime'
  >;
};

export type LPFnMetaUpdateParams = Partial<
  Pick<LPFnMeta, 'description' | 'skills' | 'isCompV1'>
>;

export type LPManifestUpdateParams = Partial<
  Omit<LPFnManifest, 'spec' | 'id'>
> & { version: number };
