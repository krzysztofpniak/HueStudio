import { curry, filter, map } from 'ramda';
import getResourceByRef from './getResourceByRef';

const getAdjacents = curry((hueData, v) => {
  return map(([a, b]) => {
    const ref = a === v.ref ? b : a;
    const node = getResourceByRef(hueData, ref);
    return { node, ref };
  }, filter(([a, b]) => a === v.ref || b === v.ref, hueData.edges));
});

export default getAdjacents;
