import {
  join,
  map,
  mapAccum,
  filter,
  fromPairs,
  zip,
  head,
  drop,
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
  set
} from 'ramda';
import coreLib from './coreLib/index';
import { resolveCall, resolveType } from './resolveType';
import {
  fn,
  typeToString,
  array,
  scalar,
  dropNArgs,
  dropLastArg,
  isFunction,
  canAcceptNArgs,
  hasNArgs,
  validateCallArgs,
  unwrapConstraint
} from './typeSystem';
import constraint from './typeSystem/constraint';

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
      const resolvedType = resolveCall(args, callee, context.inferred);
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
      return scalar(ast.name);
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

const astType = propEq('type');

const translateProgram = (ast, context) =>
  map(a => astToBridgeStateInt(a, context), ast.body);

const translateBlockStatement = (ast, context) =>
  head(
    mapAccum(
      (result, s) => {
        const processed = astToBridgeStateInt(s, context);
        if (s.type === 'ReturnStatement' && !result) {
          result = processed;
        }
        return [result, processed];
      },
      null,
      ast.body
    )
  );

const translateVariableDeclaration = (ast, context) =>
  map(a => astToBridgeStateInt(a, context), ast.declarations);

const translateVariableDeclarator = (ast, context) => {
  const id = ast.id.name;
  const value = astToBridgeStateInt(ast.init, context);
  console.log('VariableDeclarator', id, value);
  context.vars[context.vars.length - 1][id] = value;
  context.infos[
    `${ast.id.location.start.line}:${ast.id.location.start.column}`
  ] = { signature: typeToString(value.type) };
  return value;
};

const translateCallExpression = (ast, context) => {
  const callee = astToBridgeStateInt(ast.callee, context);
  const args = map(a => astToBridgeStateInt(a, context), ast.arguments);
  console.log('CallExpression', callee, args);

  if (!isFunction(callee.type)) {
    throw {
      message: 'callee is not a function',
      location: ast.callee.location
    };
  }

  if (!canAcceptNArgs(args.length, callee.type)) {
    throw { message: 'Too many arguments' };
  }

  const wrongArg = validateCallArgs(args, callee.type);

  if (wrongArg !== null) {
    throw {
      message: `Wrong argument type, expected: ${typeToString(
        unwrapConstraint(callee.type)[1].signature[wrongArg]
      )}, ${typeToString(args[wrongArg].type)} given`,
      location: ast.arguments[wrongArg].location
    };
  }

  if (hasNArgs(args.length, callee.type)) {
    return callee.function(...args);
  } else {
    return {
      type: dropNArgs(args.length, callee.type),
      function: (...newArgs) => callee.function(...[...args, ...newArgs])
    };
  }
};

const translateIdentifier = (ast, context) => {
  if (coreLib[ast.name]) {
    return coreLib[ast.name];
  } else {
    const varValue = findVar(ast.name, context.vars);
    if (varValue) {
      return varValue;
    }
  }
  throw { message: `Unknown identifier ${ast.name}`, location: ast.location };
};

const translateLiteral = ast => ({
  type: scalar(type(ast.value)),
  value: ast.value
});

const translateFunctionExpression = (ast, context) => {
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

      return astToBridgeStateInt(
        ast.body,
        evolve({ vars: append(localVars) }, context)
      );
    }
  };
};

const translateArrayExpression = (ast, context) => {
  const elements = map(e => astToBridgeStateInt(e, context), ast.elements);
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

const translateExpressionStatement = (ast, context) =>
  astToBridgeStateInt(ast.expression, context);

const translateMemberExpression = (ast, context) => {
  const obj = astToBridgeStateInt(ast.object, context);
  const prop = astToBridgeStateInt(ast.property, context);
  if (prop.type.kind !== 'Function') {
    throw { message: `${ast.property.name} is not a function` };
  }
  console.log('MemberExpression', obj, prop);
  return {
    type: dropLastArg(prop.type),
    function: (...newArgs) => prop.function(...[...newArgs, obj])
  };
};
const translateReturnStatement = (ast, context) =>
  ast.argument ? astToBridgeStateInt(ast.argument, context) : null;

const translateNext = (ast, context) => {};

const throwMissingTranslation = ast => {
  throw `missing translation for ${ast.type}`;
};

const astToBridgeStateInt = cond([
  [astType('Program'), translateProgram],
  [astType('BlockStatement'), translateBlockStatement],
  [astType('VariableDeclaration'), translateVariableDeclaration],
  [astType('VariableDeclarator'), translateVariableDeclarator],
  [astType('CallExpression'), translateCallExpression],
  [astType('Identifier'), translateIdentifier],
  [astType('Literal'), translateLiteral],
  [astType('FunctionExpression'), translateFunctionExpression],
  [astType('ArrayExpression'), translateArrayExpression],
  [astType('ExpressionStatement'), translateExpressionStatement],
  [astType('MemberExpression'), translateMemberExpression],
  [astType('ReturnStatement'), translateReturnStatement],
  [T, throwMissingTranslation]
]);

const createEmptyContext = () => ({ vars: [{}], infos: {} });

const astToBridgeState = (ast, context = createEmptyContext()) =>
  tryCatch(astToBridgeStateInt, objOf('error'))(ast, context);

export { astToBridgeState, createEmptyContext };
