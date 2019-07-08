import { map, cond, identity, T, is } from 'ramda';

const numberNode = value => ({
  type: 'literal',
  name: 'number',
  value: +value
});

const stringNode = value => ({
  type: 'literal',
  name: 'string',
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

const mcallNode = (name, ...args) => ({
  type: 'call',
  mcall: true,
  name,
  args
});

const handlerNode = value => ({
  type: 'handler',
  value
});

const assignNode = (left, right) => ({
  type: 'assign',
  left,
  right
});

export { numberNode, stringNode, callNode, mcallNode, handlerNode, assignNode };
