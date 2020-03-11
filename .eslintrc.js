module.exports = {
    env: {
      commonjs: true,
      es6: true,
      jest: true,
    },
    extends: [
      'airbnb-base',
      'plugin:@typescript-eslint/recommended'
    ],
    globals: {
      Atomics: 'readonly',
      SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
      ecmaVersion: 2018,
    },
    parser: '@typescript-eslint/parser',
    rules: {
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-namespace': 0,
      /* it's a cloud function, so it does not make sense. */
      'import/prefer-default-export': 0,
      'import/no-extraneous-dependencies': 0,
  
      /* it does not work properly with typescript */
      'import/no-unresolved': 0,
      'import/extensions': 0
    },
  };
  