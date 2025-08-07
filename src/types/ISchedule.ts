export interface LPSchedule {
  /**
   * The id of the schedule, extracted form the name
   *
   */
  id: string;
  /**
   * The UUID of the scheduled function
   *
   * @maxLength 36
   */
  functionUuid: string;
  /**
   * Cron Expression that control's the scheduling
   *
   * @maxLength 120
   */
  cronExpression: string;
  /**
   * Flag to indicate if the scheduling is active or paused
   */
  isActive: boolean;
  /**
   *  Description of the scheduled job
   *  @maxLength 200
   */
  description?: string;
  /**
   * Job timeZone , see valid values: https://cloud.google.com/looker/docs/reference/param-view-timezone-values
   * Default: Etc/UTC
   */
  timeZone?: string;
  /**
   * The next time when the lambda will be executed
   */
  nextExecution?: Date;
  /**
   * The last time when the lambda was executed
   */
  lastExecution?: Date;
  /**
   * Flag to indicate if the last deployment was successful
   */
  didLastExecutionFail?: boolean;
  /**
   * invocation body sent to lambda on schedule
   */
  invocationBody?: {
    /**
     * Headers that should be past to the lambda
     *
     */
    headers?: { [k: string]: string };
    /**
     * Event / Call Payload
     */
    payload?: string | number | Record<string, unknown> | Array<unknown>;
  };
}

export type LPScheduleCreateParams = Omit<
  LPSchedule,
  | 'id'
  | 'functionUuid'
  | 'nextExecution'
  | 'didLastExecutionFail'
  | 'isActive'
  | 'lastExecution'
>;

export type LPScheduleUpdateParams = Omit<
  LPSchedule,
  | 'nextExecution'
  | 'functionUuid'
  | 'didLastExecutionFail'
  | 'isActive'
  | 'lastExecution'
  | 'id'
>;
