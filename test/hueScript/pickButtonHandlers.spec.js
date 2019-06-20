import pickButtonHandlers from '../../app/hueScript/pickButtonHandlers';
import {
  mcallNode,
  callNode,
  numberNode
} from '../../app/hueScript/astBuilders';

describe('pickButtonHandlers', () => {
  it('should a', () => {
    const [handler, rest] = pickButtonHandlers([
      {
        address: '/sensors/29/state/status',
        operator: 'lt',
        value: '1'
      },
      {
        address: '/sensors/25/state/buttonevent',
        operator: 'eq',
        value: '1002'
      },
      {
        address: '/sensors/25/state/lastupdated',
        operator: 'dx'
      }
    ]);

    expect(handler).toEqual({
      type: 'call',
      name: 'short_release',
      args: [
        {
          type: 'call',
          name: 'button1',
          args: [
            {
              type: 'call',
              name: 'dim',
              args: [{ type: 'literal', value: 25 }]
            }
          ]
        }
      ]
    });

    expect(rest).toEqual([
      {
        address: '/sensors/29/state/status',
        operator: 'lt',
        value: '1'
      }
    ]);
  });
});
