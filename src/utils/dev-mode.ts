/**
 * This file is used to get the dev settings from src/settings/index.json file.
 */
import Settings from '../schema';

export const getDevSettings = (): Settings => {
  try {
    const devSettings = require('../settings/index.json');
    return devSettings?.app?.gridApp?.settings;
  } catch (err) {
    console.warn('Failed to load dev settings:', err);
  }
  return {} as Settings;
};

export const isDevMode = (): boolean => {
  return process.env.NODE_ENV === 'development';
};
