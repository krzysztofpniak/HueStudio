import { getArrayType, isArray } from './helpers';
import { both, compose } from 'ramda';
import isPolyScalar from './isPolyScalar';
import $ from 'sanctuary-def';
import { def, HSType } from '../../sanctuary/types';

const isPolyArray = def('isPolyArray')({})([HSType, $.Boolean])(
  both(
    isArray,
    compose(
      isPolyScalar,
      getArrayType
    )
  )
);

export default isPolyArray;
