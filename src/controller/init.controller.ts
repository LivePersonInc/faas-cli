// tslint:disable:no-shadowed-variable
import { execSync as ExecDefault } from 'child_process';
import { join } from 'path';
import { PrettyPrintableError } from '@oclif/core/lib/interfaces';
import { CLIErrorCodes } from '../shared/errorCodes';
import { FileService } from '../service/file.service';
import { InitView as InitViewDefault } from '../view/init.view';

export type PackageManager = 'npm' | 'yarn';

interface IInitOptions {
  functionNames?: string[];
  update?: boolean;
}

interface IInitControllerConfig {
  initView?: InitViewDefault;
  exec?: any;
  fileService?: FileService;
  cwd?: string;
}

export class InitController {
  private readonly initView: InitViewDefault;

  private exec: any;

  private fileService: FileService;

  private cwd: string;

  private update: boolean;

  constructor(
    /* istanbul ignore next */ {
      initView = new InitViewDefault(),
      exec = ExecDefault,
      fileService = new FileService(),
      cwd = process.cwd(),
    }: IInitControllerConfig = {},
  ) {
    this.initView = initView;
    this.exec = exec;
    this.fileService = fileService;
    this.cwd = cwd;
    this.update = false;
  }

  /**
   * Creates the default project structure and adds function folder depending on the passed names.
   * @param {IInitOptions} - Passed function names
   * @returns {Promise<void>} - init view
   * @memberof InitController
   */
  public async init({
    functionNames,
    update = false,
  }: IInitOptions = {}): Promise<void> {
    try {
      this.update = update;
      const packageManager = this.determinePackageManager();
      const needDependencyInstallation: boolean =
        this.needDependencyInstallation(packageManager);
      await this.initView.showInitialiseTaskList({
        packageManager,
        needDependencyInstallation,
        functionNames,
        update: this.update,
      });
    } catch (error) {
      /* istanbul ignore else */
      if (error.name !== 'ListrError') {
        this.initView.showErrorMessage(error.message || error.errorMsg);
      }
    }
  }

  private determinePackageManager(): PackageManager {
    const versionRegex = /(?:\d{1,2}.){2}\d{1,2}/;
    try {
      if (versionRegex.test(this.exec('npm -v', { encoding: 'utf8' }))) {
        return 'npm';
      }
      if (versionRegex.test(this.exec('yarn -v', { encoding: 'utf8' }))) {
        return 'yarn';
      }
      throw new Error('Please make sure you have npm or yarn installed');
    } catch {
      const prettyError: PrettyPrintableError = {
        message: 'Please make sure you have npm or yarn installed',
        ref: 'https://yarnpkg.com/getting-started/install',
        code: CLIErrorCodes.PackageManagerNotFound,
      };
      this.initView.showErrorMessage(prettyError);
      throw new Error('exit');
    }
  }

  private needDependencyInstallation(packageManager: PackageManager): boolean {
    return (
      this.update ||
      (packageManager === 'npm' &&
        !this.fileService.directoryOrFileExists(
          join(this.cwd, 'bin', 'lp-faas-toolbelt', 'package-lock.json'),
        ) &&
        !this.fileService.directoryOrFileExists(
          join(this.cwd, 'bin', 'lp-faas-toolbelt', 'node_modules'),
        )) ||
      (packageManager === 'yarn' &&
        !this.fileService.directoryOrFileExists(
          join(this.cwd, 'bin', 'lp-faas-toolbelt', 'yarn.lock'),
        ) &&
        !this.fileService.directoryOrFileExists(
          join(this.cwd, 'bin', 'lp-faas-toolbelt', 'node_modules'),
        ))
    );
  }
}
