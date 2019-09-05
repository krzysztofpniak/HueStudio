import $ from 'sanctuary-def';
import { chain, uniq } from 'ramda';
import isPolyScalar from './isPolyScalar';
import { getScalarName, isConstraint, isArray, isFunction } from './helpers';
import { HSType, def } from '../../sanctuary/types';

/**
 * @sig Type -> [String]
 * @param {Type} type The index.
 * @return {Array} A copy of the supplied array-like object with
 *         the element at index `idx` replaced with the value
 *         returned by applying `fn` to the existing element.
 */
const getPolyNames = def('getPolyNames')({})([HSType, $.Array($.String)])(
  type => {
    if (isPolyScalar(type)) {
      return [getScalarName(type)];
    } else if (isArray(type)) {
      return getPolyNames(type.of);
    } else if (isConstraint(type)) {
      return getPolyNames(type.in);
    } else if (isFunction(type)) {
      return uniq(chain(getPolyNames, type.signature));
    } else {
      return [];
    }
  }
);

export default getPolyNames;
