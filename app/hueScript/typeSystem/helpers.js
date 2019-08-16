import {
  addIndex,
  complement,
  curry,
  filter,
  map,
  prop,
  propEq,
  test
} from 'ramda';

const filterIndexed = addIndex(filter);

const scalar = name => ({ kind: 'Scalar', name });

const array = of => ({ kind: 'Array', of });

const fn = (...signature) => ({ kind: 'Function', signature: signature });

const unwrapConstraint = type => {
  return type.kind === 'Constraint' ? [type.of, type.in] : [null, type];
};

const isConcreteTypeName = test(/^[A-Z]/);

const isPolyTypeName = test(/^[a-z]/);

const isScalar = propEq('kind', 'Scalar');

const isFunction = propEq('kind', 'Function');

const isArray = propEq('kind', 'Array');

const isConstraint = propEq('kind', 'Constraint');

const isCallable = type => isFunction(unwrapConstraint(type)[1]);

const getScalarName = prop('name');

const getArrayType = prop('of');

const getFunctionSignature = prop('signature');

export {
  filterIndexed,
  scalar,
  array,
  fn,
  unwrapConstraint,
  isConcreteTypeName,
  isPolyTypeName,
  isScalar,
  isFunction,
  isArray,
  isConstraint,
  isCallable,
  getScalarName,
  getArrayType,
  getFunctionSignature
};
