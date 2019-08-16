import { both, compose } from 'ramda';
import { getScalarName, isConcreteTypeName, isScalar } from './helpers';

const isConcreteScalar = both(
  isScalar,
  compose(
    isConcreteTypeName,
    getScalarName
  )
);

export default isConcreteScalar;
