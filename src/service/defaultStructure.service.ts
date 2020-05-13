import { join } from 'path';
import { FileService } from './file.service';

interface IDefaultStructureServiceConstructorConfig {
  fileService?: FileService;
  cwd?: string;
}

export class DefaultStructureService {
  private fileService: FileService;

  private cwd: string;

  private functionName: string;

  constructor({
    fileService = new FileService(),
    cwd = process.cwd(),
  }: IDefaultStructureServiceConstructorConfig = {}) {
    this.fileService = fileService;
    this.cwd = cwd;
    this.functionName = '';
  }

  /**
   * Copies all files from the bin folder of the cli to the folder of the user.
   * @param {string} [functionName=''] - creates the necessary files for the init command
   * @memberof DefaultStructureService
   */
  public create(functionName = 'exampleFunction'): void {
    if (
      this.fileService.directoryOrFileExists(
        join(this.cwd, 'functions', functionName),
      )
    ) {
      throw new Error(`Folder with same name already exists (${functionName})`);
    } else {
      this.createFunctionsFolder(functionName);
    }

    /* istanbul ignore else */
    if (!this.fileService.directoryOrFileExists(join(this.cwd, 'README.md'))) {
      this.createReadme();
    }

    /* istanbul ignore else */
    if (!this.fileService.directoryOrFileExists(join(this.cwd, 'bin'))) {
      this.createDefaultServices();
    }

    /* istanbul ignore else */
    if (!this.fileService.directoryOrFileExists(join(this.cwd, '.vscode'))) {
      this.copyVsCodeSettings();
    }

    /* istanbul ignore else */
    if (!this.fileService.directoryOrFileExists(join(this.cwd, '.idea'))) {
      this.copyIntellijSettings();
    }

    /* istanbul ignore else */
    if (!this.fileService.directoryOrFileExists(join(this.cwd, '.gitignore'))) {
      this.copyGitIgnore();
    }

    /* istanbul ignore else */
    if (
      !this.fileService.directoryOrFileExists(
        join(this.cwd, 'functions', 'settings.json'),
      )
    ) {
      this.copySettings();
    }

    /* istanbul ignore else */
    if (this.fileService) {
      this.renameFunction();
    }
  }

  /**
   * Creates a folder function with a provided name.
   * @param {string} [functionName] - function name
   * @memberof DefaultStructureService
   */
  public createFunctionsFolder(functionName?: string, takeRoot = false): void {
    const path = takeRoot ? this.fileService.getRoot() : this.cwd;
    this.functionName = functionName || 'exampleFunction';
    this.fileService.copy(
      join(
        __dirname,
        '..',
        '..',
        'bin',
        'example',
        'functions',
        'exampleFunction',
      ),
      join(path, 'functions', this.functionName),
    );
  }

  private createReadme(): void {
    this.fileService.copy(
      join(__dirname, '..', '..', 'bin', 'example', 'README.md'),
      join(this.cwd, 'README.md'),
    );
  }

  private createDefaultServices(): void {
    this.fileService.copy(
      join(__dirname, '..', '..', 'bin', 'example', 'bin'),
      join(this.cwd, 'bin'),
    );
  }

  private copyIntellijSettings(): void {
    // will be changed to .idea because '.' folder/files are ignored by npm publish
    this.fileService.copy(
      join(__dirname, '..', '..', 'bin', 'example', 'idea'),
      join(this.cwd, '.idea'),
    );
  }

  private copyVsCodeSettings(): void {
    // will be changed to .vscode because '.' folder/files are ignored by npm publish
    this.fileService.copy(
      join(__dirname, '..', '..', 'bin', 'example', 'vscode'),
      join(this.cwd, '.vscode'),
    );
  }

  private copyGitIgnore(): void {
    // will be changed to .ignore because '.' folder/files are ignored by npm publish
    this.fileService.copy(
      join(__dirname, '..', '..', 'bin', 'example', 'gitignore'),
      join(this.cwd, '.gitignore'),
    );
  }

  private copySettings(): void {
    this.fileService.copy(
      join(
        __dirname,
        '..',
        '..',
        'bin',
        'example',
        'functions',
        'settings.json',
      ),
      join(this.cwd, 'functions', 'settings.json'),
    );
  }

  private renameFunction(): void {
    const path = join(this.cwd, 'functions', this.functionName, 'config.json');
    const file = this.fileService.read(
      join(this.cwd, 'functions', this.functionName, 'config.json'),
    );
    file.name = this.functionName;
    file.description = `${this.functionName} description`;
    this.fileService.write(path, file);
  }
}
