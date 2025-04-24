import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

// Work around a whitespace bug in globals.browser (v13.x) where
// "AudioWorkletGlobalScope " contains a trailing space.
// Remove the bad key and re‑add the correct one.
const browserGlobals = {
  ...globals.browser,
};
if (Object.prototype.hasOwnProperty.call(browserGlobals, 'AudioWorkletGlobalScope ')) {
  delete browserGlobals['AudioWorkletGlobalScope '];
  browserGlobals.AudioWorkletGlobalScope = false; // default writable: false
}

export default typescriptEslint.config(
  { ignores: ['*.d.ts', '**/coverage', '**/dist'] },
  {
    extends: [
      eslint.configs.recommended,
      ...typescriptEslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
    ],
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: browserGlobals,
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
    rules: {
      'vue/no-side-effects-in-computed-properties': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'vue/no-mutating-props': 'off',
      'vue/no-async-in-computed-properties': 'off',
      'no-async-promise-executor': 'off',
      'vue/one-component-per-file': 'off',
    },
  },
  eslintConfigPrettier,
);
