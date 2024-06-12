/* eslint-disable */
import globals from 'globals'
import js from '@eslint/js'
import ts from 'typescript-eslint'
import tailwind from 'eslint-plugin-tailwindcss'
import solid from 'eslint-plugin-solid/configs/typescript.js'

export default [
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  {
    ...solid,
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...tailwind.configs['flat/recommended'],
  {
    ignores: ['node_modules', 'dist']
  },
]
