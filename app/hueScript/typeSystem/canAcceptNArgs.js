import { isCallable } from './helpers';

const canAcceptNArgs = (n, type) =>
  isCallable(type) && n <= type.signature.length - 1;

export default canAcceptNArgs;
