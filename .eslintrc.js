module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'oclif',
    'oclif-typescript',
    'plugin:prettier/recommended',
    'prettier',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    semi: ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'prettier/prettier': 1,
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    '@typescript-eslint/interface-name-prefix': 0,
    'no-param-reassign': 0,
    'no-return-assign': 0,
    'unicorn/filename-case': 0,
    'valid-jsdoc': 0,
    'import/prefer-default-export': 0,
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-abusive-eslint-disable': 0,
    'unicorn/prefer-node-protocol': 0,
    'unicorn/import-index': 0,
    'unicorn/prefer-module': 0,
    'unicorn/numeric-separators-style': 0,
    'unicorn/prefer-array-find': 0,
    'unicorn/prefer-includes': 0,
    'unicorn/prefer-json-parse-buffer': 0,
    'unicorn/prefer-object-from-entries': 0,
    'unicorn/prefer-optional-catch-binding': 0,
    'unicorn/no-object-as-default-parameter': 0,
    'new-cap': 0,
  },
};
