import getNthPolyName from './getNthPolyName';
import {
  getScalarName,
  isPolyTypeName,
  isScalar,
  scalar,
  isArray,
  isFunction,
  isConstraint,
  unwrapConstraint
} from './helpers';
import overArray from './overArray';
import overFunction from './overFunction';
import { curry, fromPairs, toPairs, compose, map } from 'ramda';
import constraint from './constraint';

const mapKeys = curry((it, data) =>
  compose(
    fromPairs,
    map(([key, value]) => [it(key), value]),
    toPairs
  )(data)
);

const getNewRenamesContext = () => ({ renames: {}, start: 0 });

const resetRenamesScope = context => ({ ...context, renames: {} });

const getNameFor = (name, context) => {
  if (!context.renames[name]) {
    context.renames[name] = getNthPolyName(context.start);
    context.start++;
  }
  return context.renames[name];
};

const normalizePolyNames = (type, context = getNewRenamesContext()) => {
  if (isScalar(type)) {
    const name = getScalarName(type);
    if (isPolyTypeName(name)) {
      return scalar(getNameFor(name, context));
    }

    return type;
  } else if (isArray(type)) {
    return overArray(t => normalizePolyNames(t, context), type);
  } else if (isFunction(type)) {
    return overFunction(t => normalizePolyNames(t, context), type);
  } else if (isConstraint(type)) {
    const [constr, inner] = unwrapConstraint(type);

    const normalizedInner = normalizePolyNames(inner, context);

    const normalizedConstr = mapKeys(c => getNameFor(c, context), constr);

    return constraint(normalizedConstr, normalizedInner);
  }

  throw 'not implemented yet';
};

export default normalizePolyNames;

export { getNewRenamesContext, resetRenamesScope };
