import {
  light,
  group,
  on,
  off,
  dimmer,
  button1,
  initial_press
} from '../../app/hueScript/astToBridgeState';

describe('astToBridgeState', () => {
  describe('light', () => {
    it('should return light', () => {
      expect(light(12)).toEqual({ type: 'Light', ref: '/lights/12' });
    });
  });
  describe('group', () => {
    it('should return group', () => {
      expect(group(12)).toEqual({ type: 'Group', ref: '/groups/12' });
    });
  });
  describe('on', () => {
    it('should set light state to on=true', () => {
      expect(on(light(12))).toEqual({
        type: 'Light',
        ref: '/lights/12',
        state: { on: true }
      });
    });
  });
  describe('off', () => {
    it('should set light state to on=false', () => {
      expect(off(light(12))).toEqual({
        type: 'Light',
        ref: '/lights/12',
        state: { on: false }
      });
    });
  });
  describe('dimmer', () => {
    it('should return dimmer', () => {
      expect(dimmer(12)).toEqual({
        type: 'Dimmer',
        ref: '/sensors/12'
      });
    });
  });
  describe('buttons', () => {
    it('should return dimmer button', () => {
      expect(button1(dimmer(12))).toEqual({
        type: 'Button',
        button: 'button1',
        sensor: { type: 'Dimmer', ref: '/sensors/12' }
      });
    });
  });
  describe('initial_press', () => {
    it('should return initial_press event', () => {
      expect(initial_press(button1(dimmer(12)))).toEqual({
        type: 'ButtonEvent',
        button: 'button1',
        eventCode: 1000,
        sensor: { type: 'Dimmer', ref: '/sensors/12' }
      });
    });
  });
});
