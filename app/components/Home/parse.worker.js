import { parseHue } from '../../hueScript';
import { chain, either, maybeToNullable } from '../../sanctuary';
import {
  createHSContext,
  translateProgram
} from '../../hueScript/astToBridgeState';

const errorToErrorLocation = error => {
  const location =
    error.location && error.location.value
      ? maybeToNullable(error.location)
      : error.location;
  return location && location.start ? [location] : [];
};

self.addEventListener(
  'message',
  function(e) {
    const parsed = parseHue(e.data);
    const processed = either(e => ({
      error: e.message,
      errorLocations: errorToErrorLocation(e),
      effects: [],
      infos: []
    }))(r => ({
      error: null,
      errorLocations: [],
      effects: r.effects,
      infos: []
    }))(chain(p => translateProgram(p)(createHSContext()))(parsed));
    self.postMessage(processed);
  },
  false
);
