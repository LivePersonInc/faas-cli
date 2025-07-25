module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>', '<rootDir>/src'],
  testMatch: [
    '**/*.steps.[jt]s?(x)',
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '!**/e2e/**',
  ],
  transform: {
    '^.+\\.jsx?$': require.resolve('babel-jest'),
    '^.+\\.tsx?$': 'ts-jest',
  },
  modulePathIgnorePatterns: ['./lib', './bin', './dist', './tmp'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.[jt]s?(x)',
    '!<rootDir>/src/commands/**',
    '!<rootDir>/src/index.ts',
    '!<rootDir>/src/shared/core-functions-toolbelt/**/*.[jt]s?(x)',
    '<rootDir>/src/shared/core-functions-toolbelt/http-client/**/*.[jt]s?(x)',
    '<rootDir>/src/shared/core-functions-toolbelt/secret-storage/**/*.[jt]s?(x)',
    '<rootDir>/src/shared/core-functions-toolbelt/context-service-client/**/*.[jt]s?(x)',
  ],
};
