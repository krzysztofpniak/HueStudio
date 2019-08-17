import getPolyNames from './getPolyNames';
import { pick, keys } from 'ramda';
import { isConstraint } from './helpers';

const constraint = (def, type) => {
  const polyNames = getPolyNames(type);
  const of = pick(polyNames, isConstraint(type) ? { ...def, ...type.of } : def);
  const _in = isConstraint(type) ? type.in : type;

  return keys(of).length > 0
    ? {
        kind: 'Constraint',
        of,
        in: _in
      }
    : _in;
};

export default constraint;
