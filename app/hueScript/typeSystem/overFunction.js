import { curry, map } from 'ramda';
import { fn, getFunctionSignature } from './helpers';

const overFunction = curry((op, type) => {
  return fn(...map(op, getFunctionSignature(type)));
});

export default overFunction;
