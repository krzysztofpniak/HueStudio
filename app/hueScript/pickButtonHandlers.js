import { endsWith, filter, find, propEq, startsWith } from 'ramda';
import { callNode, numberNode, stringNode } from './astBuilders';
import decodeEvent from './decodeEvent';

const pickButtonHandlers = conditions => {
  const buttonEvent = find(
    c => endsWith('/state/buttonevent', c.address),
    conditions
  );

  if (buttonEvent) {
    const [, typeId, id] = buttonEvent.address.split('/');
    const rest = filter(
      c => !startsWith(`/${typeId}/${id}`, c.address),
      conditions
    );

    const [buttonId, eventName] = decodeEvent(buttonEvent.value);

    return [
      callNode(
        eventName,
        'ButtonEvent',
        callNode(
          buttonId,
          'EventSource',
          callNode('dimmer', 'DimmerSensor', numberNode(+id))
        )
      ),
      rest
    ];
  }

  const dxCondition = find(propEq('operator', 'dx'), conditions);

  if (dxCondition) {
    const [, typeId, id, , prop] = dxCondition.address.split('/');
    const rest = filter(
      c => !startsWith(`/${typeId}/${id}`, c.address),
      conditions
    );

    return [
      callNode(
        'change',
        'StateChangeEvent',
        callNode(
          prop,
          'EventSource',
          callNode('sensor', 'Sensor', numberNode(+id))
        )
      ),
      rest
    ];
  }

  const ddxCondition = find(propEq('operator', 'ddx'), conditions);

  if (ddxCondition) {
    const [, typeId, id, , prop] = ddxCondition.address.split('/');
    const rest = filter(
      c => !startsWith(`/${typeId}/${id}`, c.address),
      conditions
    );

    return [
      callNode(
        'delayedChange',
        'StateChangeEvent',
        callNode(
          prop,
          'EventSource',
          callNode('sensor', 'Sensor', numberNode(+id))
        ),
        stringNode(ddxCondition.value)
      ),
      rest
    ];
  }

  return [callNode('watchTruth', 'StateChangeEvent'), []];

  throw { message: 'strange rule' };
};

export default pickButtonHandlers;
