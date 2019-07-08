import { parseHue } from '../../app/hueScript';
import {
  mcallNode,
  callNode,
  numberNode
} from '../../app/hueScript/astBuilders';

const location = (s, e) => ({
  start: { offset: s, line: 1, column: s + 1 },
  end: { offset: e, line: 1, column: e + 1 }
});

describe('parseHue', () => {
  it('should parse simple call', () => {
    expect(parseHue('dimmer(12);')).toEqual({
      data: {
        statements: [
          {
            type: 'call',
            name: 'dimmer',
            args: [
              {
                type: 'literal',
                name: 'number',
                location: location(7, 9),
                value: 12
              }
            ]
          }
        ],
        vars: {}
      }
    });
  });

  it('should parse method call', () => {
    expect(parseHue('light(1).on();')).toEqual({
      data: {
        statements: [
          {
            type: 'call',
            name: 'on',
            args: [
              {
                type: 'call',
                mcall: true,
                name: 'light',
                args: [
                  {
                    type: 'literal',
                    name: 'number',
                    location: location(6, 7),
                    value: 1
                  }
                ]
              }
            ]
          }
        ],
        vars: {}
      }
    });
  });
});
