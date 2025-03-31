'use strict';

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Make sure any symlinks in the project folder are resolved:
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

// Load dotenv files
const dotenvFiles = [
  `.env.${process.env.NODE_ENV}.local`,
  `.env.${process.env.NODE_ENV}`,
  '.env.local',
  '.env',
].filter(Boolean);

// Load env variables from .env files
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    console.log(`Paths: Loading env from: ${dotenvFile}`);
    dotenv.config({ path: dotenvFile });
  }
});

// We use `PUBLIC_URL` environment variable or "homepage" field to infer
// "public path" at which the app is served.
const publicUrlOrPath = process.env.PUBLIC_URL || './';

console.log('publicUrlOrPath:', publicUrlOrPath);

module.exports = {
  dotenv: resolveApp('.env'),
  appPath: resolveApp('.'),
  appBuild: resolveApp('build'),
  appPublic: resolveApp('public'),
  appHtml: resolveApp('public/index.html'),
  appIndexJs: resolveApp('src/index.tsx'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  appTsConfig: resolveApp('tsconfig.json'),
  appNodeModules: resolveApp('node_modules'),
  publicUrlOrPath,
};
