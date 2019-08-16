import { evolve } from 'ramda';
import { filterIndexed, isCallable, unwrapConstraint } from './helpers';
import constraint from './constraint';

const dropLastArg = type => {
  if (isCallable(type)) {
    const [constr, func] = unwrapConstraint(type);
    const dropped = evolve(
      { signature: s => filterIndexed((si, idx) => idx !== s.length - 2, s) },
      func
    );
    return constr ? constraint(constr, dropped) : dropped;
  }

  return type;
};

export default dropLastArg;
