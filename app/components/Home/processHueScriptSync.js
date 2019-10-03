import { parseHue } from '../../hueScript';
import { chain, either, maybeToNullable } from '../../sanctuary';
import { translateProgram } from '../../hueScript/astToBridgeState';

const errorToErrorLocation = error => {
  const location =
    error.location && error.location.value
      ? maybeToNullable(error.location)
      : error.location;
  return location && location.start ? [location] : [];
};

const processHueScriptSync = includeVars => hsContext => source => {
  const parsed = parseHue(source);
  const processed = either(e => ({
    error: e.message,
    errorLocations: errorToErrorLocation(e),
    effects: [],
    infos: [],
    vars: []
  }))(r => ({
    error: null,
    errorLocations: [],
    effects: r.effects,
    infos: r.infos,
    vars: includeVars ? r.vars : []
  }))(chain(p => translateProgram(p)(hsContext))(parsed));

  return processed;
};

export default processHueScriptSync;
