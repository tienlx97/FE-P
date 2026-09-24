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
      // "Meta" custom theme (user request, 2026-09-23) — same reason.
      'src/shared/components/custom/meta/theme.js',
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
  {
    // Golden rule #15 (harness/GOLDEN_RULES.md): theme custom components
    // are composed from Astryx components only — no raw DOM elements, no
    // `className`/`style`; styling goes through component props, `xstyle`
    // + tokens, or the theme's own component overrides. Swizzled Astryx
    // source (`custom/*/astryx/**`) is ejected library code and exempt.
    files: ['src/shared/components/custom/**/*.jsx'],
    ignores: [
      'src/shared/components/custom/*/astryx/**',
    ],
    rules: {
      'react/forbid-elements': [
        'error',
        {
          forbid: [
            'a', 'article', 'aside', 'button', 'div', 'footer', 'form',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'img', 'input',
            'label', 'li', 'main', 'nav', 'ol', 'p', 'section', 'select',
            'span', 'svg', 'table', 'tbody', 'td', 'textarea', 'th',
            'thead', 'tr', 'ul',
          ].map((element) => ({
            element,
            message:
              'Custom components must be built from Astryx components (golden rule #15) — use the matching Astryx component instead of a raw element.',
          })),
        },
      ],
      'react/forbid-dom-props': [
        'error',
        {
          forbid: ['className', 'style'].map((propName) => ({
            propName,
            message:
              'Custom components style through Astryx props, xstyle + tokens, or theme overrides (golden rule #15).',
          })),
        },
      ],
    },
  },
  {
    // Golden rule #16: sizes come from Astryx's scales (size props,
    // --font-size-*, --spacing-*, --size-element-*), not px copied from a
    // mockup. Re-declares the hex-color selectors above because a later
    // `no-restricted-syntax` entry replaces the earlier one for these files.
    files: ['src/shared/components/custom/**/*.jsx'],
    ignores: [
      'src/shared/components/custom/*/astryx/**',
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
        {
          selector: 'Literal[value=/^-?\\d+(\\.\\d+)?px$/]',
          message:
            'No px sizes copied from a mockup (golden rule #16) — use an Astryx size prop or token (--font-size-*, --spacing-*, --size-element-*).',
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
      // Same for the "Meta" custom theme's own build output.
      'src/shared/components/custom/meta/meta.js',
      'src/shared/components/custom/meta/meta.d.ts',
      'src/shared/components/custom/meta/meta.variants.d.ts',
      'src/shared/components/custom/meta/theme.built.css',
    ],
  },
];

export default config;
