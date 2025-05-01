import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import tailwind from 'eslint-plugin-tailwindcss';
import { FlatCompat } from '@eslint/eslintrc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
});

/** @type {import('eslint').Linter.Config[]} */
const config = [
  { ignores: ['.next/**', 'public/**', 'next.config.js', 'postcss.config.js'] },
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  ...tailwind.configs['flat/recommended'],
  {
    languageOptions: {
      parser: tseslint.ESLintParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
  },
  ...compat.config({
    extends: ['next', 'next/core-web-vitals'],
    settings: {
      next: {
        rootDir: '.',
      },
    },
  }),
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports, // Add unused-imports plugin here
    },
    rules: {
      'tailwindcss/no-custom-classname': ['off'], // Allow custom class names (not restricted to Tailwind)
      'import/no-extraneous-dependencies': 'warn', // Warn about extraneous dependencies in TypeScript files
      'no-param-reassign': 'off', // Allow parameter reassignment
      'consistent-return': 'off', // Disable consistent return requirement
      'no-empty-pattern': 'off', // Allow empty destructuring patterns
      'no-use-before-define': 'off', // Disable "use before define" for all variables and functions
      'no-shadow': 'off', // Disable shadowed variable rule
      '@typescript-eslint/no-shadow': 'off', // Disable shadowed variable rule for TypeScript
      '@typescript-eslint/no-use-before-define': 'off', // Disable "use before define" for TypeScript
      'react/jsx-no-constructed-context-values': 'off', // Allow constructed context values in React
      'import/extensions': 'off', // Disable import extensions requirement (TypeScript handles this)
      'react/function-component-definition': 'off', // Allow different ways to define function components
      'react/destructuring-assignment': 'off', // Disable mandatory destructuring in React components
      'react/require-default-props': 'off', // Allow non-defined props to be undefined
      'react/jsx-props-no-spreading': 'off', // Allow prop spreading in JSX (e.g., in _app.tsx or react-hook-form)
      'react/no-unstable-nested-components': 'off', // Allow unstable nested components (needed by i18n library)
      '@typescript-eslint/comma-dangle': 'off', // Disable ESLint comma-dangle rule to avoid conflict with Prettier
      '@typescript-eslint/consistent-type-imports': 'error', // Enforce consistent usage of `import type`
      'no-restricted-syntax': [
        'error',
        'ForInStatement', // Disallow `for-in` loops
        'LabeledStatement', // Disallow labeled statements
        'WithStatement', // Disallow `with` statements
      ], // Override Airbnb configuration to restrict specific syntax
      'import/prefer-default-export': 'off', // Allow named exports without preferring default exports
      'simple-import-sort/imports': 'error', // Enforce sorted imports
      'simple-import-sort/exports': 'error', // Enforce sorted exports
      'import/order': 'off', // Disable import order rule to avoid conflict with simple-import-sort
      '@typescript-eslint/no-unused-vars': 'off', // Disable unused variables rule for TypeScript
      'unused-imports/no-unused-imports': 'error', // Automatically remove unused imports
      'no-unused-vars': 'off', // Disable unused variables rule (covered by unused-imports plugin)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/naming-convention': 'off', // Disable naming convention rule (can be enabled if desired)
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all', // Warn for all unused variables
          varsIgnorePattern: '^_', // Ignore variables starting with an underscore
          args: 'after-used', // Only warn about unused arguments if they appear after used ones
          argsIgnorePattern: '^_', // Ignore arguments starting with an underscore
        },
      ],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
];
export default config;
