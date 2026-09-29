// Turbopack loader that runs only the StyleX Babel plugin (the one in
// babel.config.js). next.config.mjs applies it to app files that import
// `@stylexjs/stylex`; everything else stays on SWC. Next 16's built-in
// Babel support would otherwise run the full `next/babel` preset over every
// file in src/, which made each route's first compile slow in `pnpm dev`.
const babel = require('@babel/core');

const { plugins } = require('./babel.config.js');

/**
 * @this {{ async: () => (error: Error | null, code?: string, map?: object) => void, resourcePath: string, sourceMap?: boolean }}
 * @param {string} source
 */
module.exports = function stylexLoader(source) {
  const callback = this.async();
  babel
    .transformAsync(source, {
      filename: this.resourcePath,
      babelrc: false,
      configFile: false,
      parserOpts: { plugins: ['jsx'] },
      plugins,
      sourceMaps: this.sourceMap !== false,
    })
    .then(
      (result) => callback(null, result?.code ?? source, result?.map ?? undefined),
      (error) => callback(error),
    );
};
