import { array, scalar, fn, constraint, overConstraint } from '../typeSystem';
import { map, pathOr, pluck } from 'ramda';

const createFunction = (signature, fn) => ({
  type: signature,
  value: fn
});

/**
 * @example
 *  light(1); // => {type: 'Light', ref: '/lights/1'}
 */
const delay = createFunction(fn([scalar('Number'), scalar('Void')]), ms =>
  hsResult(scalar('Void'))(null)([{ name: 'delay', params: { ms: ms.value } }])
);

const light = createFunction(fn([scalar('Number'), scalar('Light')]), id => ({
  result: {
    type: scalar('Light'),
    value: `/lights/${id.value}`
  },
  effects: []
}));

/**
 * @example
 *  group(1); // => {type: 'Group', ref: '/groups/1'}
 */
const group = createFunction(fn([scalar('Number'), scalar('Group')]), id => ({
  result: {
    type: scalar('Group'),
    value: `/groups/${id.value}`
  },
  effects: []
}));

//constraint({a: ['Group', 'Light']}, fn(scalar('a'), scalar('a'))

/**
 * @example
 *  on({type: 'Light', ref: '/lights/1'});
 *  // => {type: 'Light', ref: '/groups/1', state: {on: true}}
 *  on({type: 'Group', ref: '/groups/1'});
 *  // => {type: 'Group', state: {on: true}}
 */
const on = createFunction(
  constraint({ a: ['Light', 'Group'] })(fn([scalar('a'), scalar('a')])),
  target => ({
    result: target,
    effects: [{ name: 'on', params: { target } }]
  })
);

const bri = createFunction(
  constraint({ a: ['Light', 'Group'] })(
    fn([scalar('Number'), scalar('a'), scalar('a')])
  ),
  (brightness, target) => ({
    ...target,
    state: { ...target.state, bri: brightness.value }
  })
);

const transition = createFunction(
  constraint({ a: ['Light', 'Group'] })(
    fn([scalar('Number'), scalar('a'), scalar('a')])
  ),
  (value, target) => ({
    ...target,
    state: { ...target.state, transition: value.value }
  })
);

const setScene = createFunction(
  fn([scalar('String'), scalar('Group'), scalar('Group')]),
  (value, target) => ({
    ...target,
    state: { ...target.state, scene: value }
  })
);

/**
 * @example
 *  off({type: 'Light', ref: '/lights/1'}); // => {type: 'Light', state: {on: false}}
 *  off({type: 'Group', ref: '/groups/1'}); // => {type: 'Group', state: {on: false}}
 */
const off = createFunction(
  constraint({ a: ['Light', 'Group'] })(fn([scalar('a'), scalar('a')])),
  target => ({
    result: target,
    effects: [{ name: 'off', params: { target } }]
  })
);

/**
 * @example
 *  dimmer(12); // => {type: 'Dimmer', ref: '/sensors/12'}
 */
const dimmer = createFunction(
  fn([scalar('Number'), scalar('Dimmer')]),
  dimmerId => ({
    result: {
      type: scalar('Dimmer'),
      value: `/sensors/${dimmerId.value}`
    },
    effects: []
  })
);

/**
 * @example
 *  button1({type: 'Dimmer', ref: '/sensors/12'});
 *  // => {type: 'Button', button: 'button1', sensor: {type: 'Dimmer', ref: '/sensors/12'}}
 */
const button1 = createFunction(
  fn([scalar('Number'), scalar('Button')]),
  sensor => ({
    result: {
      type: scalar('Button'),
      value: { button: 'button1', sensor }
    },
    effects: []
  })
);

/**
 * @example
 *  initial_press({type: 'Button', button: 'button1', sensor: {type: 'Dimmer', ref: '/sensors/12'}});
 *  // => {type: 'ButtonEvent', button: 'button1', eventCode: 1000, sensor: {type: 'Dimmer', ref: '/sensors/12'}}
 */
const initial_press = createFunction(
  fn([scalar('Button'), scalar('ButtonEvent')]),
  button => ({
    result: {
      type: scalar('ButtonEvent'),
      value: {
        button: button.value.button,
        eventCode: 1000,
        sensor: button.value.sensor
      }
    },
    effects: []
  })
);

/**
 * @example
 *  handle({type: 'ButtonEvent', ...}, {type: 'FunctionExpression', argsNames: [], fn});
 *  // => {type: 'EventHandler', event: {type: 'ButtonEvent', ...}, actions: [...]}
 */
const handle = createFunction(
  fn([fn([scalar('void')]), scalar('ButtonEvent'), scalar('Rule')]),
  (event, actions) => ({ type: scalar('Rule'), event, actions })
);

/**
 * @example
 *  schedule({type: 'Schedule'}, ); // => {type: 'Schedule', state: {on: false}}
 */
const schedule = () => ({});

/**
 * @example
 *  eq({type: 'Prop', obj: {type: 'Light', ref: '/lights/1'}, name: 'on'}, true);
 *  // => {
 *    type: 'BinaryExpression',
 *    operator: 'eq',
 *    left: {type: 'Prop', obj: {type: 'Light', ref: '/lights/1'}, name: 'on'},
 *    right: true},
 */
const eq = () => ({});

/**
 * @example
 *  condition({type: 'Bool', expr: {...}}, actions: [...]);
 *  // => {type: 'Condition', expr: {...}, actions: [...]}
 */
const condition = () => ({});

const mapFn = createFunction(
  fn([fn([scalar('a'), scalar('b')]), array(scalar('a')), array(scalar('b'))]),
  (it, list) => {
    const elements = reduce(
      (p, c) => {
        const { result, effects } = it.value(c);
        return {
          result: [...p.result, result],
          effects: [...p.effects, ...effects]
        };
      },
      { result: [], effects: [] },
      list.value
    );

    return hsResult(array(it.type))(elements.result)(elements.effects);
  }
);

const removeFn = createFunction(
  constraint({ a: ['Group', 'Schedule', 'Rule'] })(
    fn([scalar('a'), scalar('Void')])
  ),
  (it, list) => {
    return {
      type: scalar('Void')
      //effect: ''
    };
  }
);

const coreLib = {
  delay,
  light,
  group,
  on,
  bri,
  transition,
  setScene,
  off,
  dimmer,
  button1,
  initial_press,
  handle,
  schedule,
  eq,
  condition,
  map: mapFn,
  remove: removeFn
};

export default coreLib;
