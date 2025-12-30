// eslint.config.mjs
import tseslint from 'typescript-eslint';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: ['node_modules', 'dist'],
  },
  {
    // Shared rules
    files: ['**/*.{ts,tsx,js}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
    },
  },

  // Backend (Node/Express)
  {
    files: ['apps/api/**/*.{ts,js}'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: path.join(__dirname, 'apps/api/tsconfig.json'),
        tsconfigRootDir: path.join(__dirname, 'apps/api'),
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Frontend (React/Vite)
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: path.join(__dirname, 'apps/web/tsconfig.json'),
        tsconfigRootDir: path.join(__dirname, 'apps/web'),
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'no-console': 'warn',
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
