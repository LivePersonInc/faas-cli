import {
  parseInput,
  validateFunctionName,
  validateFunctionDescription,
  transformToCSV,
  formatDate,
} from '../../src/shared/utils';

describe('shared utils', () => {
  it('should parse the input args with the command flags', () => {
    const flags = {
      help: {
        description: 'show CLI help',
        char: 'h',
        allowNo: false,
        type: 'boolean',
        name: 'help',
      },
      yes: {
        char: 'y',
        description:
          'Agrees to the approval of the deployment and prevents the confirmation dialog',
        allowNo: false,
        type: 'boolean',
        name: 'yes',
      },
      'no-watch': {
        char: 'w',
        description: "Don't watch deployment process",
        allowNo: false,
        type: 'boolean',
        name: 'no-watch',
      },
    };

    const argv = ['--yes', 'test-function', '-w', '-h'];

    expect(parseInput(flags, argv)).toEqual(['test-function']);
  });

  it('validate a correct lambda name with true', () => {
    const lambdaName = 'exampleLambda';
    expect(validateFunctionName(lambdaName)).toBe(true);
  });

  it('validate an incorrect lambda name with a hint', () => {
    const lambdaName = 'example Lambda';
    expect(validateFunctionName(lambdaName)).toBe(
      'Invalid name only A-Z, 0-9, _ allowed!',
    );
  });

  it('validate a correct lambda description with true', () => {
    const lambdaDescription = 'description';
    expect(validateFunctionDescription(lambdaDescription)).toBe(true);
  });

  it('validate an incorrect lambda name with a hint', () => {
    const lambdaDescription = '';
    expect(validateFunctionDescription(lambdaDescription)).toBe(
      'Description cannot be empty!',
    );
  });

  it('transform a json into csv', () => {
    const jsonExample = [
      { test1: 123, test2: 'foo' },
      { test1: 123, test2: null },
    ];
    const csv: string = transformToCSV(jsonExample, { test1: 'Lorem' });
    expect(csv).toContain('Lorem,MISSING HEADER LABEL\r\n123,"foo"\r\n123,""');
  });

  it('transform a json into csv if no headers are given', () => {
    const jsonExample = [
      { test1: 123, test2: 'foo' },
      { test1: 123, test2: null },
    ];
    const csv: string = transformToCSV(jsonExample);
    expect(csv).toContain('test1,test2\r\n123,"foo"\r\n123,""');
  });

  it('format a timestamp into the correct date time with seconds and timezone', () => {
    const dateString = formatDate(1656679335473);
    expect(dateString).toEqual(
      expect.stringMatching(/\d{2}\.\d{2}\.\d{4} - \d{2}.\d{2}:\d{2} \w+/),
    );
  });

  it('format a timestamp into "invalid date" if an invalid timestamp was received', () => {
    const dateString = formatDate(null);
    expect(dateString).toEqual(expect.stringMatching('Invalid date'));
  });
});
