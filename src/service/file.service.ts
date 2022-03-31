/* eslint-disable unicorn/no-null */
import * as crypto from 'crypto';
import * as fsDefault from 'fs-extra';
import { system } from 'systeminformation';
import * as os from 'os';
import { join } from 'path';
import * as semver from 'semver';
import { ILambdaConfig } from '../types';

interface IFileServiceConstructorConfig {
  cwd?: string;
  fs?: any;
  sysinfo?: any;
  dirname?: string;
}

export class FileService {
  private cwd: string;

  private fs: any;

  private sysinfo: any;

  private dirname: string;

  constructor({
    cwd = process.cwd(),
    fs = fsDefault,
    sysinfo = system,
    dirname = __dirname,
  }: IFileServiceConstructorConfig = {}) {
    this.cwd = cwd;
    this.fs = fs;
    this.sysinfo = sysinfo;
    this.dirname = dirname;
  }

  public copy(sourcePath: string, destinationPath: string): void | Error {
    try {
      this.fs.copySync(sourcePath, destinationPath);
    } catch (error) {
      throw new Error(error);
    }
  }

  public directoryOrFileExists(pathToFile: string): boolean | Error {
    return this.fs.existsSync(pathToFile);
  }

  /**
   * Returns the path to a functions folder or a file inside a function folder
   * @param {string} functionsName
   * @param {string} [fileName]
   * @returns {string} - path to function or file
   * @memberof FileService
   */
  // eslint-disable-next-line complexity
  public getPathToFunction(functionsName: string, fileName?: string): string {
    if (
      this.directoryOrFileExists(join(this.cwd, 'bin')) &&
      this.directoryOrFileExists(join(this.cwd, 'functions'))
    ) {
      /* istanbul ignore else */
      if (
        functionsName &&
        this.directoryOrFileExists(
          join(this.cwd, 'functions', functionsName, fileName || ''),
        )
      ) {
        return join(this.cwd, 'functions', functionsName, fileName || '');
      }
    } /* istanbul ignore else */ else if (
      this.directoryOrFileExists(join(this.cwd, '..', 'bin')) &&
      this.directoryOrFileExists(join(this.cwd, '..', 'functions'))
    ) {
      /* istanbul ignore else */
      if (
        functionsName &&
        this.directoryOrFileExists(
          join(this.cwd, functionsName, fileName || ''),
        )
      ) {
        return join(this.cwd, functionsName, fileName || '');
      }
    } /* istanbul ignore else */ else if (
      this.directoryOrFileExists(join(this.cwd, '..', '..', 'bin')) &&
      this.directoryOrFileExists(join(this.cwd, '..', '..', 'functions'))
    ) {
      /* istanbul ignore else */
      if (this.directoryOrFileExists(join(this.cwd, fileName || ''))) {
        return join(this.cwd, fileName || '');
      }
    }

    if (!functionsName) {
      throw new Error(
        'Could not find function. Please make sure you are in a function folder or pass a function name.',
      );
    }
    throw new Error(
      `Could not find the folder of function ${functionsName}. Please make sure it's available in the functions folder.`,
    );
  }

  /**
   * Returns the path to the settings.json
   * @returns {string} - path to settings.json
   * @memberof FileService
   */
  public getPathToSettings(): string {
    if (
      this.directoryOrFileExists(join(this.cwd, 'bin')) &&
      this.directoryOrFileExists(join(this.cwd, 'functions'))
    ) {
      /* istanbul ignore else */
      if (
        this.directoryOrFileExists(join(this.cwd, 'functions', 'settings.json'))
      ) {
        return join(this.cwd, 'functions', 'settings.json');
      }
    } /* istanbul ignore else */ else if (
      this.directoryOrFileExists(join(this.cwd, '..', 'bin')) &&
      this.directoryOrFileExists(join(this.cwd, '..', 'functions'))
    ) {
      /* istanbul ignore else */
      if (this.directoryOrFileExists(join(this.cwd, 'settings.json'))) {
        return join(this.cwd, 'settings.json');
      }
    }

    throw new Error(
      "Could not find settings.json. Please make sure it's available in the functions folder.",
    );
  }

  /**
   * Reads a the content of a file
   * @param {string} pathToFile - path to file
   * @param {boolean} [parseJSON=true] - should the output be parsed as JSON
   * @param {string} [encoding='utf8'] - encoding of the file
   * @returns {*} - content of a file
   * @memberof FileService
   */
  public read(pathToFile: string, parseJSON = true, encoding = 'utf8'): any {
    /* istanbul ignore else */
    if (parseJSON) {
      return this.directoryOrFileExists(pathToFile)
        ? JSON.parse(this.fs.readFileSync(pathToFile, encoding))
        : undefined;
    }
    return this.directoryOrFileExists(pathToFile)
      ? this.fs.readFileSync(pathToFile, encoding)
      : undefined;
  }

  /**
   * Returns all function directories
   * @returns {string[]} - Array of function folders
   * @memberof FileService
   */
  public getFunctionsDirectories(): string[] {
    return this.fs
      .readdirSync(join(this.getRoot(), 'functions'), { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  }

  /**
   * Write content to a file
   * @param {string} pathToWriteFile - path to the file
   * @param {*} data - content of the file
   * @param {boolean} [stringify=true] - should the content be stringified
   * @param {string} [encoding='utf8'] - encoding of the file
   * @returns {void}
   * @memberof FileService
   */
  public write(
    pathToWriteFile: string,
    data: any,
    stringify = true,
    encoding = 'utf8',
  ): void {
    try {
      /* istanbul ignore else */
      if (stringify) {
        this.fs.writeFileSync(
          pathToWriteFile,
          JSON.stringify(data, null, 4),
          encoding,
        );
        return;
      }
      this.fs.writeFileSync(pathToWriteFile, data, encoding);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Returns the decrypted temp file.
   * @returns {Promise<any>} - returns the decrypted temp file
   * @memberof FileService
   */
  public async getTempFile(): Promise<any> {
    const data = this.read(join(os.tmpdir(), 'faas-tmp.json'));
    /* istanbul ignore else */
    if (!data) {
      return undefined;
    }
    return this.decrypt(data);
  }

  /**
   * Writes the temp file to the temp directory of the os.
   * (Temp directory of the OS gets cleared after restart)
   * @param {*} data - temp file content
   * @returns {Promise<void>} - void
   * @memberof FileService
   */
  public async writeTempFile(data: any): Promise<void> {
    const encryptedData = await this.encrypt(data);
    this.write(join(os.tmpdir(), 'faas-tmp.json'), encryptedData);
  }

  /**
   * Deletes the temp file from the os temp directory
   * @memberof FileService
   */
  public deleteTempFile(): void {
    this.fs.removeSync(join(os.tmpdir(), 'faas-tmp.json'));
  }

  /**
   * Returns the function config (config.json) of the passed function.
   * @param {string} functionName - function name
   * @returns {*} - config
   * @memberof FileService
   */
  public getFunctionConfig(functionName: string): ILambdaConfig {
    return this.read(this.getPathToFunction(functionName, 'config.json'));
  }

  /**
   * Returns config files for multiple passed functions.
   * @param {string[]} [lambdaFunctions] - lambda functions
   * @returns {ILambdaConfig[]} - Lambda configs
   * @memberof FileService
   */
  public collectLocalLambdaInformation(
    lambdaFunctions?: string[],
  ): ILambdaConfig[] {
    /* istanbul ignore else */
    if (lambdaFunctions?.length) {
      return lambdaFunctions.map((lambdaFunction: string) =>
        this.getFunctionConfig(lambdaFunction),
      );
    }

    const lambda = this.read(join(this.cwd, 'config.json'));
    /* istanbul ignore else */
    if (!lambda) {
      throw new Error(
        'Could not find function. Please make sure you are in a function folder or pass a function name.',
      );
    }
    return [lambda];
  }

  /**
   * Returns the name of the function folder.
   * Needed if the user calls a command inside a function folder.
   * @returns {string} - function folder name
   * @memberof FileService
   */
  public getFunctionFolderName(): string {
    const lambda = this.read(join(this.cwd, 'config.json'));
    /* istanbul ignore else */
    if (!lambda) {
      throw new Error(
        'Could not find function. Please make sure you are in a function folder or pass a function name.',
      );
    }
    return lambda.name;
  }

  /**
   * Returns the path to the root directory
   * @returns {string} - root directory
   * @memberof FileService
   */
  public getRoot(): string {
    /* istanbul ignore else */
    if (
      this.directoryOrFileExists(join(this.cwd, 'bin')) &&
      this.directoryOrFileExists(join(this.cwd, 'functions'))
    ) {
      return join(this.cwd);
    }
    /* istanbul ignore else */
    if (
      this.directoryOrFileExists(join(this.cwd, '..', 'bin')) &&
      this.directoryOrFileExists(join(this.cwd, '..', 'functions'))
    ) {
      return join(this.cwd, '..');
    }
    /* istanbul ignore else */
    if (
      this.directoryOrFileExists(join(this.cwd, '..', '..', 'bin')) &&
      this.directoryOrFileExists(join(this.cwd, '..', '..', 'functions'))
    ) {
      return join(this.cwd, '..', '..');
    }

    throw new Error(
      `Could not find root directory. Please make sure you are in a faas project.`,
    );
  }

  public needUpdateBinFolder() {
    try {
      const cliPackage = this.read(
        join(this.dirname, '..', '..', 'package.json'),
      );
      const cliVersion = cliPackage?.version;
      const toolbeltPackage = this.read(
        join(this.getRoot(), 'bin', 'lp-faas-toolbelt', 'package.json'),
      );
      const toolbeltVersion = toolbeltPackage?.version;
      return semver.gt(cliVersion, toolbeltVersion);
    } catch {
      return false;
    }
  }

  /**
   * Return the config for crypto.
   * Takes the uuid of the system as password for pseudo encryption.
   * @returns {Promise<{ algorithm: string; key: Buffer; iv: string }>}
   */
  public async getCryptoConfig(): Promise<{
    algorithm: string;
    key: Buffer;
    iv: string;
  }> {
    let systemUUID: string;
    try {
      const sysData = await this.sysinfo();
      systemUUID = sysData.uuid;
    } catch {
      systemUUID = '01:02:03:04:05:06';
    }

    return {
      algorithm: 'aes256',
      key: crypto.scryptSync(systemUUID, 'faas-cli', 32),
      iv: 'faas-cli-vectors',
    };
  }

  private async encrypt(data: any) {
    const { algorithm, key, iv } = await this.getCryptoConfig();
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private async decrypt(data: any) {
    const { algorithm, key, iv } = await this.getCryptoConfig();
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }
}
