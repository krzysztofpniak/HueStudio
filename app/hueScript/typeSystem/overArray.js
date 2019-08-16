import { curry } from 'ramda';
import { array, getArrayType } from './helpers';

const overArray = curry((op, type) => {
  return array(op(getArrayType(type)));
});

export default overArray;
