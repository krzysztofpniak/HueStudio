import { getHuePreferencesPath } from './HuePreferences';

const electron = require('electron');
const { dirname, join } = require('path');
const { writeFileSync, readFileSync, mkdirSync, existsSync } = require('fs');

class Store {
  constructor(opts) {
    // Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
    // app.getPath('userData') will return a string of the user's app data directory path.
    this.opts = opts;
    this.load();
  }

  load() {
    const userDataPath = (electron.app || electron.remote.app).getPath(
      'userData'
    );
    console.log('loading', userDataPath);
    // We'll use the `configName` property to set the file name and path.join to bring it all together as a string
    this.path = join(getHuePreferencesPath(), `${this.opts.configName}.json`);

    this.data = { ...this.opts.defaults, ...parseDataFile(this.path) };
  }

  // This will just return the property on the `data` object
  get(key) {
    this.load();
    return this.data[key];
  }

  // ...and this will set it
  set(key, val) {
    this.load();
    this.data[key] = val;
    // Wait, I thought using the node.js' synchronous APIs was bad form?
    // We're not writing a server so there's not nearly the same IO demand on the process
    // Also if we used an async API and our app was quit before the asynchronous write had a chance to complete,
    // we might lose that data. Note that in a real app, we would try/catch this.
    if (!existsSync(dirname(this.path))) {
      mkdirSync(dirname(this.path), { recursive: true });
    }
    writeFileSync(this.path, JSON.stringify(this.data));
  }
}

function parseDataFile(filePath) {
  // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
  // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
  try {
    return JSON.parse(readFileSync(filePath));
  } catch (error) {
    // if there was some kind of error, return the passed in defaults instead.
    return {};
  }
}

// expose the class
export default Store;
