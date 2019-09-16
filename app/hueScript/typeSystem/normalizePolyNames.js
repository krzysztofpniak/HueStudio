import $ from 'sanctuary-def';
import getNthPolyName from './getNthPolyName';
import {
  getScalarName,
  isPolyTypeName,
  isScalar,
  scalar,
  isArray,
  isFunction
} from './helpers';
import {
  curry,
  reduce,
  fromPairs,
  toPairs,
  compose,
  map,
  evolve,
  inc,
  assoc
} from 'ramda';
import constraint from './constraint';
import { array, fn } from './index';
import { HSType, RenamesContext, def } from '../../sanctuary/types';
import { renameKeys } from '../../sanctuary';

const mapKeys = curry((it, data) =>
  compose(
    fromPairs,
    map(([key, value]) => [it(key), value]),
    toPairs
  )(data)
);

const getNewRenamesContext = () => ({ renames: {}, start: 0 });

const resetRenamesScope = context => ({ ...context, renames: {} });

//getNameFor :: String -> RenamesContext -> [String, RenamesContext]
const getNameFor = (name, context) => {
  if (!context.renames[name]) {
    const nextContext = evolve({
      renames: assoc(name, getNthPolyName(context.start)),
      start: inc
    })(context);
    return [nextContext.renames[name], nextContext];
  }
  return [context.renames[name], context];
};

//normalizePolyNames :: HSType -> RenamesContext -> [HSType, RenamesContext]
const normalizePolyNames = def('normalizePolyNames')({})([
  HSType,
  RenamesContext,
  $.Array2(HSType)(RenamesContext)
])(type => context => {
  if (isScalar(type)) {
    const name = getScalarName(type);
    if (isPolyTypeName(name)) {
      const [nextName, nextContext] = getNameFor(name, context);
      return [
        constraint(renameKeys(nextContext.renames)(type.constraints))(
          scalar(nextName)
        ),
        nextContext
      ];
    }

    return [type, context];
  } else if (isArray(type)) {
    const [nextArrayOf, nextContext] = normalizePolyNames(type.of)(context);
    return [array(nextArrayOf), nextContext];
  } else if (isFunction(type)) {
    const [args, nextContext] = reduce(
      ([list, currentContext], currentArg) => {
        const [nextArg, nextArgContext] = normalizePolyNames(currentArg)(
          currentContext
        );
        return [[...list, nextArg], nextArgContext];
      },
      [[], context],
      type.signature
    );
    return [
      constraint(renameKeys(nextContext.renames)(type.constraints))(fn(args)),
      nextContext
    ];
  }

  throw 'not implemented yet';
});

export default normalizePolyNames;

export { getNewRenamesContext, resetRenamesScope };
