import { addIndex, includes, compose, dissoc, mapAccum, chain } from 'ramda';
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
import {
  bimap,
  Right,
  Left,
  mapLeft,
  lift2,
  join,
  lift3,
  reduce,
  keys,
  fromMaybe,
  takeLast,
  concat,
  zip,
  map,
  equals,
  on,
  zipWith,
  renameKeys
} from '../sanctuary';
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
import substitutePolyScalars from './typeSystem/substitutePolyScalars';
import typeToTypeResolution from './typeSystem/typeToTypeResolution';
import $ from 'sanctuary-def';
import { def, HSType, HSTypeResolution } from '../sanctuary/types';
const mapWithKey = addIndex(map);
const mapAccumIndexed = addIndex(mapAccum);

const getResolution = def('getResolution')({})([
  $.StrMap(HSType),
  HSType,
  HSType
])(resolved => arg => {
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
});

const tryUpdateResolved = def('tryUpdateResolved')({})([
  $.String,
  HSType,
  $.StrMap(HSType),
  $.StrMap(HSType)
])(name => value => resolved => {
  if (!resolved[name]) {
    return { ...resolved, [name]: getResolution(resolved)(value) };
  } else if (isPolyScalar(resolved[name]) && !isPolyScalar(value)) {
    const resolution = getResolution(resolved)(value);
    return {
      ...map(
        substitutePolyScalars({
          [getScalarName(resolved[name])]: resolution
        })
      )(resolved),
      [name]: resolution
    };
  }
  return resolved;
});

const matchesConstraints = def('matchesConstraints')({})([
  $.StrMap($.Array($.String)),
  $.String,
  HSType,
  $.Boolean
])(constraints => name => value => {
  return (
    !constraints[name] ||
    (constraints[name] &&
      isConcreteScalar(value) &&
      includes(getScalarName(value), constraints[name]))
  );
});

//typeResolutionToType :: TypeResolution -> Type
const typeResolutionToType = dissoc('resolutions');

//safeResolutionsMerge :: Resolutions -> Resolutions -> Either String Resolutions
const safeResolutionsMerge = def('safeResolutionsMerge')({})([
  $.StrMap(HSType),
  $.StrMap(HSType),
  $.Either($.Unknown)($.StrMap(HSType))
])(left => right => {
  return Right({ ...left, ...right });
});

const a = $.TypeVariable('a');

//safeApplyConstraints :: HSType -> HSType -> Either Error HSType
const safeApplyConstraints = def('safeApplyConstraints')({})([
  HSType,
  HSType,
  $.Either($.Error)(HSType)
])(source => target => {
  if (equals(source.constraints)({}) || isConcreteScalar(target)) {
    return Right(target);
  } else {
    const sourceName = getScalarName(source);
    const targetName = getScalarName(target);
    const newConstraints = renameKeys({
      [sourceName]: targetName
    })(source.constraints);
    return Right(constraint(newConstraints)(target));
  }
});

//resolveScalarType :: TypeResolution -> TypeResolution -> Either String TypeResolution
const resolveScalarType = def('resolveScalarType')({})([
  HSTypeResolution,
  HSTypeResolution,
  $.Either($.Unknown)(HSTypeResolution)
])(a => b => {
  const resolutionsBase = safeResolutionsMerge(a.resolutions)(b.resolutions);
  const aType = a.type;
  const bType = b.type;

  if (isPolyScalar(bType)) {
    if (isPolyScalar(aType)) {
      const typeName = getScalarName(bType);
      const argName = getScalarName(aType);

      const constrainedAType = safeApplyConstraints(bType)(aType);
      const constrainedBType = safeApplyConstraints(aType)(bType);

      return lift3(r => a => b => {
        return compose(
          fr => ({ type: getResolution(fr)(a), resolutions: fr }),
          tryUpdateResolved(typeName)(a),
          tryUpdateResolved(argName)(b)
        )(r);
      })(resolutionsBase)(constrainedAType)(constrainedBType);
    } else if (
      matchesConstraints(bType.constraints)(getScalarName(bType))(aType)
    ) {
      const typeName = getScalarName(bType);
      return map(
        compose(
          r => ({ type: aType, resolutions: r }),
          tryUpdateResolved(typeName)(aType)
        )
      )(resolutionsBase);
      /*if (matchesConstraints(constraints, typeName, arg)) {
        tryUpdateResolved(typeName, arg, resolved, constraints);
        return Right(arg);
      }*/
    }
  } else {
    //type is ConcreteScalar
    if (isPolyScalar(aType)) {
      //arg is PolyScalar, type is ConcreteScalar
      const argName = getScalarName(aType);

      return map(
        compose(
          r => ({ type: bType, resolutions: r }),
          tryUpdateResolved(argName)(bType)
        )
      )(resolutionsBase);
    } else if (isConcreteScalar(aType)) {
      //arg is ConcreteScalar, type is ConcreteScalar
      const typeName = getScalarName(bType);
      const argName = getScalarName(aType);
      if (typeName === argName) {
        return map(r => ({ type: bType, resolutions: r }))(resolutionsBase);
      }
    } else if (
      a.kind === 'Constraint' &&
      a.in.kind === 'Scalar' &&
      a.of[a.in.name].includes(b.name)
    ) {
      return Right(bType);
    }
  }

  return Left(typeMismatchError(bType, aType));
});

const resolveFunctionType = def('resolveFunctionType')({})([
  HSTypeResolution,
  HSTypeResolution,
  $.Either($.Unknown)(HSTypeResolution)
])(a => b => {
  const aType = a.type;
  const bType = b.type;

  if (aType.kind === 'Function' && getArity(aType) === getArity(bType)) {
    const candidates = zip(map(constraint(aType.constraints))(aType.signature))(
      map(constraint(bType.constraints))(bType.signature)
    );

    const resolvedArgs = reduce(state => ([aArg, bArg]) =>
      chain(([currentResolutions, list]) => {
        const aR = { type: aArg, resolutions: currentResolutions };
        const bR = { type: bArg, resolutions: currentResolutions };
        const resolvedArgument = mapLeft(x => ({ ...x, argIdx: -1 }))(
          resolveType(aR)(bR)
        );
        return map(({ type: arg, resolutions: r }) => [r, [...list, arg]])(
          resolvedArgument
        );
      }, state)
    )(Right([{}, []]))(candidates);

    return map(([resolutions, args]) => ({
      type: substitutePolyScalars(resolutions)(fn(args)),
      resolutions
    }))(resolvedArgs);
  } else if (isPolyScalar(aType)) {
    //TODO: niepełne, a może już pełne, niewiadomo
    return map(
      compose(
        r => ({ type: bType, resolutions: r }),
        tryUpdateResolved(getScalarName(aType))(bType)
      )
    )(safeResolutionsMerge(a.resolutions)(b.resolutions));
  } else if (isConstraint(a)) {
    const [constr, e] = unwrapConstraint(a);
    return resolveType(e, b);
  }

  return Left(typeMismatchError(bType, aType));
});

const wrapMismatchErrorWithArray = e =>
  typeMismatchError(overConstraint(array, e.expected), array(e.given));

const resolveArrayType = def('resolveArrayType')({})([
  HSTypeResolution,
  HSTypeResolution,
  $.Either($.Unknown)(HSTypeResolution)
])(a => b => {
  const aType = a.type;
  const bType = b.type;
  if (aType.kind === 'Array') {
    const res = resolveType({ type: a.type.of, resolutions: a.resolutions })({
      type: b.type.of,
      resolutions: b.resolutions
    });
    return bimap(wrapMismatchErrorWithArray)(({ type, resolutions }) => ({
      type: array(type),
      resolutions
    }))(res);
  }
  return Left(typeMismatchError(bType, aType));
});

const newZip = def('newZip')({})([
  $.Array(a),
  $.Array(a),
  $.Array($.Pair(a)(a))
])(a => b => {
  const normalizedA = concat(a)(
    fromMaybe([])(takeLast(b.length - a.length)(b))
  );
  const normalizedB = concat(b)(
    fromMaybe([])(takeLast(a.length - b.length)(a))
  );
  return zip(normalizedA)(normalizedB);
});

const resolveType = def('resolveType')({})([
  HSTypeResolution,
  HSTypeResolution,
  $.Either($.Unknown)(HSTypeResolution)
])(a => b => {
  if (b.type.kind === 'Scalar') {
    return resolveScalarType(a)(b);
  } else if (b.type.kind === 'Array') {
    return resolveArrayType(a)(b);
  } else if (b.type.kind === 'Function') {
    return resolveFunctionType(a)(b);
  } else if (b.type.kind === 'Constraint') {
    const [constr, e] = unwrapConstraint(b);
    const resolvedInner = resolveType(a, e, resolved, {
      ...constraints,
      ...constr
    });

    return map(x => (constr ? constraint(constr, x) : x), resolvedInner);
  }
  return Left('not implemented yet');
});

const getFnFromArgs = def('getFnFromArgs')({})([
  $.Array(HSTypeResolution),
  $.Either($.Unknown)(HSTypeResolution)
])(args => {
  //TODO: dodac constraints
  //const [constr, signature] = extractContraints(args);
  const signatureResolution = reduce(state => argResolution => {
    return map(({ signature, resolutions }) => ({
      signature: [...signature, argResolution.type],
      resolutions: resolutions
    }))(state);
  })(Right({ signature: [], resolutions: {} }))(args);
  return map(({ signature, resolutions }) => ({
    type: fn(signature),
    resolutions
  }))(signatureResolution);
});

const resolveCall = def('resolveCall')({})([
  $.Array(HSTypeResolution),
  HSTypeResolution,
  $.Either($.Unknown)(HSTypeResolution)
])(args => type => {
  let renamesContext = getNewRenamesContext();

  const rawArgs = getFnFromArgs(args);

  //const [f, renamesContext2] = ;
  const renamedArgs = map(r => normalizePolyNames(r.type)(renamesContext))(
    rawArgs
  );

  const normalizedF = map(r => r[0])(renamedArgs);
  const renamesContext2 = map(r => r[1])(renamedArgs);

  const renamesContext3 = map(resetRenamesScope)(renamesContext2);

  const normalizedType = map(
    compose(
      a => a[0],
      normalizePolyNames(type.type)
    )
  )(renamesContext3);

  const argCount = type.type.signature.length - 1;
  if (args.length > argCount) {
    return Left('Too many arguments');
  }

  const signaturesDiff = getArity(type.type) + 1 - args.length;

  const normalizedLeft = lift2(f => t =>
    fn(
      concat(f.signature)(fromMaybe([])(takeLast(signaturesDiff)(t.signature)))
    )
  )(normalizedF)(normalizedType);

  const resolvedFunction = join(
    lift2(on(resolveType)(typeToTypeResolution))(normalizedLeft)(normalizedType)
  );

  const appliedFunction = map(rf => ({
    type: dropNArgs(args.length)(rf.type),
    resolutions: rf.resolutions
  }))(resolvedFunction);

  const applicationResult = map(x =>
    args.length === argCount
      ? {
          type: unwrapConstraint(x.type)[1].signature[0],
          resolutions: x.resolutions
        }
      : x
  )(appliedFunction);

  return applicationResult;
});

export {
  tryUpdateResolved,
  getResolution,
  safeApplyConstraints,
  resolveScalarType,
  resolveFunctionType,
  resolveArrayType,
  resolveType,
  resolveCall
};
