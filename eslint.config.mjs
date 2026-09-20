import js from '@eslint/js';
import stylexPlugin from '@stylexjs/eslint-plugin';
import next from 'eslint-config-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import * as mdx from 'eslint-plugin-mdx';
import packageJsonPlugin from 'eslint-plugin-package-json';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

const config = [
  js.configs.recommended,
  ...next,
  {
    ...mdx.flat,
    // JSX embedded in .mdx (custom components, {expressions}) is linted
    // through the mdx parser's own JS handling — code fences are prose, not
    // lint targets, so leave `mdx.flatCodeBlocks` out.
    rules: {
      ...mdx.flat.rules,
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    ...packageJsonPlugin.configs.recommended,
    files: ['package.json'],
    rules: {
      'package-json/order-properties': 'error',
      'package-json/sort-collections': 'error',
      'package-json/no-empty-fields': 'error',
      'package-json/no-redundant-files': 'error',
      'package-json/no-redundant-publishConfig': 'error',
      'package-json/unique-dependencies': 'error',
      'package-json/specify-peers-locally': 'error',
      'package-json/require-name': 'error',
      'package-json/require-version': 'error',
      'package-json/valid-name': 'error',
      'package-json/valid-version': 'error',
      'package-json/valid-dependencies': 'error',
      'package-json/valid-devDependencies': 'error',
      'package-json/valid-engines': 'error',
      'package-json/valid-scripts': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: { '@stylexjs': stylexPlugin },
    rules: {
      '@stylexjs/valid-styles': 'error',
      '@stylexjs/no-unused': 'error',
      '@stylexjs/valid-shorthands': 'warn',
      '@stylexjs/sort-keys': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Convention: React components (files containing JSX) live in `.jsx`,
    // plain logic (hooks without JSX, config, api clients, zod schemas,
    // types) stays `.js` — makes the split mechanically enforced instead of
    // relying on someone remembering it. `page.js`/`layout.js` are Next.js
    // routing-convention filenames resolved by framework config
    // (`next.config.mjs`'s `pageExtensions`), not by this rule, so a
    // `.jsx` page/layout is still required to actually be named that way,
    // but nothing here special-cases the name.
    files: ['src/**/*.js'],
    rules: {
      'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],
    },
  },
  {
    // openspec/project.md's Color convention says every color comes from a
    // theme token and no raw hex lives outside src/shared/components/theme.js
    // — but nothing enforced it, which is how a /design-system code sample
    // ended up documenting `--color-accent: '#b91a24'` (red) while the real
    // accent was teal. TemplateElement is checked alongside Literal because
    // that stale sample lived in a template literal.
    files: ['src/**/*.js', 'src/**/*.jsx'],
    ignores: [
      'src/shared/components/theme.js',
      // "Maritime" custom theme (user request, 2026-09-18) — same
      // exemption reason.
      'src/shared/components/custom/maritime/theme.js',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]',
          message:
            'No hardcoded hex colors. Use an Astryx theme token (--color-*); define new values in src/shared/components/theme.js.',
        },
        {
          selector:
            'TemplateElement[value.raw=/#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]',
          message:
            'No hardcoded hex colors. Use an Astryx theme token (--color-*); define new values in src/shared/components/theme.js.',
        },
      ],
    },
  },
  eslintConfigPrettier,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'template/**',
      'harness/**',
      'babel.config.js',
      'postcss.config.js',
      // `astryx theme build` output — generated from
      // src/shared/components/theme.js and gitignored. Linting build
      // artifacts reports problems nobody can fix at the source.
      'src/shared/components/kt-xnk.js',
      'src/shared/components/kt-xnk.d.ts',
      'src/shared/components/kt-xnk.variants.d.ts',
      // Same for the "Maritime" custom theme's own build output.
      'src/shared/components/custom/maritime/maritime.js',
      'src/shared/components/custom/maritime/maritime.d.ts',
      'src/shared/components/custom/maritime/maritime.variants.d.ts',
      'src/shared/components/custom/maritime/theme.built.css',
    ],
  },
];

export default config;
