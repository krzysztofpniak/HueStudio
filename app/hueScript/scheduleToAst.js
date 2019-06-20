import {
  assignNode,
  callNode,
  handlerNode,
  numberNode,
  stringNode
} from './astBuilders';
import actionToAst from './actionToAst';

const scheduleToAst = schedule => {
  return callNode(
    'schedule',
    'Test',
    handlerNode([actionToAst(schedule.command)]),
    stringNode(schedule.localtime)
  );
};

export default scheduleToAst;
