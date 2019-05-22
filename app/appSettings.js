import Store from './Store';

const store = new Store({
  configName: 'user-preferences',
  defaults: {
    windowBounds: { width: 1024, height: 768 },
    hueCode:
      'const studio = group(7);\n' +
      'const hall = group(5);\n' +
      'const dimStudio = dimmer(25);\n' +
      'const s1 = status(10);\n' +
      '\n' +
      "dimStudio.button2.addEventListener('long_release', () => {\n" +
      "    studio.alert('select');\n" +
      "    hall.alert('select');\n" +
      '});',
    sp1: 200,
    sp2: 300,
    sp3: 300,
    openedResources: []
  }
});

export default store;
