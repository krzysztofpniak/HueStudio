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
  always,
  sequence,
  addIndex,
  reduce,
  includes,
  mergeRight,
  prop,
  compose
} from 'ramda';
import {
  typeToString,
  fn,
  scalar,
  array,
  dropNArgs,
  unwrapConstraint,
  constraint,
  typeMismatchError,
  getScalarName,
  isConstraint,
  getArrayType
} from './typeSystem';
import { bimap, Right, Left, mapLeft } from '../sanctuary';
import {
  getNewRenamesContext,
  resetRenamesScope
} from './typeSystem/normalizePolyNames';
import normalizePolyNames from './typeSystem/normalizePolyNames';
import isPolyScalar from './typeSystem/isPolyScalar';
import isConcreteScalar from './typeSystem/isConcreteScalar';
import getArity from './typeSystem/getArity';
import overConstraint from './typeSystem/overConstraint';
import extractContraints from './typeSystem/extractConstraints';
import isPolyArray from './typeSystem/isPolyArray';
const mapWithKey = addIndex(map);

const getResolution = (resolved, arg) => {
  if (isPolyScalar(arg)) {
    const argName = getScalarName(arg);
    if (resolved[argName]) {
      return resolved[argName];
    }
  } else if (isPolyArray(arg)) {
    const argName = getScalarName(getArrayType(arg));
    if (resolved[argName]) {
      return array(resolved[argName]);
    }
  }

  return arg;
};

const tryUpdateResolved = (name, value, resolved, constraints) => {
  if (!resolved[name] || isPolyScalar(resolved[name] && !isPolyScalar(value))) {
    resolved[name] = constraint(constraints, getResolution(resolved, value));
  }
};

const matchesConstraints = (constraints, name, value) => {
  return (
    !constraints[name] ||
    (constraints[name] &&
      isConcreteScalar(value) &&
      includes(getScalarName(value), constraints[name]))
  );
};

const resolveScalarType = (arg, type, resolved = {}, constraints = {}) => {
  if (isPolyScalar(type)) {
    if (isPolyScalar(arg)) {
      const typeName = getScalarName(type);
      const argName = getScalarName(arg);
      tryUpdateResolved(typeName, arg, resolved, constraints);
      tryUpdateResolved(argName, type, resolved, constraints);
      return Right(constraint(constraints, getResolution(resolved, arg)));
    } else {
      const typeName = getScalarName(type);

      if (matchesConstraints(constraints, typeName, arg)) {
        tryUpdateResolved(typeName, arg, resolved, constraints);
        return Right(arg);
      }
    }
  } else {
    //type is ConcreteScalar
    if (isPolyScalar(arg)) {
      //arg is PolyScalar, type is ConcreteScalar
      const argName = getScalarName(arg);
      tryUpdateResolved(argName, type, resolved, constraints);
      return Right(type);
    } else if (isConcreteScalar(arg)) {
      //arg is ConcreteScalar, type is ConcreteScalar
      const typeName = getScalarName(type);
      const argName = getScalarName(arg);
      if (typeName === argName) {
        return Right(type);
      }
    } else if (
      arg.kind === 'Constraint' &&
      arg.in.kind === 'Scalar' &&
      arg.of[arg.in.name].includes(type.name)
    ) {
      return Right(type);
    }
  }

  return Left(typeMismatchError(constraint(constraints, type), arg));
  /* old */
  /*
  if (isPolyType(type.name) && !resolved[type.name]) {
    resolved[type.name] = arg;
    return Right(arg);
  } else if (arg.kind === 'Scalar') {
    if (!isPolyType(arg.name) && arg.name === type.name) {
      return Right(arg);
    } else if (isPolyType(arg.name) && !resolved[arg.name]) {
      resolved[arg.name] = type;
      return Right(type);
    } else if (isPolyType(arg.name) && resolved[arg.name]) {
      return Right(resolved[arg.name]);
    }
  } else if (
    arg.kind === 'Constraint' &&
    arg.in.kind === 'Scalar' &&
    arg.of[arg.in.name].includes(type.name)
  ) {
    return Right(type);
  }
  return Left(typeMismatchError(type, arg));
  */
};

const newZip = curry((a, b) =>
  zip(concat(a, repeat(null, b.length - a.length)), b)
);

const resolveFunctionType = (arg, type, resolved = {}, constraints = {}) => {
  if (arg.kind === 'Function' && getArity(arg) <= getArity(type)) {
    const candidates = newZip(arg.signature, type.signature);

    const resolvedArguments = mapWithKey(([a, b], idx) => {
      return mapLeft(x => ({ ...x, argIdx: idx }))(
        resolveType(a || b, b, resolved, constraints)
      );
    }, candidates);

    const signature = sequence(Right)(resolvedArguments);
    const unpacked = map(extractContraints, signature);

    return map(
      ([constr, s]) => constraint({ ...constraints, ...constr }, fn(...s)),
      unpacked
    );
  } else if (isPolyScalar(arg)) {
    //TODO: niepełne
    resolved[getScalarName(arg)] = type;
    return Right(type);
  } else if (isConstraint(arg)) {
    const [constr, e] = unwrapConstraint(arg);
    return resolveType(e, type, resolved, { ...constraints, ...constr });
  }

  return Left(typeMismatchError(type, arg));
};

const wrapMismatchErrorWithArray = e =>
  typeMismatchError(overConstraint(array, e.expected), array(e.given));

const resolveArrayType = (arg, type, resolved = {}, constraints = {}) => {
  if (arg.kind === 'Array') {
    const res = resolveType(arg.of, type.of, resolved, constraints);
    return bimap(wrapMismatchErrorWithArray)(overConstraint(array))(res);
  }
  return Left(
    typeMismatchError(
      constraint(constraints, getResolution(resolved, type)),
      arg
    )
  );
};

const resolveType = (arg, type, resolved = {}, constraints = {}) => {
  if (type.kind === 'Scalar') {
    return resolveScalarType(arg, type, resolved, constraints);
  } else if (type.kind === 'Array') {
    return resolveArrayType(arg, type, resolved, constraints);
  } else if (type.kind === 'Function') {
    return resolveFunctionType(arg, type, resolved, constraints);
  } else if (type.kind === 'Constraint') {
    const [constr, e] = unwrapConstraint(type);
    const resolvedInner = resolveType(arg, e, resolved, {
      ...constraints,
      ...constr
    });

    return map(x => (constr ? constraint(constr, x) : x), resolvedInner);
  }
  return Left('not implemented yet');
};

const getFnFromArgs = args => {
  const [constr, signature] = extractContraints(args);
  return constraint(constr, fn(...signature));
};

const resolveCall = (args, type, resolved = {}) => {
  let renamesContext = getNewRenamesContext();

  const raw = getFnFromArgs(args);

  const f = normalizePolyNames(raw, renamesContext);

  renamesContext = resetRenamesScope(renamesContext);
  const normalizedType = normalizePolyNames(type, renamesContext);

  const [constr, func] = unwrapConstraint(normalizedType);

  const argCount = func.signature.length - 1;
  if (args.length > argCount) {
    throw 'Too many arguments';
  }

  const appliedFunction = map(
    dropNArgs(args.length),
    resolveType(f, normalizedType, resolved)
  );

  const applicationResult = map(
    x => (args.length === argCount ? unwrapConstraint(x)[1].signature[0] : x),
    appliedFunction
  );

  return map(x => (constr ? constraint(constr, x) : x), applicationResult);
};

export {
  getResolution,
  resolveScalarType,
  resolveFunctionType,
  resolveArrayType,
  resolveType,
  resolveCall
};
