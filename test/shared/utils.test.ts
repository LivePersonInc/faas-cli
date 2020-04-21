import { parseInput } from '../../src/shared/utils';

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
});
