import getPolyNames from './getPolyNames';
import { pick } from 'ramda';
import { isConstraint } from './helpers';

const constraint = (def, type) => {
  const polyNames = getPolyNames(type);
  const of = pick(polyNames, isConstraint(type) ? { ...def, ...type.of } : def);
  const _in = isConstraint(type) ? type.in : type;

  return polyNames.length > 0
    ? {
        kind: 'Constraint',
        of,
        in: _in
      }
    : _in;
};

export default constraint;
