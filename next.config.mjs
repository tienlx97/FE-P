import createMDX from '@next/mdx';
import { fileURLToPath } from 'node:url';

const rehypeMetaPluginPath = fileURLToPath(
  new URL('./src/shared/api/rehype-meta-as-attributes.js', import.meta.url),
);

const stylexLoaderPath = fileURLToPath(
  new URL('./stylex-loader.cjs', import.meta.url),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // .mdx pages live alongside .js pages under src/app (/blog/*, /tutorial/*).
  pageExtensions: ['js', 'jsx', 'mdx'],
  // NOT setting turbopack.root: this repo lives inside /home/capybara, which
  // also has its own unrelated pnpm-lock.yaml one level up, so Turbopack's
  // root inference picks the wrong directory and warns on every
  // `next dev`/`next build`. Pinning turbopack.root explicitly (tried
  // 2026-08-06) silences the warning but crashes Turbopack's Babel-loader
  // path resolution instead ("Resource path ... needs to be on project
  // filesystem", panics on HMR for any Babel-processed file — i.e. anything
  // StyleX touches). A cosmetic warning beats a fatal crash — see
  // harness/PROGRESS.md for the panic log and revert reasoning.
  experimental: {
    // Next 16 runs babel.config.js (full `next/babel` preset) over every
    // app file when it finds one, so each route's first `pnpm dev` compile
    // waited on Babel for all of src/. Only the StyleX plugin needs Babel:
    // the rule below runs it on files that import StyleX; SWC does the rest.
    turbopackUseBuiltinBabel: false,
  },
  turbopack: {
    rules: {
      '*': {
        condition: {
          all: [
            { not: 'foreign' },
            { path: /\.jsx?$/ },
            { content: /@stylexjs\/stylex/ },
          ],
        },
        loaders: [stylexLoaderPath],
      },
    },
  },
};

// remark-frontmatter parses the leading `---` YAML block; remark-mdx-frontmatter
// turns it into a `frontmatter` export each .mdx page can read (title, date,
// description, ...) instead of hand-writing `export const metadata = {...}`.
// Plugins are passed as module-specifier strings, not imported function
// references — Turbopack's loader options must be JSON-serializable, and
// @next/mdx's loader resolves + imports string entries itself.
const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-frontmatter', 'remark-mdx-frontmatter'],
    // rehype-slug adds an `id` to every rendered heading, using the same
    // github-slugger algorithm remark-flexible-toc uses to build TOC hrefs
    // (see src/shared/api/toc.js) — so heading anchors and TOC links match.
    rehypePlugins: [
      'rehype-slug',
      // Preserve react.dev's fenced-code directives (`{1-3}` and
      // `[[step,line,"substring"]]`) for the mapped CodeBlock component.
      rehypeMetaPluginPath,
    ],
  },
});

export default withMDX(nextConfig);
