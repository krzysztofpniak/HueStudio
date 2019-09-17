import coreLib from '../../app/hueScript/coreLib';
import { scalar } from '../../app/hueScript/typeSystem';

const { light, group, on, off, dimmer, button1, initial_press } = coreLib;

describe('astToBridgeState', () => {
  describe('light', () => {
    it('should return light', () => {
      expect(light.value({ value: 12 })).toEqual({
        result: {
          type: scalar('Light'),
          value: '/lights/12'
        },
        effects: []
      });
    });
  });
  describe('group', () => {
    it('should return group', () => {
      expect(group.value({ value: 12 })).toEqual({
        result: {
          type: scalar('Group'),
          value: '/groups/12'
        },
        effects: []
      });
    });
  });
  describe('on', () => {
    it('should set light state to on=true', () => {
      expect(on.value(light.value({ value: 12 }).result)).toEqual({
        result: {
          type: scalar('Light'),
          value: '/lights/12'
        },
        effects: [
          {
            name: 'on',
            params: { target: { type: scalar('Light'), value: '/lights/12' } }
          }
        ]
      });
    });
  });
  describe('off', () => {
    it('should set light state to on=false', () => {
      expect(off.value(light.value({ value: 12 }).result)).toEqual({
        result: {
          type: scalar('Light'),
          value: '/lights/12'
        },
        effects: [
          {
            name: 'off',
            params: { target: { type: scalar('Light'), value: '/lights/12' } }
          }
        ]
      });
    });
  });
  describe('dimmer', () => {
    it('should return dimmer', () => {
      expect(dimmer.value({ value: 12 })).toEqual({
        result: {
          type: scalar('Dimmer'),
          value: '/sensors/12'
        },
        effects: []
      });
    });
  });
  describe('buttons', () => {
    it('should return dimmer button', () => {
      expect(button1.value(dimmer.value({ value: 12 }).result)).toEqual({
        result: {
          type: scalar('Button'),
          value: {
            button: 'button1',
            sensor: { type: scalar('Dimmer'), value: '/sensors/12' }
          }
        },
        effects: []
      });
    });
  });
  describe('initial_press', () => {
    it('should return initial_press event', () => {
      expect(
        initial_press.value(
          button1.value(dimmer.value({ value: 12 }).result).result
        )
      ).toEqual({
        result: {
          type: scalar('ButtonEvent'),
          value: {
            button: 'button1',
            eventCode: 1000,
            sensor: { type: scalar('Dimmer'), value: '/sensors/12' }
          }
        },
        effects: []
      });
    });
  });
});
