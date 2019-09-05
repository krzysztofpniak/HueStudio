import { both, compose } from 'ramda';
import { getScalarName, isConcreteTypeName, isScalar } from './helpers';
import $ from 'sanctuary-def';
import { def, HSType } from '../../sanctuary/types';

const isConcreteScalar = def('isConcreteScalar')({})([HSType, $.Boolean])(
  both(
    isScalar,
    compose(
      isConcreteTypeName,
      getScalarName
    )
  )
);

export default isConcreteScalar;
