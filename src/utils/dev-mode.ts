/**
 * This file is used to get the dev settings from src/settings/index.json file.
 * This can be used by running the app using this command: yarn run start:dev
 */
import Settings from '../schema';

const fallbackSettings: Settings = {
  productName: "Default Product",
  productPrice: "99 USD"
};

export const getDevSettings = (): Settings => {
  try {
    const devSettings = require('../settings/index.json');
    return devSettings.app.gridApp.settings as Settings;
  } catch {
    return fallbackSettings;
  }
};

export const isDevMode = (): boolean => {
  return process.env.REACT_APP_DEV_MODE === 'true';
}; 