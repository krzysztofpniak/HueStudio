import $ from 'sanctuary-def';
import { def, HSType } from '../../sanctuary/types';
import { addIndex, filter, prop, propEq, test } from 'ramda';

const filterIndexed = addIndex(filter);

const scalar = def('hsScalar')({})([$.String, HSType])(name => ({
  kind: 'Scalar',
  name,
  constraints: {}
}));

const isConcreteTypeName = test(/^[A-Z]/);

const isPolyTypeName = test(/^[a-z]/);

const isScalar = propEq('kind', 'Scalar');

const isFunction = def('isFunction')({})([HSType, $.Boolean])(
  propEq('kind', 'Function')
);

const isArray = def('isArray')({})([HSType, $.Boolean])(
  propEq('kind', 'Array')
);

const isCallable = def('isCallable')({})([HSType, $.Boolean])(type =>
  isFunction(type)
);

const getScalarName = prop('name');

const getArrayType = prop('of');

const getFunctionSignature = prop('signature');

export {
  filterIndexed,
  scalar,
  isConcreteTypeName,
  isPolyTypeName,
  isScalar,
  isFunction,
  isArray,
  isCallable,
  getScalarName,
  getArrayType,
  getFunctionSignature
};
