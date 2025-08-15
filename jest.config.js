module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>', '<rootDir>/src'],
  moduleNameMapper: {
    '^csv-parse/sync$': '<rootDir>/node_modules/csv-parse/dist/cjs/sync.cjs',
    '^node:(.*)$': '$1',
    '^path$': 'path',
    '^fs$': 'fs',
    '^os$': 'os',
    '^util$': 'util',
  },
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
    '<rootDir>/src/shared/core-functions-toolbelt/secret-storage/secretClient.[jt]s?(x)',
  ],
};
