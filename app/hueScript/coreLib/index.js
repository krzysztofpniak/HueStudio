import { array, scalar, fn, constraint } from '../typeSystem';
import { map, pathOr } from 'ramda';

const createFunction = (signature, fn) => ({
  type: signature,
  function: fn
});

/**
 * @example
 *  light(1); // => {type: 'Light', ref: '/lights/1'}
 */
const light = createFunction(fn(scalar('Number'), scalar('Light')), id => ({
  type: scalar('Light'),
  ref: `/lights/${id.value}`
}));

/**
 * @example
 *  group(1); // => {type: 'Group', ref: '/groups/1'}
 */
const group = createFunction(fn(scalar('Number'), scalar('Group')), id => ({
  type: scalar('Group'),
  ref: `/groups/${id.value}`
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
  constraint({ a: ['Light', 'Group'] }, fn(scalar('a'), scalar('a'))),
  target => ({
    ...target,
    state: { ...target.state, on: true }
  })
);

const bri = createFunction(
  constraint(
    { a: ['Light', 'Group'] },
    fn(scalar('Number'), scalar('a'), scalar('a'))
  ),
  (brightness, target) => ({
    ...target,
    state: { ...target.state, bri: brightness.value }
  })
);

const transition = createFunction(
  constraint(
    { a: ['Light', 'Group'] },
    fn(scalar('Number'), scalar('a'), scalar('a'))
  ),
  (value, target) => ({
    ...target,
    state: { ...target.state, transition: value.value }
  })
);

const setScene = createFunction(
  fn(scalar('String'), scalar('Group'), scalar('Group')),
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
  constraint({ a: ['Light', 'Group'] }, fn(scalar('a'), scalar('a'))),
  target => ({ ...target, state: { ...target.state, on: false } })
);

/**
 * @example
 *  dimmer(12); // => {type: 'Dimmer', ref: '/sensors/12'}
 */
const dimmer = createFunction(
  fn(scalar('Number'), scalar('Dimmer')),
  dimmerId => ({
    type: scalar('Dimmer'),
    ref: `/sensors/${dimmerId.value}`
  })
);

/**
 * @example
 *  button1({type: 'Dimmer', ref: '/sensors/12'});
 *  // => {type: 'Button', button: 'button1', sensor: {type: 'Dimmer', ref: '/sensors/12'}}
 */
const button1 = createFunction(
  fn(scalar('Number'), scalar('Button')),
  sensor => ({
    type: scalar('Button'),
    button: 'button1',
    sensor
  })
);

/**
 * @example
 *  initial_press({type: 'Button', button: 'button1', sensor: {type: 'Dimmer', ref: '/sensors/12'}});
 *  // => {type: 'ButtonEvent', button: 'button1', eventCode: 1000, sensor: {type: 'Dimmer', ref: '/sensors/12'}}
 */
const initial_press = createFunction(
  fn(scalar('Button'), scalar('ButtonEvent')),
  button => ({
    type: scalar('ButtonEvent'),
    button: button.button,
    eventCode: 1000,
    sensor: button.sensor
  })
);

/**
 * @example
 *  handle({type: 'ButtonEvent', ...}, {type: 'FunctionExpression', argsNames: [], fn});
 *  // => {type: 'EventHandler', event: {type: 'ButtonEvent', ...}, actions: [...]}
 */
const handle = createFunction(
  fn(fn(scalar('void')), scalar('ButtonEvent'), scalar('Rule')),
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
  fn(fn(scalar('a'), scalar('b')), array(scalar('a')), array(scalar('b'))),
  (it, list) => ({
    type: 'Array',
    elements: map(it.function, list.elements)
  })
);

const removeFn = createFunction(
  constraint(
    { a: ['Group', 'Light', 'Schedule', 'Rule'] },
    fn(scalar('a'), scalar('Void'))
  ),
  (it, list) => {
    return {
      type: 'remove'
    };
  }
);

const coreLib = {
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
