import ruleToAst from '../../app/hueScript/ruleToAst';
import {
  numberNode,
  callNode,
  mcallNode,
  handlerNode,
  assignNode
} from '../../app/hueScript/astBuilders';

const rule1 = {
  name: 'Dimmer Switch 25 on0',
  owner: 'YOUR_BRIDGE_USERNAME',
  created: '2019-03-28T16:19:53',
  lasttriggered: '2019-05-31T22:08:22',
  timestriggered: 24,
  status: 'enabled',
  recycle: true,
  conditions: [
    {
      address: '/sensors/26/state/status',
      operator: 'lt',
      value: '1'
    },
    {
      address: '/sensors/25/state/buttonevent',
      operator: 'eq',
      value: '1000'
    },
    {
      address: '/sensors/25/state/lastupdated',
      operator: 'dx'
    }
  ],
  actions: [
    {
      address: '/groups/7/action',
      method: 'PUT',
      body: {
        on: true
      }
    },
    {
      address: '/sensors/26/state',
      method: 'PUT',
      body: {
        status: 1
      }
    }
  ]
};

describe('ruleToAst', () => {
  it('should a', () => {
    expect(ruleToAst(rule1)).toEqual(
      callNode(
        'handle',
        callNode(
          'initial_press',
          callNode(
            'button1',
            callNode('dimmer', 'DimmerSensor', numberNode(25))
          )
        ),
        handlerNode([
          callNode('on', callNode('group', numberNode(7))),
          assignNode(callNode('sensor', numberNode(26)), numberNode(1))
        ])
      )
    );
  });
});
