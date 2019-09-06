import {
  mergeRight,
  prop,
  compose,
  filter,
  reduce,
  map,
  propOr,
  assoc
} from 'ramda';
import { isConstraint, unwrapConstraint } from './helpers';

//:: [Type] -> [constr, [Type]]
const extractContraints = types => {
  const constr = compose(
    reduce(mergeRight, {}),
    map(propOr({}, 'constraints'))
  )(types);
  const unpacked = map(assoc('constraints', {}), types);
  return [constr, unpacked];
};

export default extractContraints;
