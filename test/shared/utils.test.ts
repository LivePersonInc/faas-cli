import {
  parseInput,
  validateFunctionName,
  validateFunctionDescription,
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
});
