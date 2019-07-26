import {
  drop,
  evolve,
  curry,
  any,
  map,
  addIndex,
  filter,
  equals,
  none,
  compose,
  join,
  test
} from 'ramda';
const filterIndexed = addIndex(filter);

const scalar = name => ({ kind: 'Scalar', name });

const array = of => ({ kind: 'Array', of });

const fn = (...signature) => ({ kind: 'Function', signatures: [signature] });

const fnMulti = signatures => ({
  kind: 'Function',
  signatures
});

const dropNArgs = curry((n, type) =>
  type.kind === 'Function' ? evolve({ signatures: map(drop(n)) }, type) : type
);

const dropLastArg = type =>
  type.kind === 'Function'
    ? evolve(
        {
          signatures: map(s =>
            filterIndexed((si, idx) => idx !== s.length - 2, s)
          )
        },
        type
      )
    : type;

const canAcceptNArgs = (n, type) =>
  type.kind === 'Function' && any(s => n <= s.length - 1, type.signatures);

const hasNArgs = (n, type) =>
  type.kind === 'Function' && any(s => n === s.length - 1, type.signatures);

const validateCallArgs = (args, type) => {
  for (let i = 0; i < args.length; i++) {
    let someMatches = false;
    for (let j = 0; j < type.signatures.length; j++) {
      const s = type.signatures[j];
      if (
        (s[i].kind === 'Scalar' && test(/^[a-z]/, s[i].name)) ||
        equals(args[i].type, s[i])
      ) {
        someMatches = true;
        break;
      }
    }
    if (!someMatches) {
      return i;
    }
  }
  return null;
};

const typeToString = type => {
  switch (type.kind) {
    case 'Scalar':
      return type.name;
    case 'Array':
      return `[${typeToString(type.of)}]`;
    case 'Function':
      return join(
        ' or ',
        map(
          compose(
            s => `(${s})`,
            join(' → '),
            map(typeToString),
            s => (s.length > 1 ? s : [scalar('()'), ...s])
          ),
          type.signatures
        )
      );
  }
};

export {
  scalar,
  array,
  fn,
  fnMulti,
  dropNArgs,
  dropLastArg,
  canAcceptNArgs,
  hasNArgs,
  validateCallArgs,
  typeToString
};
