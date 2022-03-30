/* eslint-disable unicorn/import-style */
import { execFileSync } from 'child_process';
import { join } from 'path';
import * as getPort from 'get-port';
import { FileService } from '../service/file.service';
import { DebugView } from '../view/debug.view';
import { InitController } from './init.controller';

interface IDebugConfig {
  lambdaFunctions: string[];
}

interface IDebugControllerConfig {
  fileService?: FileService;
  debugView?: DebugView;
  initController?: InitController;
}

export class DebugController {
  private fileService: FileService;

  private debugView: DebugView;

  private initController: InitController;

  constructor(
    /* istanbul ignore next */ {
      fileService = new FileService(),
      debugView = new DebugView(),
      initController = new InitController(),
    }: IDebugControllerConfig = {},
  ) {
    this.fileService = fileService;
    this.debugView = debugView;
    this.initController = initController;
  }

  /**
   * Executes the debug.js with the passed function
   * @param {IDebugConfig} { lambdaFunctions }
   * @memberof DebugController
   */
  public async debug({ lambdaFunctions }: IDebugConfig): Promise<void> {
    try {
      if (this.fileService.needUpdateBinFolder()) {
        await this.initController.init({ update: true });
      }
      this.fileService.getPathToFunction(lambdaFunctions[0]);
      const port = await getPort({ port: getPort.makeRange(30500, 31000) });
      this.debugView.showDebuggerIsRunning(port);
      process.env.DEBUG_PORT = `${port}`;
      execFileSync('node', [
        join(process.cwd(), 'bin', 'faas-debugger.js'),
        lambdaFunctions[0],
      ]);
    } catch (error) {
      this.debugView.showErrorMessage(error.message || error.errorMsg);
    }
  }
}
