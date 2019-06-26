import { chain, keys, map, reduce } from 'ramda';
import pickButtonHandlers from './pickButtonHandlers';
import {
  assignNode,
  callNode,
  handlerNode,
  numberNode,
  stringNode
} from './astBuilders';

const ruleActionsToAst = actions => {
  return chain(action => {
    const [, typeId, id, part1, part2] = action.address.split('/');

    if (typeId === 'groups') {
      return reduce(
        (p, c) => callNode('set', p, callNode(c), stringNode(action.body[c])),
        callNode('group', numberNode(id)),
        keys(action.body)
      );
    }
    if (typeId === 'sensors') {
      return reduce(
        (p, c) => callNode('set', p, callNode(c), stringNode(action.body[c])),
        callNode('sensor', numberNode(id)),
        keys(action.body)
      );
    }
    if (typeId === 'schedules') {
      return reduce(
        (p, c) => callNode('set', p, callNode(c), stringNode(action.body[c])),
        callNode('schedule', numberNode(id)),
        keys(action.body)
      );
    }
  }, actions);
};

const ruleToAst = rule => {
  const [buttonTrigger, rest] = pickButtonHandlers(rule.conditions);

  const actions = ruleActionsToAst(rule.actions);

  return callNode('handle', buttonTrigger, handlerNode(actions));
};

export default ruleToAst;
