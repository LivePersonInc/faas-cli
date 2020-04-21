import * as Listr from 'listr';

interface INestedTaskList {
  title: string;
  tasks: Listr.ListrTask[];
  options?: Listr.ListrOptions;
}

/**
 * {@link https://github.com/SamVerschueren/listr}
 * @export
 * @class TaskList
 */
export class TaskList {
  private tasks: Listr.ListrTask[];

  private options: Listr.ListrOptions;

  constructor(options: Listr.ListrOptions = {}) {
    this.tasks = [];
    this.options = options;
  }

  /**
   * Add a task to the tasklist
   * @param {Listr.ListrTask} task - task
   * @returns {TaskList} - Instance of tasklist
   * @memberof TaskList
   */
  public addTask(task: Listr.ListrTask): TaskList {
    this.tasks.push(task);
    return this;
  }

  /**
   * Adds a nested tasklist
   * @param {INestedTaskList} { title, tasks, options } - nested task
   * @returns {TaskList} - instance of tasklist
   * @memberof TaskList
   */
  public addNestedTaskList({
    title,
    tasks,
    options,
  }: INestedTaskList): TaskList {
    /* istanbul ignore next */
    const nestedTaskList = () => new Listr(tasks, options);
    this.tasks.push({
      title,
      task: nestedTaskList,
    });
    return this;
  }

  /**
   * Returns all added tasks
   * @returns {Listr.ListrTask[]} - tasks
   * @memberof TaskList
   */
  public getTasks(): Listr.ListrTask[] {
    return this.tasks;
  }

  /**
   * Runs the tasklist
   * @param { context } - Listr specific context
   * @returns {Promise<void>}
   * @memberof TaskList
   */
  public async run({
    context,
    taskList = new Listr(this.tasks, this.options),
  }: { context?: Listr.ListrContext; taskList?: Listr } = {}): Promise<void> {
    await taskList.run(context);
  }
}
