import processHueScriptSync from './processHueScriptSync';

self.addEventListener(
  'message',
  function(e) {
    const { source, hsContext } = e.data;
    const processed = processHueScriptSync(false)(hsContext)(source);
    self.postMessage(processed);
  },
  false
);
