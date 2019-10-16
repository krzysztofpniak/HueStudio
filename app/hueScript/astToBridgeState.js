import {
  map as Rmap,
  mapAccum,
  filter,
  fromPairs,
  zip,
  head,
  drop,
  path,
  last,
  uniq,
  equals,
  compose,
  addIndex,
  pluck,
  propEq,
  type,
  either,
  length,
  prop,
  evolve,
  append,
  lensIndex,
  set,
  converge,
  adjust,
  assoc,
  dissoc,
  init
} from 'ramda';
import coreLib from './coreLib/index';
import { resolveCall, resolveMember, resolveType } from './resolveType';
import {
  fn,
  typeToString,
  array,
  scalar,
  dropLastArg,
  isFunction,
  constraint,
  isCallable,
  canAcceptNArgs,
  hasNArgs,
  getScalarName,
  isScalar,
  typedValue
} from './typeSystem';
import {
  cond2,
  fromEither,
  isRight,
  Left,
  mapLeft,
  Right,
  reduce,
  chain,
  lift2,
  join,
  sequence,
  lift3,
  pipeK,
  map,
  Just,
  on,
  all,
  Nothing,
  find,
  maybeToNullable,
  complement,
  maybe,
  hasKey,
  findIndex,
  concat,
  flip,
  lift4,
  pipe
} from '../sanctuary';
import getArity from './typeSystem/getArity';
import typeToTypeResolution from './typeSystem/typeToTypeResolution';
import $ from 'sanctuary-def';
import {
  AstNode,
  def,
  HSContext,
  HSEffect,
  HSError,
  HSType,
  HSTypeResolution,
  HSValue,
  HueBridgeState
} from '../sanctuary/types';
import typeMismatchError from './typeSystem/typeMismatchError';
import { hsResult } from './typeSystem/helpers';

const filterWithKey = addIndex(filter);

const allEquals = compose(
  either(equals(1), equals(0)),
  length,
  uniq
);

const findVar = def('findVar')({})([$.String, HSContext, $.Maybe($.Unknown)])(
  name => context => {
    return map(prop(name))(find(hasKey(name))(context.vars));
  }
);

const astToLocIndex = ast =>
  `${ast.location.start.line}:${ast.location.start.column}`;

const applyLastArg = set(lensIndex(-2));

const inferSignature = (ast, context) => {
  console.group('infer', ast.type);
  try {
    if (ast.type === 'BlockStatement') {
      const lastExpression = last(
        map(a => inferSignature(a, context), ast.body)
      );
      console.log('Infer BlockStatement', lastExpression);
      return lastExpression;
    } else if (ast.type === 'ReturnStatement') {
      return ast.argument ? inferSignature(ast.argument, context) : null;
    } else if (ast.type === 'CallExpression') {
      const callee = inferSignature(ast.callee, context);
      const args = map(a => inferSignature(a, context), ast.arguments);
      const resolvedType = resolveCall(args)(callee);
      console.log('infer CallExpression', callee, args, resolvedType);

      return resolvedType;
    } else if (ast.type === 'MemberExpression') {
      const obj = inferSignature(ast.object, context);
      const prop = inferSignature(ast.property, context);
      if (isFunction(prop)) {
        console.log('infer MemberExpression', obj, ast.property.name, prop);
        const appliedSignatures = applyLastArg(obj, prop.signature);

        return dropLastArg(
          resolveType(fn(...appliedSignatures), prop, context.inferred)
        );
      }
      console.error('not implemented yet');
      throw 'not implemented yet 1';
    } else if (ast.type === 'Identifier') {
      if (coreLib[ast.name]) {
        return coreLib[ast.name].type;
      } else {
        const varValue = findVar(ast.name, context.vars);
        if (varValue) {
          return varValue.type;
        }
      }
      throw {
        name: 'UnknownIdentifierError',
        message: `Unknown identifier: ${ast.name}`,
        location: ast.location
      };
    } else if (ast.type === 'Literal') {
      return scalar(type(ast.value));
    } else if (ast.type === 'ExpressionStatement') {
      return inferSignature(ast.expression, context);
    }
    throw `missing infer case ${ast.type}`;
  } finally {
    console.log('Context', context);
    console.groupEnd();
  }
};

const astType = value => ast => context => propEq('type', value, ast);

const translateProgram = def('translateProgram')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)(HSContext)
])(ast => context =>
  reduce(p => c => chain(translateStatement(c))(p))(Right(context))(ast.body)
);

const translateVariableDeclaration = def('translateVariableDeclaration')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)(HSContext)
])(ast => context =>
  reduce(p => c => chain(translateVariableDeclarator(c))(p))(Right(context))(
    ast.declarations
  )
);

const translateVariableDeclarator = def('translateVariableDeclarator')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)(HSContext)
])(ast => context => {
  const id = ast.id.name;
  const value = translateExpression(ast.init)(context);
  const validatedValue = maybe(value)(() =>
    Left({
      name: 'AlreadyDeclared',
      message: 'Variable has been already declared',
      location: Just(ast.id.location)
    })
  )(findVar(id)(context));

  return map(([v, c]) =>
    pipe([
      putContextInfo(astToLocIndex(ast.id))({
        signature: typeToString(v.type)
      }),
      putContextVar(id)(v)
    ])(c)
  )(validatedValue);
});

const span = converge((start, end) => ({ start, end }), [
  compose(
    path(['location', 'start']),
    head
  ),
  compose(
    path(['location', 'end']),
    last
  )
]);

const a = $.TypeVariable('a');
const b = $.TypeVariable('b');

const reduceArguments = def('reduceArguments')({})([
  HSContext,
  $.Array(AstNode),
  $.Either($.Unknown)($.Array2(HSContext)($.Array(HSValue)))
])(context => args =>
  reduce(state => arg =>
    chain(([ctx, list]) => {
      const exp = translateExpression(arg)(ctx);
      return map(([e, c]) => [c, [...list, e]])(exp);
    })(state)
  )(Right([context, []]))(args)
);

const translateCallExpression = def('translateCallExpression')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context =>
  pipeK([
    ({ ast, context }) =>
      map(([callee, context]) => ({ ast, context, callee }))(
        translateExpression(ast.callee)(context)
      ),
    ({ ast, context, callee }) =>
      isCallable(callee.type)
        ? Right({ ast, context, callee })
        : Left(
            typeMismatchError(fn([]))(callee.type)(
              ast.callee.location ? Just(ast.callee.location) : Nothing
            )
          ),
    ({ ast, context, callee }) =>
      canAcceptNArgs(ast.arguments.length, callee.type)
        ? Right({ ast, context, callee })
        : Left({
            message: 'Too many arguments',
            location: span(drop(getArity(callee.type), ast.arguments))
          }),
    ({ ast, context, callee }) =>
      map(([context, args]) => ({ ast, context, callee, args }))(
        reduceArguments(context)(ast.arguments)
      ),
    ({ ast, context, callee, args }) =>
      map(typeResolution => ({
        ast,
        context,
        callee,
        args,
        resultType: typeResolution.type
      }))(
        mapLeft(e =>
          e.argIdx != null && e.argIdx < ast.arguments.length
            ? {
                ...dissoc('argIdx', e),
                location: Just(ast.arguments[e.argIdx].location)
              }
            : {
                name: 'TypeMismatchError',
                message: 'żle',
                location: Just(ast.callee.location)
              }
        )(resolveCall(pluck('type', args))(callee.type))
      ),
    ({ ast, context, callee, args, resultType }) => {
      if (hasNArgs(args.length, callee.type)) {
        const { result, effects } = callee.value.fn(...args);

        return maybe(
          Right([
            { value: result.value, type: resultType },
            putContextEffects(effects)(context)
          ])
        )(e => Left({ ...e, location: ast.arguments[e.argIdx].location }))(
          callee.value.guard(args)(context)
        );
      } else {
        return Right([
          {
            type: resultType,
            value: {
              fn: (...newArgs) => callee.value.fn(...[...args, ...newArgs]),
              guard: newArgs => ctx =>
                callee.value.guard([...args, ...newArgs])(ctx)
            }
          },
          context
        ]);
      }
    }
  ])(Right({ ast, context }))
);

const translateIdentifier = def('translateIdentifier')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context => {
  if (coreLib[ast.name]) {
    return Right([coreLib[ast.name], context]);
  } else {
    const varValue = maybeToNullable(findVar(ast.name)(context));
    if (varValue) {
      return Right([varValue, context]);
    }
  }
  return Left({
    message: `Unknown identifier ${ast.name}`,
    location: ast.location
  });
});

const translateLiteral = def('translateLiteral')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context =>
  Right([
    {
      type: scalar(type(ast.value)),
      value: ast.value
    },
    context
  ])
);

const translateFunctionExpression = def('translateLiteral')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context => {
  const argNames = pluck('name', ast.params);
  console.log('FunctionExpression', argNames, ast);
  const inferContext = { ...context, inferred: {} };

  return Right([
    {
      type: fn([scalar('Void')]),
      value: { fn: () => {}, guard: () => () => Nothing }
    },
    context
  ]);
  /*
  const returnType = inferSignature(ast.body, inferContext);

  const finalType = fn([
    ...map(a => inferContext.inferred[a], argNames),
    returnType
  ]);

  for (let i = 0; i < ast.params.length; i++) {
    const astParam = ast.params[i];
    const loc = astToLocIndex(astParam);
    context.infos[loc] = {
      signature: typeToString(inferContext.inferred[astParam.name])
    };
  }

  console.log('Final result', typeToString(finalType));

  return {
    type: finalType,
    value: (...args) => {
      const localVars = fromPairs(zip(argNames, args));

      return astToBridgeStateInt(ast.body)(
        evolve({ vars: append(localVars) }, context)
      );
    }
  };*/
});

const validateArrayElements = def('validateArrayElements')({})([
  $.Array(HSValue),
  $.Either(HSError)($.Array(HSValue))
])(elements => {
  const wrongElementIdx = findIndex(
    complement(
      compose(
        isScalar,
        prop('type')
      )
    )
  )(elements);
  return maybe(Right(elements))(idx =>
    Left({
      name: 'TypeMismatch',
      message: `All array elements must be Scalar values ${idx}`,
      argIdx: idx
    })
  )(wrongElementIdx);
});

const translateArrayExpression = def('translateArrayExpression')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context => {
  const elementsCtx = reduceArguments(context)(ast.elements);
  const finalCtx = map(([ctx]) => ctx)(elementsCtx);
  const elements = map(([_, e]) => e)(elementsCtx);

  const validatedElements = mapLeft(e =>
    e.argIdx != null
      ? typeMismatchError(scalar('a'))(scalar('Number'))(
          Just(ast.elements[e.argIdx].location)
        )
      : e
  )(chain(validateArrayElements)(elements));

  const elementTypes = map(
    compose(
      map(getScalarName),
      uniq,
      pluck('type')
    )
  )(validatedElements);

  const arrayType = map(e =>
    e.length === 0
      ? array(scalar('Void'))
      : e.length === 1
      ? array(scalar(e[0]))
      : constraint({ a: e })(array(scalar('a')))
  )(elementTypes);

  const expressionValue = lift2(type => value => ({ type, value }))(arrayType)(
    validatedElements
  );

  return lift2(v => c => [v, c])(expressionValue)(finalCtx);
});

const translateExpressionStatement = def('translateExpressionStatement')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)(HSContext)
])(ast => context =>
  map(([v, ctx]) => ctx)(translateExpression(ast.expression)(context))
);

const translateBlockStatement = def('translateBlockStatement')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)(HSContext)
])(ast => context =>
  reduce(c => s => chain(translateStatement(s))(c))(Right(context))(ast.body)
);

const translateMemberExpression = def('translateMemberExpression')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context =>
  pipeK([
    ({ ast, context }) =>
      map(([obj, context]) => ({ ast, context, obj }))(
        translateExpression(ast.object)(context)
      ),
    ({ ast, context, obj }) =>
      map(([prop, context]) => ({ ast, context, obj, prop }))(
        translateExpression(ast.property)(context)
      ),
    ({ ast, context, obj, prop }) =>
      map(finalType => ({ ast, context, obj, prop, finalType }))(
        on(resolveMember)(a => typeToTypeResolution(a.type))(obj)(prop)
      ),
    ({ ast, context, obj, prop, finalType }) =>
      isFunction(finalType.type)
        ? Right({ ast, context, obj, prop, finalType })
        : maybe(Right({ ast, context, obj, prop, finalType }))(e =>
            Left({ ...e, location: ast.object.location })
          )(prop.value.guard([obj])(context)),
    ({ ast, context, obj, prop, finalType }) => {
      if (isFunction(finalType.type)) {
        return Right([
          typedValue(finalType.type)({
            fn: (...newArgs) => prop.value.fn(...[...newArgs, obj]),
            guard: newArgs => ctx => prop.value.guard([...newArgs, obj])(ctx)
          }),
          context
        ]);
      } else {
        const { result, effects } = prop.value.fn(obj);
        return Right([result, putContextEffects(effects)(context)]);
      }
    }
  ])(Right({ ast, context }))
);

const translateReturnStatement = ast => context =>
  ast.argument
    ? map(([v, context]) => putContextVar('return')(v)(context))(
        translateExpression(ast.argument)(context)
      )
    : Right(context);

const translateNext = (ast, context) => {};

const throwMissingTranslation = ast => context =>
  Left(`missing translation for ${ast.type}`);

const translateConditionalExpression = def('translateConditionalExpression')(
  {}
)([AstNode, HSContext, $.Either($.Unknown)($.Array2(HSValue)(HSContext))])(
  ast => context => {
    const testCtx = translateExpression(ast.test)(context);

    const validatedTestCtx = chain(([t, ctx]) =>
      isScalar(t.type) && getScalarName(t.type) === 'Boolean'
        ? Right([t, ctx])
        : Left(
            typeMismatchError(scalar('Boolean'))(t.type)(
              Just(ast.test.location)
            )
          )
    )(testCtx);

    const resultCtx = chain(([v, ctx]) =>
      translateExpression(v.value ? ast.consequent : ast.alternate)(ctx)
    )(validatedTestCtx);

    return resultCtx;
  }
);

const translatePipeExpression = def('translatePipeExpression')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context =>
  pipeK([
    ({ ast, context }) =>
      map(([left, context]) => ({ ast, context, left }))(
        translateExpression(ast.left)(context)
      ),
    ({ ast, context, left }) =>
      map(([right, context]) => ({ ast, context, left, right }))(
        translateExpression(ast.right)(context)
      ),
    ({ ast, context, left, right }) => {
      console.log(ast, left, right, getArity(left.type));
      if (left.type.kind !== 'Function') {
        return Left({
          name: 'WrongType',
          message: 'Left hand operand is not a function',
          location: Just(ast.left.location)
        });
      } else if (right.type.kind !== 'Function') {
        return Left({
          name: 'WrongType',
          message: 'Right hand operand is not a function',
          location: Just(ast.right.location)
        });
      } else if (getArity(right.type) !== 1) {
        return Left({
          name: 'WrongArity',
          message: 'Arity must be 1',
          location: Just(ast.right.location)
        });
      } /*else if (last(left.type.signature) !== head(right.type.signature)) {
        return Left({
          name: 'FunctionNotMatch',
          message: "Right function signature doesn't match",
          location: Just(ast.right.location)
        });
      }*/
      const finalType = constraint({
        ...left.type.constraints,
        ...right.type.constraints
      })(fn([...init(left.type.signature), last(right.type.signature)]));
      return Right([
        {
          type: finalType,
          value: {
            fn: (...args) => {
              const firstResult = left.value.fn(...args);
              const secondResult = right.value.fn(firstResult.result);
              return {
                result: secondResult.result,
                effects: [...firstResult.effects, ...secondResult.effects]
              };
            },
            guard: () => () => Nothing
          }
        },
        context
      ]);
    }
  ])(Right({ ast, context }))
);

const translateComposeExpression = def('translateComposeExpression')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context =>
  pipeK([
    ({ ast, context }) =>
      map(([left, context]) => ({ ast, context, left }))(
        translateExpression(ast.left)(context)
      ),
    ({ ast, context, left }) =>
      map(([right, context]) => ({ ast, context, left, right }))(
        translateExpression(ast.right)(context)
      ),
    ({ ast, context, left, right }) => {
      if (left.type.kind !== 'Function') {
        return Left({
          name: 'WrongType',
          message: 'Left hand operand is not a function',
          location: Just(ast.left.location)
        });
      } else if (right.type.kind !== 'Function') {
        return Left({
          name: 'WrongType',
          message: 'Right hand operand is not a function',
          location: Just(ast.right.location)
        });
      } else if (getArity(left.type) !== 1) {
        return Left({
          name: 'WrongArity',
          message: 'Arity must be 1',
          location: Just(ast.left.location)
        });
      } /*else if (last(left.type.signature) !== head(right.type.signature)) {
        return Left({
          name: 'FunctionNotMatch',
          message: "Right function signature doesn't match",
          location: Just(ast.right.location)
        });
      }*/
      const finalType = constraint({
        ...left.type.constraints,
        ...right.type.constraints
      })(fn([...init(right.type.signature), last(left.type.signature)]));
      return Right([
        {
          type: finalType,
          value: {
            fn: (...args) => {
              const firstResult = right.value.fn(...args);
              const secondResult = left.value.fn(firstResult.result);
              return {
                result: secondResult.result,
                effects: [...firstResult.effects, ...secondResult.effects]
              };
            },
            guard: () => () => Nothing
          }
        },
        context
      ]);
    }
  ])(Right({ ast, context }))
);

const translateBinaryExpression = def('translateBinaryExpression')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context => {
  if (ast.operator === '>>') {
    return translatePipeExpression(ast)(context);
  } else if (ast.operator === '<<') {
    return translateComposeExpression(ast)(context);
  } else {
    return Left({
      name: 'NotImplemented',
      message: 'Not implemented yet',
      location: ast.location
    });
  }
});
/*const leftCtx = translateExpression(ast.left)(context);
  const rightCtx = translateExpression(ast.right)(context);

  console.log(leftCtx, rightCtx);


  return Right([{ type: scalar('Boolean'), value: true }, context]);
});*/

const translateIfStatement = def('translateIfStatement')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)(HSContext)
])(ast => context => {
  const a = ast;
  const testCtx = translateExpression(ast.test)(context);

  const validatedTestCtx = chain(([t, ctx]) =>
    isScalar(t.type) && getScalarName(t.type) === 'Boolean'
      ? Right([t, ctx])
      : Left(
          typeMismatchError(scalar('Boolean'))(t.type)(Just(ast.test.location))
        )
  )(testCtx);

  const resultCtx = chain(([v, ctx]) =>
    translateStatement(v.value ? ast.consequent : ast.alternate)(ctx)
  )(validatedTestCtx);

  return resultCtx;
});

const translateStatement = def('translateStatement')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)(HSContext)
])(
  cond2([
    [astType('VariableDeclaration'), translateVariableDeclaration],
    [astType('IfStatement'), translateIfStatement],
    [astType('ExpressionStatement'), translateExpressionStatement],
    [astType('BlockStatement'), translateBlockStatement],
    [astType('ReturnStatement'), translateReturnStatement],
    [a => b => true, throwMissingTranslation]
  ])
);

const translateExpression = def('translateExpression')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(
  cond2([
    [astType('Literal'), translateLiteral],
    [astType('Identifier'), translateIdentifier],
    [astType('CallExpression'), translateCallExpression],
    [astType('MemberExpression'), translateMemberExpression],
    [astType('ArrayExpression'), translateArrayExpression],
    [astType('ConditionalExpression'), translateConditionalExpression],
    [astType('BinaryExpression'), translateBinaryExpression],
    [astType('FunctionExpression'), translateFunctionExpression],
    [a => b => true, throwMissingTranslation]
  ])
);

const createEmptyContext = def('createEmptyContext')({})([
  HueBridgeState,
  HSContext
])(bridgeState => ({
  vars: [{}],
  infos: {},
  effects: [],
  bridgeState
}));

const putContextVar = def('putContextVar')({})([
  $.String,
  HSValue,
  HSContext,
  HSContext
])(name => value => context =>
  evolve({ vars: adjust(-1, assoc(name)(value)) })(context)
);

const putContextInfo = def('putContextInfo')({})([
  $.String,
  $.Unknown,
  HSContext,
  HSContext
])(loc => value => context => evolve({ infos: assoc(loc)(value) })(context));

const putContextEffects = def('putContextEffects')({})([
  $.Array(HSEffect),
  HSContext,
  HSContext
])(effect => context => evolve({ effects: flip(concat)(effect) })(context));

const clearContextEffects = def('clearContextEffects')({})([
  HSContext,
  HSContext
])(context => assoc('effects')([])(context));

const putContextBridgeState = def('putContextBridgeState')({})([
  HueBridgeState,
  HSContext,
  HSContext
])(bridgeState => context => assoc('bridgeState')(bridgeState)(context));

const createHSContext = createEmptyContext;

const showHSContext = def('showHSContext')({})([HSContext, $.String])(context =>
  JSON.stringify(
    {
      vars: map(x => typeToString(x.type))(context.vars[0]),
      effects: context.effects
    },
    null,
    2
  )
);

export {
  translateProgram,
  showHSContext,
  createEmptyContext,
  createHSContext,
  putContextVar,
  putContextInfo,
  astToLocIndex,
  putContextEffects,
  clearContextEffects,
  putContextBridgeState,
  translateCallExpression,
  translateMemberExpression,
  translateLiteral,
  translateVariableDeclaration,
  translateArrayExpression,
  translateConditionalExpression,
  translateBinaryExpression,
  translateIfStatement,
  translateBlockStatement
};
