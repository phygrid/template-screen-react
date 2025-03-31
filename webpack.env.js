const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Get the root path of the project
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

// Load environment variables from .env files
const dotenvFiles = [
  // Load .env.development.local first, then .env.development, etc.
  `.env.${process.env.NODE_ENV}.local`,
  `.env.${process.env.NODE_ENV}`,
  '.env.local',
  '.env',
].filter(Boolean);

console.log('Looking for env files:', dotenvFiles);

// Load env variables from .env files
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    console.log(`Loading env from: ${dotenvFile}`);
    dotenv.config({ path: dotenvFile });
  }
});

// Grab NODE_ENV and REACT_APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in webpack configuration.
const REACT_APP = /^REACT_APP_/i;

function getClientEnvironment(publicUrl) {
  const raw = Object.keys(process.env)
    .filter(key => REACT_APP.test(key) || key === 'NODE_ENV' || key === 'PUBLIC_URL')
    .reduce(
      (env, key) => {
        env[key] = process.env[key];
        return env;
      },
      {
        // Useful for determining whether we're running in production mode.
        NODE_ENV: process.env.NODE_ENV || 'development',
        // Useful for resolving the correct path to static assets in `public`.
        PUBLIC_URL: publicUrl || process.env.PUBLIC_URL || '',
      }
    );

  console.log('Environment variables for webpack:', raw);

  // Stringify all values so we can feed into webpack DefinePlugin
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}

module.exports = getClientEnvironment;
