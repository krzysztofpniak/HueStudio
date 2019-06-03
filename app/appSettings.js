import Store from './Store';

const store = new Store({
  configName: 'user-preferences',
  defaults: {
    windowBounds: { width: 1024, height: 768 },
    sp1: 200,
    sp2: 300,
    sp3: 300,
    openedResources: []
  }
});

export default store;
