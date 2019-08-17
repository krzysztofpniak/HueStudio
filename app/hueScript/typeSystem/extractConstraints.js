import { mergeRight, prop, compose, filter, reduce, map } from 'ramda';
import { isConstraint, unwrapConstraint } from './helpers';

//:: [Type] -> [constr, [Type]]
const extractContraints = types => {
  const constr = compose(
    reduce(mergeRight, {}),
    map(prop('of')),
    filter(isConstraint)
  )(types);
  const unpacked = map(
    compose(
      prop(1),
      unwrapConstraint
    ),
    types
  );
  return [constr, unpacked];
};

export default extractContraints;
