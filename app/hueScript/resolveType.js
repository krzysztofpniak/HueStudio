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
  scalar,
  array,
  dropNArgs,
  unwrapConstraint
} from './typeSystem';
import constraint from './typeSystem/constraint';

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
    const candidates = newZip(arg.signature, type.signature);

    const signature = filter(
      identity,
      map(([a, b]) => {
        try {
          if (a === null) {
            return resolveType(b, b, resolved);
          } else {
            return resolveType(a, b, resolved);
          }
        } catch (e) {
          return null;
        }
      }, candidates)
    );

    return fn(...signature);
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
  } else if (type.kind === 'Constraint') {
    //return resolveFunctionType(arg, type, resolved);
    const [constr, target] = unwrapConstraint(type);
    return resolveType(arg, target, resolved);
  }
  throw 'not implemented yet';
};

const resolveCall = (args, type, resolved = {}) => {
  const f = fn(...args);

  const [constr, func] = unwrapConstraint(type);

  const argCount = func.signature.length - 1;
  if (args.length > argCount) {
    throw 'Too many arguments';
  }

  const appliedFunction = dropNArgs(
    args.length,
    resolveType(f, func, resolved)
  );

  const applicationResult =
    args.length === argCount ? appliedFunction.signature[0] : appliedFunction;

  return constr ? constraint(constr, applicationResult) : applicationResult;
};

export {
  resolveScalarType,
  resolveFunctionType,
  resolveArrayType,
  resolveType,
  resolveCall
};
