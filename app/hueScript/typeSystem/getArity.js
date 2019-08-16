import { isCallable, unwrapConstraint } from './helpers';

const getArity = type =>
  isCallable(type) ? unwrapConstraint(type)[1].signature.length - 1 : 0;

export default getArity;
