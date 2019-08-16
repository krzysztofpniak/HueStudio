import { toSource } from '../../app/hueScript';
import {
  mcallNode,
  callNode,
  numberNode
} from '../../app/hueScript/astBuilders';

const a = callNode(
  'short_release',
  mcallNode(
    'button1',
    mcallNode('dimmer', numberNode(1), numberNode(2)),
    numberNode(3)
  ),
  numberNode(4)
);

const b = callNode('short_release', mcallNode('button1', mcallNode('dimmer')));

const c = callNode('short_release', callNode('button1', callNode('dimmer')));

const d = callNode(
  'short_release',
  'Light',
  mcallNode('button1', 'Light', callNode('dimmer', numberNode(12)))
);

describe('toSource', () => {
  /*it('should a', () => {
    expect(toSource(a)).toEqual('dimmer(1, 2).button1(3).short_release(4)');
  });*/

  it('should b', () => {
    expect(toSource(b)).toEqual('dimmer.button1.short_release');
  });

  it('should c', () => {
    expect(toSource(c)).toEqual('short_release(button1(dimmer))');
  });

  /*describe('style', () => {
    it('should keep AST style', () => {
      expect(toSource(d, { style: 'keep' })).toEqual(
        'button1(dimmer(12)).short_release'
      );
    });
    it('should force functional style', () => {
      expect(toSource(d, { style: 'functional' })).toEqual(
        'short_release(button1(dimmer(12)))'
      );
    });
    it('should force object style', () => {
      expect(toSource(d, { style: 'object' })).toEqual(
        'dimmer(12).button1.short_release'
      );
    });
    it('should force strict object style', () => {
      expect(toSource(d, { style: 'strictObject' })).toEqual(
        '12.dimmer.button1.short_release'
      );
    });
  });*/
});
