import { both, compose } from 'ramda';
import { getScalarName, isPolyTypeName, isScalar } from './helpers';
import $ from 'sanctuary-def';
import { def, HSType } from '../../sanctuary/types';

const isPolyScalar = def('isPolyScalar')({})([HSType, $.Boolean])(
  both(
    isScalar,
    compose(
      isPolyTypeName,
      getScalarName
    )
  )
);

export default isPolyScalar;
