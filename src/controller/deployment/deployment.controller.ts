import { factory } from '../../service/faasFactory.service';
import { FileService } from '../../service/file.service';
import { IFunction } from '../../types';

export abstract class DeploymentController {
  private fileService: FileService;

  constructor(fileService: FileService) {
    this.fileService = fileService;
  }

  /**
   * Gather information for passed lambda functions and enhance it with the current accountId
   * @param {string[]} lambdaFunctions - Passed lambda function
   * @returns {Promise<IFunction[]>} - Lambdas from the platform enhanced with the current accountId
   * @memberof DeploymentController
   */
  public async collectLambdaInformationForAllLambdas(
    lambdaFunctions: string[],
  ): Promise<IFunction[]> {
    if (lambdaFunctions.length === 0) {
      lambdaFunctions = [this.fileService.getFunctionFolderName()];
    }

    const faasService = await factory.get();

    const allLambdas = (await faasService.getLambdasByNames(
      lambdaFunctions,
    )) as IFunction[];

    return allLambdas.map((lambda) => ({
      accountId: faasService.accountId as string,
      ...lambda,
    }));
  }
}
