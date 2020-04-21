import * as Listr from 'listr';
import { TaskList } from '../../../src/view/printer';

describe('printer - tasklist', () => {
  const listrSpy = jest.spyOn(Listr.prototype, 'run').mockImplementation();
  it('should run the tasklist with tasks', () => {
    const taskList = new TaskList();

    const task1 = {
      title: 'Title2',
      task: () => 'Foo',
    };
    const task2 = {
      title: 'Title3',
      task: () => 'Foo',
    };

    taskList.addTask({ title: 'Title1', task: () => 'Foo' });
    taskList.addNestedTaskList({ title: 'SubTasks', tasks: [task1, task2] });

    taskList.run();

    expect(listrSpy).toBeCalled();
  });
});
