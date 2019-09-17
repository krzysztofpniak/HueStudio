import $ from 'sanctuary-def';
import {
  def,
  HSEffect,
  HSFnResult,
  HSType,
  HSValue
} from '../../sanctuary/types';
import { addIndex, filter, prop, propEq, test } from 'ramda';

const filterIndexed = addIndex(filter);

const scalar = def('hsScalar')({})([$.String, HSType])(name => ({
  kind: 'Scalar',
  name,
  constraints: {}
}));

const isConcreteTypeName = def('isConcreteTypeName')({})([$.String, $.Boolean])(
  test(/^[A-Z]/)
);

const isPolyTypeName = def('isPolyTypeName')({})([$.String, $.Boolean])(
  test(/^[a-z]/)
);

const isScalar = def('isScalar')({})([HSType, $.Boolean])(
  propEq('kind', 'Scalar')
);

const isFunction = def('isFunction')({})([HSType, $.Boolean])(
  propEq('kind', 'Function')
);

const isArray = def('isArray')({})([HSType, $.Boolean])(
  propEq('kind', 'Array')
);

const isCallable = def('isCallable')({})([HSType, $.Boolean])(type =>
  isFunction(type)
);

const getScalarName = def('getScalarName')({})([HSType, $.String])(
  prop('name')
);

const getArrayType = prop('of');

const getFunctionSignature = prop('signature');

const typedValue = def('typedValue')({})([HSType, $.Unknown, HSValue])(
  type => value => ({ type, value })
);

const hsResult = def('hsResult')({})([
  HSType,
  $.Unknown,
  $.Array(HSEffect),
  HSFnResult
])(type => value => effects => ({ result: typedValue(type)(value), effects }));

const hsPureResult = def('hsPureResult')({})([HSType, $.Unknown, HSFnResult])(
  type => value => ({ result: typedValue(type)(value), effects: [] })
);

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
  getFunctionSignature,
  typedValue,
  hsResult,
  hsPureResult
};
