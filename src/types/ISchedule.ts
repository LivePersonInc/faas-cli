/**
 * Structure of the lambda
 * @export
 * @interface ISchedule
 */
export interface ISchedule {
  createdBy: string;
  cronExpression: string;
  didLastExecutionFail: boolean;
  isActive: boolean;
  lambdaUUID: string;
  lastExecution: string;
  nextExecution: string;
  uuid: string;
}
