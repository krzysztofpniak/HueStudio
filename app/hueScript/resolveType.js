import {
  test,
  map,
  zip,
  concat,
  repeat,
  curry,
  xprod,
  filter,
  identity,
  equals,
  tryCatch,
  always
} from 'ramda';
import {
  typeToString,
  fn,
  fnMulti,
  scalar,
  array,
  dropNArgs
} from './coreLib/signatures';

const isPolyType = test(/^[a-z]+$/);

const resolveScalarType = (arg, type, resolved = {}) => {
  if (isPolyType(type.name) && !resolved[type.name]) {
    resolved[type.name] = arg;
    return arg;
  } else if (arg.kind === 'Scalar') {
    if (!isPolyType(arg.name) && arg.name === type.name) {
      return arg;
    } else if (isPolyType(arg.name) && !resolved[arg.name]) {
      resolved[arg.name] = type;
      return type;
    } else if (isPolyType(arg.name) && resolved[arg.name]) {
      return resolved[arg.name];
    }
  }
  throw `Wrong type, expected ${typeToString(type)}, ${typeToString(
    arg
  )} given`;
};

const newZip = curry((a, b) =>
  zip(concat(a, repeat(null, b.length - a.length)), b)
);

const resolveFunctionType = (arg, type, resolved = {}) => {
  if (arg.kind === 'Function') {
    const candidates = map(
      ([a, b]) => newZip(a, b),
      xprod(arg.signatures, type.signatures)
    );

    const signatures = filter(
      identity,
      map(x => {
        try {
          return map(([a, b]) => {
            if (a === null) {
              return resolveType(b, b, resolved);
            } else {
              return resolveType(a, b, resolved);
            }
          }, x);
        } catch (e) {
          return null;
        }
      }, candidates)
    );

    if (signatures.length > 0) {
      return fnMulti(signatures);
    }
  }

  throw `Wrong type, expected ${typeToString(type)}, ${typeToString(
    arg
  )} given`;
};

const resolveArrayType = (arg, type, resolved = {}) => {
  if (arg.kind === 'Array') {
    if (type.of.kind === 'Scalar') {
      return array(resolveScalarType(arg.of, type.of));
    } else if (type.of.kind === 'Array') {
      return array(resolveArrayType(arg.of, type.of, resolved));
    } else if (type.of.kind === 'Function') {
      return array(resolveFunctionType(arg.of, type.of, resolved));
    }
  }
  throw `Wrong type, expected ${typeToString(type)}, ${typeToString(
    arg
  )} given`;
};

const resolveType = (arg, type, resolved = {}) => {
  if (type.kind === 'Scalar') {
    return resolveScalarType(arg, type, resolved);
  } else if (type.kind === 'Array') {
    return resolveArrayType(arg, type, resolved);
  } else if (type.kind === 'Function') {
    return resolveFunctionType(arg, type, resolved);
  }
  throw 'not implemented yet';
};

const resolveCall = (args, type, resolved = {}) => {
  const f = fn(...args);
  const argCount = type.signatures[0].length - 1;
  if (args.length > argCount) {
    throw 'Too many arguments';
  }

  const zz = dropNArgs(args.length, resolveType(f, type, resolved));

  if (args.length === argCount) {
    return zz.signatures[0][0];
  } else {
    return zz;
  }
};

export {
  resolveScalarType,
  resolveFunctionType,
  resolveArrayType,
  resolveType,
  resolveCall
};
