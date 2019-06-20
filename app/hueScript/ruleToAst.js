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
        (p, c) =>
          callNode(
            'set',
            'Group',
            p,
            callNode(c, 'Prop'),
            stringNode(action.body[c])
          ),
        callNode('group', 'Group', numberNode(id)),
        keys(action.body)
      );
    }
    if (typeId === 'sensors') {
      return reduce(
        (p, c) =>
          callNode(
            'set',
            'Sensor',
            p,
            callNode(c, 'Prop'),
            stringNode(action.body[c])
          ),
        callNode('sensor', 'Sensor', numberNode(id)),
        keys(action.body)
      );
    }
    if (typeId === 'schedules') {
      return reduce(
        (p, c) =>
          callNode(
            'set',
            'Schedule',
            p,
            callNode(c, 'Prop'),
            stringNode(action.body[c])
          ),
        callNode('schedule', 'Schedule', numberNode(id)),
        keys(action.body)
      );
    }
  }, actions);
};

const ruleToAst = rule => {
  const [buttonTrigger, rest] = pickButtonHandlers(rule.conditions);

  const actions = ruleActionsToAst(rule.actions);

  return callNode('handle', 'Unknown', buttonTrigger, handlerNode(actions));
};

export default ruleToAst;
