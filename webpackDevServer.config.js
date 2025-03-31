'use strict';

const path = require('path');
const paths = require('./config/paths');

module.exports = {
  // Make sure this matches your desired build mode
  mode: 'development',

  // For proper source maps in development
  devtool: 'cheap-module-source-map',

  // Use the same entry point as webpack.config.js
  entry: paths.appIndexJs,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: paths.publicUrlOrPath,
  },

  // ...
  // other module/rules/plugins as needed
  // ...

  devServer: {
    // Enable gzip compression for served files.
    compress: true,

    // Webpack Dev Server 5 merges client overlay/logging into `devServer.client`.
    client: {
      // Control the logging shown in the browser console.
      logging: 'none',
      // Show a full-screen overlay on browser upon build errors.
      overlay: {
        errors: true,
        warnings: false, // set to true if you want to see warnings
      },
    },

    // Enable hot module replacement
    hot: true,

    // Decide how you want to serve static files in development
    static: {
      directory: path.resolve(__dirname, 'public'),
      watch: true, // watch for file changes in /public
      publicPath: paths.publicUrlOrPath, // Use the environment variable
    },

    // In single-page apps, use `historyApiFallback: true` so the dev server
    // always serves `index.html` instead of a 404 when the path doesn't match
    historyApiFallback: true,

    // If you have an API server or need to proxy requests:
    // proxy: {
    //   '/api': 'http://localhost:5000',
    // },

    // In Webpack 5, allowedHosts: 'all' replaces older disableHostCheck
    allowedHosts: 'all',

    // If you need https in dev:
    // https: true,

    // If you want to customize the host
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 3000,

    // The new approach in Webpack 5 to apply custom middlewares:
    setupMiddlewares(middlewares, devServer) {
      if (!devServer) {
        throw new Error('Webpack dev server is not defined');
      }

      // Add your own middlewares or modifications here if needed.

      return middlewares;
    },

    // If you want to watch specific files/directories and ignore others:
    watchFiles: {
      paths: ['src/**/*'],
      options: {
        // Equivalent to ignoring node_modules, but adjust as you prefer
        ignored: /node_modules/,
      },
    },
  },
};
