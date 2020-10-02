import { exec as execDefault } from 'child_process';
import { PackageManager } from '../controller/init.controller';
import { DefaultStructureService } from '../service/defaultStructure.service';
import { ErrorMessage, TaskList } from './printer';

interface IInitViewConstructor {
  error?: ErrorMessage;
  tasklist?: TaskList;
  exec?: any;
  defaultStructureService?: DefaultStructureService;
}

interface ITaskListConfig {
  packageManager: PackageManager;
  needDependencyInstallation: boolean;
  functionNames?: string[];
  update?: boolean;
}

export class InitView {
  private error: ErrorMessage;

  private tasklist: TaskList;

  private exec: any;

  private defaultStructureService: DefaultStructureService;

  constructor({
    error = new ErrorMessage(),
    tasklist = new TaskList({ concurrent: true, exitOnError: false }),
    exec = execDefault,
    defaultStructureService = new DefaultStructureService(),
  }: IInitViewConstructor = {}) {
    this.error = error;
    this.tasklist = tasklist;
    this.exec = exec;
    this.defaultStructureService = defaultStructureService;
  }

  /**
   * Prints an error message
   * @param {string} message - message
   * @returns {void}
   * @memberof InitView
   */
  public errorMessage(message: string): void {
    return this.error.print(message);
  }

  /**
   * Runs the tasklist which initialise all folder and files
   * @param { packageManager, needDependencyInstallation, functionNames } - Passes the used package manager, if an installation is required and functions to initialize.
   * @returns {Promise<void>}
   * @memberof InitView
   */
  public async showInitialiseTaskList({
    packageManager,
    needDependencyInstallation,
    functionNames,
    update = false,
  }: ITaskListConfig): Promise<void> {
    if (functionNames?.length) {
      functionNames.forEach((functionName) => {
        this.tasklist.addTask({
          title: `Initialise ${functionName}`,
          task: async () => {
            this.defaultStructureService.create(functionName);
          },
        });
      });
    } else {
      this.tasklist.addTask({
        title: 'Initializing structure',
        task: async () => {
          this.defaultStructureService.create(undefined, update);
        },
      });
    }

    /* istanbul ignore else */
    if (needDependencyInstallation) {
      this.tasklist.addTask({
        title: 'Install packages',
        task: async (ctx, task) => {
          const command = `cd bin/lp-faas-toolbelt && ${
            ctx.packageManager === 'npm' ? 'npm i' : 'yarn -i'
          }`;
          /* istanbul ignore next */
          return new Promise((resolve) => {
            this.exec(command, (error: any) => {
              if (error) {
                task.skip(error.message);
              }
              resolve();
            });
          });
        },
      });
    }

    await this.tasklist.run({ context: { packageManager } });
  }
}
