import coreLib from '../../app/hueScript/coreLib';
import { scalar } from '../../app/hueScript/typeSystem';

const { light, group, on, off, dimmer, button1, initial_press } = coreLib;

describe('astToBridgeState', () => {
  describe('light', () => {
    it('should return light', () => {
      expect(light.function({ value: 12 })).toEqual({
        type: scalar('Light'),
        ref: '/lights/12'
      });
    });
  });
  describe('group', () => {
    it('should return group', () => {
      expect(group.function({ value: 12 })).toEqual({
        type: scalar('Group'),
        ref: '/groups/12'
      });
    });
  });
  describe('on', () => {
    it('should set light state to on=true', () => {
      expect(on.function(light.function({ value: 12 }))).toEqual({
        type: scalar('Light'),
        ref: '/lights/12',
        state: { on: true }
      });
    });
  });
  describe('off', () => {
    it('should set light state to on=false', () => {
      expect(off.function(light.function({ value: 12 }))).toEqual({
        type: scalar('Light'),
        ref: '/lights/12',
        state: { on: false }
      });
    });
  });
  describe('dimmer', () => {
    it('should return dimmer', () => {
      expect(dimmer.function({ value: 12 })).toEqual({
        type: scalar('Dimmer'),
        ref: '/sensors/12'
      });
    });
  });
  describe('buttons', () => {
    it('should return dimmer button', () => {
      expect(button1.function(dimmer.function({ value: 12 }))).toEqual({
        type: scalar('Button'),
        button: 'button1',
        sensor: { type: scalar('Dimmer'), ref: '/sensors/12' }
      });
    });
  });
  describe('initial_press', () => {
    it('should return initial_press event', () => {
      expect(
        initial_press.function(button1.function(dimmer.function({ value: 12 })))
      ).toEqual({
        type: scalar('ButtonEvent'),
        button: 'button1',
        eventCode: 1000,
        sensor: { type: scalar('Dimmer'), ref: '/sensors/12' }
      });
    });
  });
});
