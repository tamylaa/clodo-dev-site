module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  plugins: ['html'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: ['dist/**', 'node_modules/**'],
  overrides: [
    {
      files: ['public/script.js'],
      env: { browser: true, node: false },
      globals: {
        grecaptcha: 'readonly'
      }
    },
    {
      files: ['build.js', 'dev-server.js', 'scripts/**/*.js'],
      env: { browser: false, node: true },
    },
  ],
  rules: {
    // Keep rules pragmatic for now; tighten later
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-console': 'off',
  },
};
