import { isCallable } from './helpers';

const hasNArgs = (n, type) =>
  isCallable(type) && n === type.signature.length - 1;

export default hasNArgs;
