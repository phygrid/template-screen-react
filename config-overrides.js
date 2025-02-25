/**
 * config-overrides.js
 */

const { IgnoreAsyncImportsPlugin } = require('ignore-webpack-plugin');

module.exports = function override(config, env) {
  // 1. Configure ts-loader for NodeNext -> override to esnext
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: 'ts-loader',
    options: {
      transpileOnly: true,
      compilerOptions: {
        module: 'esnext', // Overridden for browser usage
        moduleResolution: 'node'
      }
    },
    exclude: /node_modules/,
  });

  // 2. Ensure proper module resolution
  config.resolve = {
    ...config.resolve,
    // Add .cjs to extensions to ensure Webpack will parse .cjs files as code
    extensions: [
      ...(config.resolve.extensions || []),
      '.cjs',
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
    ],
    mainFields: ['browser', 'module', 'main'],
  };

  // 3. (Optional) IgnoreAsyncImportsPlugin if you truly need it
  config.plugins.push(new IgnoreAsyncImportsPlugin());

  // 4. Fallback for Node core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    assert: require.resolve('assert/'),
    buffer: require.resolve('buffer/'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    util: require.resolve('util/'),
    process: require.resolve('process/browser'),
    zlib: require.resolve('browserify-zlib'),
    path: require.resolve('path-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    url: require.resolve('url/'),
    os: require.resolve('os-browserify/browser'),
    fs: false,
    net: false,
    tls: false,
    child_process: false,
  };

  // 5. Exclude .cjs from file-loader or asset/resource so it won't be treated as a static file
  // Note: The exact rule depends on your version of CRA. If you see multiple rules for images/assets,
  // you'll need to locate the correct one. Usually, the first one has a test: /\.(bmp|gif|jpe?g|png|avif|webp)$/
  // or similar. Another approach is to find the rule with type: 'asset/resource' or 'asset'.
  const oneOfRule = config.module.rules.find((rule) => Array.isArray(rule.oneOf));
  if (oneOfRule) {
    oneOfRule.oneOf.forEach((r) => {
      if (r.type === 'asset/resource' || r.loader?.includes('file-loader')) {
        r.exclude = Array.isArray(r.exclude) ? r.exclude : (r.exclude ? [r.exclude] : []);
        r.exclude.push(/\.cjs$/);
      }
    });
  }

  /**
   * 6. Remove or modify the externals so Axios is properly bundled.
   *    Externals are not commonly used for browser configs.
   *    If you still need to treat some modules as external, do so carefully.
   */
  // comment out or remove the axios external
  config.externals = {
    "osx-temperature-sensor": "commonjs osx-temperature-sensor",
    "process": false,
    "child_process": false,
    "http": false,
    "https": false,
  };

  return config;
};
