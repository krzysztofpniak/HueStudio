import { curry, drop, evolve } from 'ramda';
import { isCallable, unwrapConstraint } from './helpers';
import constraint from './constraint';

const dropNArgs = curry((n, type) => {
  if (isCallable(type)) {
    const [constr, func] = unwrapConstraint(type);
    const dropped = evolve({ signature: drop(n) }, func);
    return constr ? constraint(constr, dropped) : dropped;
  }

  return type;
});

export default dropNArgs;
