import { curry, map } from 'ramda';
import { getFunctionSignature } from './helpers';
import fn from './fn';

const overFunction = curry((op, type) => {
  return fn(...map(op, getFunctionSignature(type)));
});

export default overFunction;
