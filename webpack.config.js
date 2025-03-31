const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const dotenv = require('dotenv');

// Load environment variables explicitly
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Load the .env files
const dotenvFiles = [
  `.env.${process.env.NODE_ENV}.local`,
  `.env.${process.env.NODE_ENV}`,
  '.env.local',
  '.env',
].filter(Boolean);

dotenvFiles.forEach(dotenvFile => {
  if (require('fs').existsSync(dotenvFile)) {
    console.log(`Loading env from: ${dotenvFile}`);
    dotenv.config({ path: dotenvFile });
  }
});

// Load environment variables for injection
const getClientEnvironment = require('./webpack.env');
const paths = require('./config/paths');

const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

console.log('Public URL: ', process.env.PUBLIC_URL);
console.log('publicUrlOrPath: ', paths.publicUrlOrPath);

module.exports = {
  // 'production' or 'development' based on NODE_ENV
  mode: isProduction ? 'production' : 'development',
  target: 'web',

  // Stats configuration to suppress warnings
  stats: {
    children: true, // Show children compilation stats
    errorDetails: true, // Show detailed error information
  },

  // devtool for source maps
  //  - 'eval-source-map' (fast in dev)
  //  - 'source-map' if you want separate .map files in production
  devtool: isProduction ? 'source-map' : 'eval-source-map',

  // Optimization for devtool in development
  ...(isDevelopment && {
    snapshot: {
      managedPaths: [/^(.+?[\\/]node_modules[\\/])/], // Further optimize node_modules handling
    },
  }),

  // Use Webpack 5 filesystem cache for faster rebuilds
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
    compression: false, // Disable cache compression to save CPU
    maxAge: 604800000, // 1 week cache validity in ms
    // Only store required files, avoid unnecessarily watching dependencies
    allowCollectingMemory: false,
  },

  // Main entry point
  entry: paths.appIndexJs,

  // Output settings
  output: {
    path: paths.appBuild,
    filename: isProduction
      ? 'static/js/[name].[contenthash:8].js'
      : 'static/js/[name].js',
    chunkFilename: isProduction
      ? 'static/js/[name].[contenthash:8].chunk.js'
      : 'static/js/[name].chunk.js',
    publicPath: paths.publicUrlOrPath,

    // Make sure file paths appear correctly in devtools
    devtoolModuleFilenameTemplate: isDevelopment
      ? (info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
      : (info) =>
          path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/'),

    chunkLoadingGlobal: 'webpackJsonp',
    globalObject: 'this',
  },

  // Resolve typical file extensions + fallback shims
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'process/browser': require.resolve('process/browser'),
      xlsx: 'xlsx-js-style',
    },
    fallback: {
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      url: require.resolve('url/'),
      querystring: require.resolve('querystring-es3'),
      os: require.resolve('os-browserify/browser'),
      crypto: require.resolve('crypto-browserify'),
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
      buffer: require.resolve('buffer/'),
      vm: require.resolve('vm-browserify'),
      assert: require.resolve('assert/'),
      net: false,
      tls: false,
      fs: false,
      dns: false,
      child_process: false,
      module: false,
    },
    mainFields: ['browser', 'module', 'main'],
    symlinks: false, // Disable resolving symlinks to their real path (saves CPU/battery)
  },

  // Minification and chunk splitting
  optimization: {
    minimize: isProduction,
    minimizer: [
      // Minify JS
      new TerserPlugin({
        terserOptions: {
          parse: { ecma: 8 },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
          },
          mangle: { safari10: true },
          output: { ecma: 5, comments: false, ascii_only: true },
        },
        extractComments: false, // Don't generate LICENSE files
      }),
      // Minify CSS
      new CssMinimizerPlugin(),
    ],
    // Configure chunk splitting - UPDATED FOR FEWER, LARGER BUNDLES
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 5, // Reduced from 10
      minSize: 250_000, // Increased from 100_000
      maxSize: 4_000_000, // Increased from 2_000_000
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
        },
        // Consolidate common code into fewer chunks
        common: {
          name: 'common',
          minChunks: 3, // Increased from 2 to be more selective
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
        // Single chunk for route components instead of separate ones
        routes: {
          test: /[\\/]src[\\/]app[\\/](grid|organisations|devices|browsers|sales|teams)[\\/]/,
          name: 'routes',
          chunks: 'all',
          priority: 15,
          reuseExistingChunk: true,
        },
      },
    },
    // Separate runtime chunk
    runtimeChunk: {
      name: (entrypoint) => `runtime-${entrypoint.name}`,
    },
  },

  module: {
    rules: [
      // Single rule for JS, JSX, TS, and TSX using only Babel (no ts-loader)
      {
        test: /\.(js|jsx|ts|tsx)$/,
        include: paths.appSrc,
        exclude: /node_modules/, // Explicitly exclude node_modules
        loader: 'babel-loader',
        options: {
          sourceMaps: isDevelopment,
          presets: [
            // The CRA preset w/ TS support & new JSX runtime
            [
              'react-app',
              {
                flow: false,
                typescript: true,
                runtime: 'automatic', // React 17+ "new" JSX transform
                importSource: '@emotion/react', // Points JSX at Emotion
              },
            ],
            // The Emotion preset for `css` prop + advanced features (component selectors)
            '@emotion/babel-preset-css-prop',
          ],
          plugins: [
            // Remove react-hot-loader
            // 'react-hot-loader/babel',

            // Allows code splitting with `import(...)`
            '@babel/plugin-syntax-dynamic-import',

            // Reuse Babel helper code, reduces bundle size
            '@babel/plugin-transform-runtime',

            // We keep plugin-transform-react-jsx as well, though CRA preset
            // usually covers it. It's harmless to have it here.
            ['@babel/plugin-transform-react-jsx', { throwIfNamespace: false }],
          ],
          cacheDirectory: true,
          cacheCompression: false,
          compact: isProduction,
        },
      },
      {
        test: /\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: isDevelopment,
            },
          },
        ],
      },
      {
        test: /\.less$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: isDevelopment,
            },
          },
          {
            loader: 'less-loader',
            options: {
              sourceMap: isDevelopment,
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 10 * 1024 }, // 10kb
        },
        generator: {
          filename: 'static/media/[name].[hash:8][ext]',
        },
      },
      {
        test: /\.svg$/,
        oneOf: [
          {
            resourceQuery: /url/,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: 'static/media/[name].[hash:8].[ext]',
                },
              },
            ],
          },
          {
            issuer: /\.[jt]sx?$/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  sourceMaps: isDevelopment,
                  presets: [
                    [
                      'react-app',
                      {
                        runtime: 'automatic',
                        importSource: '@emotion/react',
                      },
                    ],
                    '@emotion/babel-preset-css-prop',
                  ],
                  plugins: [
                    ['@babel/plugin-transform-react-jsx', { throwIfNamespace: false }],
                  ],
                  cacheDirectory: true,
                  cacheCompression: false,
                  compact: isProduction,
                },
              },
              {
                loader: '@svgr/webpack',
                options: {
                  babel: false,
                  svgo: false,
                },
              },
              {
                loader: 'url-loader',
                options: {
                  limit: 10000,
                  name: 'static/media/[name].[hash:8].[ext]',
                },
              },
            ],
          },
          {
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: 'static/media/[name].[hash:8].[ext]',
                },
              },
            ],
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name].[hash:8][ext]',
        },
      },
    ],
  },

  plugins: [
    // Clean the build directory before compilation
    new CleanWebpackPlugin(),

    // Generate an HTML file with all webpack bundles injected
    new HtmlWebpackPlugin({
      template: paths.appHtml,
      inject: true,
      ...(isProduction && {
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
    }),

    // Replaces %PUBLIC_URL% with the actual path in index.html
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
      PUBLIC_URL: env.raw.PUBLIC_URL || '',
    }),

    // Provide polyfills for Node.js core modules
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),

    // Extract CSS into separate files for production
    isProduction &&
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
      }),

    // Define environment variables for the client
    new webpack.DefinePlugin(env.stringified),

    // Copy any remaining static assets from public to build
    new CopyWebpackPlugin({
      patterns: [
        {
          from: paths.appPublic,
          to: paths.appBuild,
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),

    // Progress indicator during builds
    new webpack.ProgressPlugin((percentage, message, ..._args) => {
      console.log(`${(percentage * 100).toFixed(2)}% ${message}`);
    }),

    // Uncomment if you want explicit source map files in production, too:
    /*
    ...(isProduction
      ? [
          new webpack.SourceMapDevToolPlugin({
            filename: '[file].map',
            exclude: /node_modules/,
          }),
        ]
      : []),
    */
  ].filter(Boolean),

  devServer: {
    historyApiFallback: true,
    hot: true,
    port: process.env.PORT || 3000,
    open: true,
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: paths.publicUrlOrPath,
      watch: {
        ignored: [
          '**/node_modules/**', // Explicitly ignore watching node_modules
          '**/dist/**',
          '**/.git/**',
        ],
        aggregateTimeout: 300, // Delay rebuilding after file change detection
        poll: false, // Use native file system events instead of polling
      },
    },
    watchFiles: {
      paths: ['src/**/*'], // Only watch the src directory
      options: {
        ignored: /node_modules/,
        aggregateTimeout: 300,
        poll: false, // Disable polling to reduce CPU usage
      },
    },
    devMiddleware: {
      stats: 'minimal', // Reduce console output
      writeToDisk: true, // Write to disk to speed up restarts
      mimeTypes: { 'text/html': ['html'] },
    },
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      const publicUrl = env.raw.PUBLIC_URL || '';

      // Add middleware to handle %PUBLIC_URL% requests
      devServer.app.get('/%PUBLIC_URL%/*', (req, res) => {
        const requestPath = req.path.replace('/%PUBLIC_URL%', publicUrl);
        console.log(`Redirecting ${req.path} to ${requestPath}`);
        res.redirect(requestPath);
      });

      return middlewares;
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: (error) => {
          if (
            error?.message ===
            'ResizeObserver loop completed with undelivered notifications.'
          ) {
            console.error(error);
            return false;
          }
          return true;
        },
      },
      logging: 'none',
      progress: isDevelopment, // Only show progress in dev mode
    },
  },
};
