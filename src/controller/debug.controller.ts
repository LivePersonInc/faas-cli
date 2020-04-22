import { execFileSync } from 'child_process';
import { join } from 'path';
import * as getPort from 'get-port';
import { FileService } from '../service/file.service';
import { DebugView } from '../view/debug.view';

interface IDebugConfig {
  lambdaFunctions: string[];
}

interface IDebugControllerConfig {
  fileService?: FileService;
  debugView?: DebugView;
}

export class DebugController {
  private fileService: FileService;

  private debugView: DebugView;

  constructor(
    /* istanbul ignore next */ {
      fileService = new FileService(),
      debugView = new DebugView(),
    }: IDebugControllerConfig = {},
  ) {
    this.fileService = fileService;
    this.debugView = debugView;
  }

  /**
   * Executes the debug.js with the passed function
   * @param {IDebugConfig} { lambdaFunctions }
   * @memberof DebugController
   */
  public async debug({ lambdaFunctions }: IDebugConfig): Promise<void> {
    try {
      this.fileService.getPathToFunction(lambdaFunctions[0]);
      const port = await getPort({ port: getPort.makeRange(30500, 31000) });
      this.debugView.showDebuggerIsRunning(port);
      process.env.DEBUG_PORT = `${port}`;
      execFileSync('node', [
        join(process.cwd(), 'bin', 'faas-debugger.js'),
        lambdaFunctions[0],
      ]);
    } catch (error) {
      this.debugView.showErrorMessage(error.message || error.error.errorMsg);
    }
  }
}
