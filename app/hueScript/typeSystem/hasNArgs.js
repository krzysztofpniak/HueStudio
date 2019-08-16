import { isCallable, unwrapConstraint } from './helpers';

const hasNArgs = (n, type) =>
  isCallable(type) && n === unwrapConstraint(type)[1].signature.length - 1;

export default hasNArgs;
