import {
  mapAccum,
  filter,
  fromPairs,
  zip,
  head,
  drop,
  path,
  last,
  includes,
  nth,
  uniq,
  equals,
  intersection,
  compose,
  of,
  addIndex,
  pluck,
  always,
  tryCatch,
  objOf,
  cond,
  propEq,
  T,
  type,
  either,
  length,
  find,
  prop,
  evolve,
  append,
  lensIndex,
  set,
  converge,
  tap,
  adjust,
  assoc,
  dissoc
} from 'ramda';
import coreLib from './coreLib/index';
import { resolveCall, resolveType } from './resolveType';
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
  hasNArgs
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
  lift3
} from '../sanctuary';
import getArity from './typeSystem/getArity';
import typeToTypeResolution from './typeSystem/typeToTypeResolution';
import $ from 'sanctuary-def';
import {
  AstNode,
  def,
  HSContext,
  HSType,
  HSTypeResolution,
  HSValue
} from '../sanctuary/types';
import typeMismatchError from './typeSystem/typeMismatchError';

const filterWithKey = addIndex(filter);

const allEquals = compose(
  either(equals(1), equals(0)),
  length,
  uniq
);

const findVar = (name, scopes) => {
  const scope = find(prop(name), scopes);

  return scope ? prop(name, scope) : null;
};

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
        const appliedSignatures = applyLastArg(
          obj,
          unwrapConstraint(prop)[1].signature
        );

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

const translateBlockStatement = ast => context =>
  head(
    mapAccum(
      (result, s) => {
        const processed = astToBridgeStateInt(s)(context);
        if (s.type === 'ReturnStatement' && !result) {
          result = processed;
        }
        return [result, processed];
      },
      null,
      ast.body
    )
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
  //context.vars[context.vars.length - 1][id] = value;
  //context.infos[`${ast.id.loc.start.line}:${ast.id.loc.start.column}`] = {
  //  signature: typeToString(value.type.type)
  //};
  return map(([v, c]) => putContextVar(id)(v)(c))(value);
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
])(ast => context => {
  const calleeCtx = translateExpression(ast.callee)(context);
  const callee = map(([v]) => v)(calleeCtx);
  const ctx1 = map(([v, ctx]) => ctx)(calleeCtx);

  const validatedCallee = chain(c =>
    isCallable(c.type)
      ? Right(c)
      : Left(typeMismatchError(fn([]))(c.type)(Just(ast.callee.location)))
  )(callee);

  const validatedCallee2 = chain(x =>
    canAcceptNArgs(ast.arguments.length, x.type)
      ? Right(x)
      : Left({
          message: 'Too many arguments',
          location: span(drop(getArity(x.type), ast.arguments))
        })
  )(validatedCallee);

  const argsCtx = chain(ctx => reduceArguments(ctx)(ast.arguments))(ctx1);
  const args = map(([ctx, a]) => a)(argsCtx);
  const finalContext = map(([ctx, a]) => ctx)(argsCtx);

  const argsTypes = map(as => map(typeToTypeResolution)(pluck('type', as)))(
    args
  );

  const calleeType = map(v => typeToTypeResolution(v.type))(validatedCallee2);

  const finalType = mapLeft(e =>
    e.argIdx != null
      ? {
          ...dissoc('argIdx', e),
          location: Just(ast.arguments[e.argIdx].location)
        }
      : e
  )(map(t => t.type)(join(lift2(resolveCall)(argsTypes)(calleeType))));

  const argValues = map(pluck('value'))(args);

  const result = lift3(callee => args => resultType => {
    if (hasNArgs(args.length, callee.type)) {
      return { value: callee.value(...args), type: resultType };
    } else {
      return {
        type: resultType,
        value: (...newArgs) => callee.value(...[...args, ...newArgs])
      };
    }
  })(validatedCallee2)(argValues)(finalType);

  return lift2(result => ctx => [result, ctx])(result)(finalContext);
});

const translateIdentifier = def('translateIdentifier')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context => {
  if (coreLib[ast.name]) {
    return Right([coreLib[ast.name], context]);
  } else {
    const varValue = findVar(ast.name, context.vars);
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
  const returnType = inferSignature(ast.body, inferContext);

  const finalType = fn(
    ...[...map(a => inferContext.inferred[a], argNames), returnType]
  );

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
    function: (...args) => {
      const localVars = fromPairs(zip(argNames, args));

      return astToBridgeStateInt(ast.body)(
        evolve({ vars: append(localVars) }, context)
      );
    }
  };
});

const translateArrayExpression = ast => context => {
  const elements = map(e => astToBridgeStateInt(e)(context), ast.elements);
  console.log('ArrayExpression', elements);

  const elementTypes = map(typeToString, uniq(pluck('type', elements)));

  const arrayType =
    elementTypes.length === 0
      ? array(scalar('Void'))
      : elementTypes.length === 1
      ? array(scalar(elementTypes[0]))
      : constraint({ a: elementTypes }, array(scalar('a')));

  return {
    type: arrayType,
    elements
  };
};

const translateExpressionStatement = def('translateExpressionStatement')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)($.Array2(HSValue)(HSContext))
])(ast => context => translateExpression(ast.expression)(context));

const translateMemberExpression = ast => context => {
  const obj = astToBridgeStateInt(ast.object)(context);
  const prop = astToBridgeStateInt(ast.property)(context);
  if (!isFunction(prop.type)) {
    throw { message: `${ast.property.name} is not a function` };
  }
  console.log('MemberExpression', obj, prop);
  return {
    type: dropLastArg(prop.type),
    function: (...newArgs) => prop.function(...[...newArgs, obj])
  };
};
const translateReturnStatement = ast => context =>
  ast.argument ? astToBridgeStateInt(ast.argument)(context) : null;

const translateNext = (ast, context) => {};

const throwMissingTranslation = ast => context => {
  throw `missing translation for ${ast.type}`;
};

const astToBridgeStateInt = def('astToBridgeStateInt')({})([
  AstNode,
  HSContext,
  $.Either($.Unknown)(HSContext)
])(
  cond2([
    [astType('Program'), translateProgram],
    /*[astType('BlockStatement'), translateBlockStatement],
    [astType('VariableDeclaration'), translateVariableDeclaration],
    [astType('VariableDeclarator'), translateVariableDeclarator],
    [astType('FunctionExpression'), translateFunctionExpression],
    [astType('ArrayExpression'), translateArrayExpression],
    [astType('ExpressionStatement'), translateExpressionStatement],
    [astType('MemberExpression'), translateMemberExpression],
    [astType('ReturnStatement'), translateReturnStatement],*/
    [a => b => true, throwMissingTranslation]
  ])
);

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
    [a => b => true, throwMissingTranslation]
  ])
);

const createEmptyContext = def('createEmptyContext')({})([HSContext])(() => ({
  vars: [{}],
  infos: {}
}));

const putContextVar = def('putContextVar')({})([
  $.String,
  HSValue,
  HSContext,
  HSContext
])(name => value => context =>
  evolve({ vars: adjust(-1, assoc(name)(value)) })(context)
);

const createHSContext = createEmptyContext;

const astToBridgeState = (ast, context = createEmptyContext()) =>
  translateProgram(ast)(context);

const showHSContext = def('showHSContext')({})([HSContext, $.String])(context =>
  JSON.stringify(map(x => typeToString(x.type))(context.vars[0]), null, 2)
);

export {
  astToBridgeState,
  showHSContext,
  createEmptyContext,
  createHSContext,
  putContextVar,
  translateCallExpression,
  translateLiteral,
  translateVariableDeclaration
  translateIfStatement,
};
