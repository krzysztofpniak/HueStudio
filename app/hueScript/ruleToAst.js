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
        (p, c) => callNode('set', callNode(c), stringNode(action.body[c]), p),
        callNode('group', numberNode(id)),
        keys(action.body)
      );
    }
    if (typeId === 'sensors') {
      return reduce(
        (p, c) => callNode('set', callNode(c), stringNode(action.body[c]), p),
        callNode('sensor', numberNode(id)),
        keys(action.body)
      );
    }
    if (typeId === 'schedules') {
      return reduce(
        (p, c) => callNode('set', callNode(c), stringNode(action.body[c]), p),
        callNode('schedule', numberNode(id)),
        keys(action.body)
      );
    }
  }, actions);
};

const ruleToAst = rule => {
  const [buttonTrigger, rest] = pickButtonHandlers(rule.conditions);

  const actions = ruleActionsToAst(rule.actions);

  return callNode('handle', handlerNode(actions), buttonTrigger);
};

export default ruleToAst;
