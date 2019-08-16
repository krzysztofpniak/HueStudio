import { curry } from 'ramda';
import { unwrapConstraint } from './helpers';
import constraint from './constraint';

const overConstraint = curry((op, type) => {
  const [constr, e] = unwrapConstraint(type);
  return constr ? constraint(constr, op(e)) : op(e);
});

export default overConstraint;
