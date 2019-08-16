import { both, compose } from 'ramda';
import { getScalarName, isPolyTypeName, isScalar } from './helpers';

const isPolyScalar = both(
  isScalar,
  compose(
    isPolyTypeName,
    getScalarName
  )
);

export default isPolyScalar;
