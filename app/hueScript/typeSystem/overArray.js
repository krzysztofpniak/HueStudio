import { curry } from 'ramda';
import { array, getArrayType } from './index';

const overArray = curry((op, type) => {
  return array(op(getArrayType(type)));
});

export default overArray;
