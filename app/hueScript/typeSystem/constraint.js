import getPolyNames from './getPolyNames';
import { pick, keys } from 'ramda';
import { isConstraint } from './helpers';
import $ from 'sanctuary-def';
import { def, HSType } from '../../sanctuary/types';

const constraint = def('constraint')({})([
  $.StrMap($.Array($.String)),
  HSType,
  HSType
])(constr => type => {
  const polyNames = getPolyNames(type);
  const of = pick(polyNames, { ...constr, ...type.constraints });

  return { ...type, constraints: of };
});

export default constraint;
