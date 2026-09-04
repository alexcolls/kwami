import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import type { Linter } from 'eslint';

// Annotated rather than inferred: without it `tsc` cannot name the inferred type without
// pointing at a path inside node_modules/.pnpm, and fails the typecheck with TS2742.
const config: Linter.Config[] = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'tests/e2e/fixtures/.generated/**',
      '**/*.d.ts',
    ],
  },
  {
    // Library source. `tsconfig.json` covers src/ only, so the type-aware rules get a
    // program here; the config/test/script files are typed by tsconfig.test.json below.
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      // No unused vars (allow underscore prefix)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Best practices
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',

      // TypeScript specific
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
    },
  },
  {
    files: ['tests/**/*.ts', 'scripts/**/*.ts', '*.config.ts', 'eslint.config.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: ['./tsconfig.test.json'],
      },
    },
    rules: {
      // Tests reach for `!` on fixture lookups the type system cannot narrow, and log
      // deliberately in the e2e harness. Neither is worth a suppression comment per line.
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  {
    // CommonJS config at the repo root — `require`/`module.exports`, not ESM.
    files: ['*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
  },
  {
    // Plain-JS CI, release and e2e-fixture scripts. No type-aware rules — there is no
    // program for them — but the correctness rules still apply.
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', 'tests/e2e/fixtures/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];

export default config;
