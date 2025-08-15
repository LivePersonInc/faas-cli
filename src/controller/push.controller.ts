import { Answers } from 'inquirer';
import { isEqual } from 'lodash';
import { factory } from '../service/faasFactory.service';
import { FileService } from '../service/file.service';
import { PushView } from '../view/push.view';
import { LPFnManifest, LPFnMeta, LPFunction } from '../types/IFunction';

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

      const localLambdaInformation =
        this.fileService.collectLocalLambdaInformation(lambdaFunctions);

      const localLambdaNames = localLambdaInformation.map((e) => e.name);
      const faasService = await factory.get();

      const allRemoteLambdas = await faasService.getLambdasByNames(
        localLambdaNames,
      );

      const allLambdaBodies = localLambdaNames.map((name) => {
        if (
          allRemoteLambdas
            .map(({ name: remoteName }) => remoteName)
            .includes(name)
        ) {
          return this.createUpdateLambdaBody(
            allRemoteLambdas.find(
              ({ name: remoteName }) => remoteName === name,
            ),
            this.fileService.getFunctionConfig(name),
          );
        }
        return this.createNewLambdaBody(
          this.fileService.getFunctionConfig(name),
        );
      });

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
          (entry) => answers[entry.name],
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
        this.pushView.showErrorMessage(error.message || error.error?.errorMsg);
      }
      throw new Error(error);
    }
  }

  private createNewLambdaBody(lambdaConfig: any): Partial<LPFnMeta> & {
    manifest: Partial<LPFnManifest>;
  } {
    const hasCustomEnvars = (envars) =>
      envars &&
      Object.keys(envars).length > 0 &&
      Object.keys(envars)[0] !== 'key';
    return {
      name: lambdaConfig.name,
      ...(lambdaConfig.event &&
        lambdaConfig.event !== 'No Event' && { eventId: lambdaConfig.event }),
      description: lambdaConfig.description,
      manifest: {
        code: this.fileService.read(
          this.fileService.getPathToFunction(lambdaConfig.name, 'index.js'),
          false,
        ),
        ...(hasCustomEnvars(lambdaConfig.environmentVariables) && {
          environment: lambdaConfig.environmentVariables,
        }),
        version: -1,
      },
    };
  }

  private createUpdateLambdaBody(
    existingLambda: LPFunction,
    lambdaConfig: any,
  ): Partial<LPFnMeta> & {
    manifest: Partial<LPFnManifest>;
  } {
    const code = this.fileService.read(
      this.fileService.getPathToFunction(existingLambda.name, 'index.js'),
      false,
    );

    const isCodeChanged = code !== existingLambda.manifest.code;

    const envars = lambdaConfig.environmentVariables;

    if (envars.key && envars.key === 'value') {
      delete envars.key;
    }
    const areEnvarsChanged = !isEqual(
      envars,
      existingLambda.manifest.environment,
    );

    return {
      uuid: existingLambda.uuid,
      state: existingLambda.state === 'Draft' ? 'Draft' : 'Modified',
      name: existingLambda.name,
      eventId: existingLambda.eventId,
      description: lambdaConfig.description,
      manifest: {
        ...(isCodeChanged && { code }),
        ...(areEnvarsChanged && {
          environment: envars,
        }),
        version: existingLambda.manifest.version,
      },
    };
  }
}
