const babelConfig = require('./babel.config.js');

module.exports = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: ['src/**/*.{js,jsx}'],
      babelConfig: {
        babelrc: false,
        // Without this Babel also loads babel.config.js, i.e. the whole
        // `next/babel` preset plus StyleX a second time, for every file
        // (~9 s instead of ~1 s on each dev start). ADR-0012.
        configFile: false,
        parserOpts: { plugins: ['jsx'] },
        plugins: babelConfig.plugins,
      },
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};
