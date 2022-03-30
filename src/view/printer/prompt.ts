import * as Inquirer from 'inquirer';

// tslint:disable-next-line:no-empty-interface
export type IPromptAnswer = Inquirer.Answers;

/**
 * {@link https://www.npmjs.com/package/inquirer}
 * @export
 * @class Prompt
 */
export class Prompt {
  private prompts: IPromptAnswer[];

  private inquirer: Inquirer.Inquirer;

  constructor(inquirer = Inquirer) {
    this.prompts = [];
    this.inquirer = inquirer;
  }

  /**
   * Adds a question to the prompt
   * @param {(IPromptAnswer | IPromptAnswer[])} question - question
   * @returns {Prompt} - Instance of prompt
   * @memberof Prompt
   */
  public addQuestion(question: IPromptAnswer | IPromptAnswer[]): Prompt {
    Array.isArray(question)
      ? (this.prompts = [...this.prompts, ...question])
      : this.prompts.push(question);
    return this;
  }

  /**
   * Return the prompts
   * @returns {IPromptAnswer[]} - prompts
   * @memberof Prompt
   */
  public getQuestions(): IPromptAnswer[] {
    return this.prompts;
  }

  /**
   * Runs the prompt and gather all answers
   * @returns {Promise<IPromptAnswer[]>} - prompt answers
   * @memberof Prompt
   */
  public async run(): Promise<IPromptAnswer[]> {
    const answers: IPromptAnswer[] = await this.inquirer.prompt(this.prompts);
    this.prompts = [];
    return answers;
  }
}
