import globals from 'globals'
import js from '@eslint/js'
import solid from 'eslint-plugin-solid/configs/typescript.js'
import * as tsParser from '@typescript-eslint/parser'
import tailwind from 'eslint-plugin-tailwindcss'

export default [
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    ...solid,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
  },
  ...tailwind.configs['flat/recommended'],
  {
    rules: {
      // FIXME: add @typescript-eslint/no-unused-vars instead
      'no-unused-vars': 'off',
    },
    ignores: ['node_modules', 'dist']
  }
]
