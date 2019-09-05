import { curry } from 'ramda';
import { getScalarName, isArray, isFunction, isScalar } from './helpers';
import overArray from './overArray';
import overFunction from './overFunction';
import $ from 'sanctuary-def';
import { def, HSType } from '../../sanctuary/types';

const substitutePolyScalars = def('substitutePolyScalars')({})([
  $.StrMap(HSType),
  HSType,
  HSType
])(renames => type => {
  if (isScalar(type)) {
    return renames[getScalarName(type)] || type;
  } else if (isArray(type)) {
    return overArray(substitutePolyScalars(renames), type);
  } else if (isFunction(type)) {
    return overFunction(substitutePolyScalars(renames), type);
  }
  throw 'not implemented yet';
});

export default substitutePolyScalars;
