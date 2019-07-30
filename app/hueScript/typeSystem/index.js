import {
  propEq,
  any,
  test,
  both,
  prop,
  compose,
  complement,
  map,
  curry,
  evolve,
  drop,
  equals,
  addIndex,
  filter
} from 'ramda';
import constraint from './constraint';
import typeToString from './typeToString';

const filterIndexed = addIndex(filter);

const isConcreteTypeName = test(/^[A-Z]/);

const isScalar = propEq('kind', 'Scalar');

const getScalarName = prop('name');

const isConcreteScalar = both(
  isScalar,
  compose(
    isConcreteTypeName,
    getScalarName
  )
);

const scalar = name => ({ kind: 'Scalar', name });

const array = of => ({ kind: 'Array', of });

const fn = (...signature) => ({ kind: 'Function', signature: signature });

const unwrapConstraint = type => {
  return type.kind === 'Constraint' ? [type.of, type.in] : [null, type];
};

const isFunction = type => unwrapConstraint(type)[1].kind === 'Function';

const canAcceptNArgs = (n, type) =>
  isFunction(type) && n <= unwrapConstraint(type)[1].signature.length - 1;

const hasNArgs = (n, type) =>
  isFunction(type) && n === unwrapConstraint(type)[1].signature.length - 1;

const dropNArgs = curry((n, type) => {
  if (isFunction(type)) {
    const [constr, func] = unwrapConstraint(type);
    const dropped = evolve({ signature: drop(n) }, func);
    return constr ? constraint(constr, dropped) : dropped;
  }

  return type;
});

const dropLastArg = type => {
  if (isFunction(type)) {
    const [constr, func] = unwrapConstraint(type);
    const dropped = evolve(
      { signature: s => filterIndexed((si, idx) => idx !== s.length - 2, s) },
      func
    );
    return constr ? constraint(constr, dropped) : dropped;
  }

  return type;
};

const validateCallArgs = (args, type) => {
  const [constr, func] = unwrapConstraint(type);

  for (let i = 0; i < args.length; i++) {
    const s = func.signature[i];
    if (
      !(
        (s.kind === 'Scalar' && test(/^[a-z]/, s.name)) ||
        equals(args[i].type, s)
      )
    ) {
      return i;
    }
  }
  return null;
};

export {
  scalar,
  array,
  fn,
  isScalar,
  isConcreteScalar,
  constraint,
  typeToString,
  dropNArgs,
  unwrapConstraint,
  isFunction,
  canAcceptNArgs,
  hasNArgs,
  dropLastArg,
  validateCallArgs
};
