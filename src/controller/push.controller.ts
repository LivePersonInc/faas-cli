import { Answers } from 'inquirer';
import { factory } from '../service/faasFactory.service';
import { FileService } from '../service/file.service';
import { ILambda } from '../types';
import { PushView } from '../view/push.view';

interface IPushConfig {
  lambdaFunctions?: string[];
  inputFlags?: { yes?: boolean; ['no-watch']?: boolean; all?: boolean };
}

interface IPushControllerConfig {
  pushView?: PushView;
  fileService?: FileService;
}

export class PushController {
  private readonly pushView: PushView;

  private readonly fileService: FileService;

  constructor(
    /* istanbul ignore next */ {
      pushView = new PushView(),
      fileService = new FileService(),
    }: IPushControllerConfig = {},
  ) {
    this.pushView = pushView;
    this.fileService = fileService;
  }

  /**
   * Depending on the set flags this method optionally triggers push confirmations prompts
   * to the user and accordingly triggers the push process itself. The Method surpresses
   * Errors from the Listr Tasklist to keep the output clean.
   * @param {IPushConfig} { lambdaFunctions, inputFlags } Input contains the names of the
   * lambdas to push and the flags that have been set by the user.
   * @returns {Promise<void>}
   * @memberof PushController
   */
  public async push({
    lambdaFunctions,
    inputFlags,
  }: IPushConfig): Promise<void> {
    try {
      if (inputFlags?.all) {
        lambdaFunctions = this.fileService.getFunctionsDirectories();
      }

      const localLambdaInformation = this.fileService.collectLocalLambdaInformation(
        lambdaFunctions,
      );
      const localLambdaNames = localLambdaInformation.map((e) => e.name);
      const faasService = await factory.get();

      const allLambdas = await faasService.getLambdasByNames(
        localLambdaNames,
        true,
      );
      const allLambdaBodies: ILambda[] = await Promise.all(
        allLambdas.map(async (lambda) => {
          if (Object.prototype.hasOwnProperty.call(lambda, 'uuid')) {
            return this.createUpdateLambdaBody(lambda as ILambda);
          }
          return this.createNewLambdaBody(lambda.name);
        }),
      );

      if (inputFlags?.yes) {
        await this.pushView.showPushProcess({
          pushRequestBodies: allLambdaBodies,
          noWatch: inputFlags?.['no-watch'],
        });
      } else {
        const answers: Answers = await this.pushView.askForConfirmation(
          allLambdaBodies,
          faasService.accountId,
        );
        const confirmedLambdaBodies = allLambdaBodies.filter(
          (entry: ILambda) => answers[entry.name],
        );
        if (confirmedLambdaBodies.length === 0) {
          return;
        }
        await this.pushView.showPushProcess({
          pushRequestBodies: confirmedLambdaBodies,
          noWatch: inputFlags?.['no-watch'],
        });
      }
    } catch (error) {
      if (error.name !== 'ListrError') {
        this.pushView.showErrorMessage(error.message || error.error.errorMsg);
      }
    }
  }

  private async createNewLambdaBody(name: string): Promise<any> {
    const lambdaConfig = this.fileService.getFunctionConfig(name);
    const faasService = await factory.get();
    return {
      ...(lambdaConfig.event &&
        lambdaConfig.event !== 'No Event' && { eventId: lambdaConfig.event }),
      uuid: '',
      version: -1,
      name,
      description: lambdaConfig.description,
      state: 'Draft',
      runtime: await faasService.getRuntime(),
      implementation: {
        code: this.fileService.read(
          this.fileService.getPathToFunction(name, 'index.js'),
          false,
        ),
        dependencies: [],
        environmentVariables:
          lambdaConfig.environmentVariables[0].key === ''
            ? []
            : lambdaConfig.environmentVariables,
      },
    };
  }

  private createUpdateLambdaBody(lambda: ILambda): any {
    const lambdaConfig = this.fileService.getFunctionConfig(lambda.name);
    return {
      uuid: lambda.uuid,
      version: lambda.version + 1,
      state: lambda.state === 'Draft' ? 'Draft' : 'Modified',
      name: lambda.name,
      eventId: lambda.eventId,
      description: lambdaConfig.description,
      runtime: lambda.runtime,
      createdBy: lambda.createdBy,
      updatedBy: lambda.updatedBy,
      createdAt: lambda.createdAt,
      updatedAt: lambda.updatedAt,
      implementation: {
        code: this.fileService.read(
          this.fileService.getPathToFunction(lambda.name, 'index.js'),
          false,
        ),
        dependencies: [],
        environmentVariables:
          lambdaConfig.environmentVariables[0].key === ''
            ? []
            : lambdaConfig.environmentVariables,
      },
    };
  }
}
