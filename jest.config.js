module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>', '<rootDir>/src'],
  testMatch: ['**/*.steps.[jt]s?(x)', '**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {
    '^.+\\.jsx?$': require.resolve('babel-jest'),
    '^.+\\.tsx?$': 'ts-jest',
  },
  modulePathIgnorePatterns: ['./lib', './bin', './dist', './tmp'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.[jt]s?(x)',
    '!<rootDir>/src/commands/**',
    '!<rootDir>/src/index.ts',
    '!<rootDir>/src/shared/lp-faas-toolbelt/**/*.[jt]s?(x)',
    '<rootDir>/src/shared/lp-faas-toolbelt/http-client/**/*.[jt]s?(x)',
    '<rootDir>/src/shared/lp-faas-toolbelt/secret-storage/**/*.[jt]s?(x)',
  ],
};
