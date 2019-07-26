import { compose, objOf, tryCatch, map, join } from 'ramda';
import hueParser from '../huejs.peg';
import ruleToAst from './ruleToAst';
import pickButtonHandlers from './pickButtonHandlers';
import decodeEvent from './decodeEvent';

const { parse } = hueParser;

const parseHue = tryCatch(
  compose(
    objOf('data'),
    parse
  ),
  objOf('error')
);

const isMethodCall = (node, style) =>
  style === 'keep'
    ? node.args && node.args.length > 0 && node.args[node.args.length - 1].mcall
    : style === 'object'
    ? node.args &&
      node.args.length > 0 &&
      node.args[node.args.length - 1].type === 'call'
    : style === 'strictObject';

const defaultToSourceOptions = {
  style: 'keep'
};

const toSource = (node, options = defaultToSourceOptions) => {
  if (node.type === 'call') {
    const [member, ...rest] = isMethodCall(node, options.style)
      ? node.args
      : [null, ...node.args];

    const argsPart =
      rest.length > 0
        ? `(${join(', ', map(a => toSource(a, options), rest))})`
        : '';

    const memberPart = member ? `${toSource(member, options)}.` : '';

    return `${memberPart}${node.name}${argsPart}`;
  }

  if (node.type === 'literal' && node.name === 'number') {
    return `${node.value}`;
  }

  if (node.type === 'literal' && node.name === 'string') {
    return `'${node.value}'`;
  }

  if (node.type === 'assign') {
    return `${toSource(node.left, options)}.set(${toSource(
      node.right,
      options
    )})`;
  }

  if (node.type === 'handler') {
    return `() => {${join(
      ' ',
      map(s => `${toSource(s, options)};`, node.value)
    )}}`;
  }

  if (node.type === 'program') {
    return join('', map(s => `${toSource(s, options)};`, node.statements));
  }
};

export { parseHue, toSource, ruleToAst, pickButtonHandlers, decodeEvent };

//sensor(1).lastupdated.change.handle()
//dimmer(2).button1.short_release.handle()
