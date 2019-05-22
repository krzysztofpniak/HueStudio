import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
const electron = require('electron');

const HUEDIR = 'HueStudio';

const getHuePreferencesPath = () => {
  const userDataPath = (electron.app || electron.remote.app).getPath(
    'userData'
  );

  return join(userDataPath, HUEDIR);
};

const ensureDir = () => {
  const dir = getHuePreferencesPath();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

ensureDir();

export { getHuePreferencesPath };
