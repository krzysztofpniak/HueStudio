import { keys, reduce } from 'ramda';
import { callNode, numberNode, stringNode } from './astBuilders';

const types = {
  groups: 'Group',
  schedules: 'Schedule',
  sensors: 'Sensor'
};

const names = {
  groups: 'group',
  schedules: 'schedule',
  sensors: 'sensor'
};

const actionToAst = action => {
  const [, typeId, id, part1, part2] = action.address.split('/');

  const type = types[typeId];
  const name = names[typeId];

  return reduce(
    (p, c) =>
      callNode('set', type, p, callNode(c, 'Prop'), stringNode(action.body[c])),
    callNode(name, type, numberNode(id)),
    keys(action.body)
  );
};

export default actionToAst;
