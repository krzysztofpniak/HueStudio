import { map, cond, identity, T, is } from 'ramda';

const numberNode = value => ({
  type: 'literal',
  name: 'number',
  cls: 'Number',
  value: +value
});

const stringNode = value => ({
  type: 'literal',
  name: 'string',
  cls: 'String',
  value: value
});

const callNode = (name, ...args) => ({
  type: 'call',
  name,
  args: map(
    cond([[is(Number), numberNode], [is(String), stringNode], [T, identity]]),
    args
  )
});

const mcallNode = (name, cls, ...args) => ({
  type: 'mcall',
  name,
  cls,
  args
});

const handlerNode = value => ({
  type: 'handler',
  cls: 'Handler',
  value
});

const assignNode = (left, right) => ({
  type: 'assign',
  cls: 'void',
  left,
  right
});

export { numberNode, stringNode, callNode, mcallNode, handlerNode, assignNode };
