import { getArrayType, isArray } from './helpers';
import { both, compose } from 'ramda';
import isPolyScalar from './isPolyScalar';

const isPolyArray = both(
  isArray,
  compose(
    isPolyScalar,
    getArrayType
  )
);

export default isPolyArray;
