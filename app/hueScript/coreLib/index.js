import { array, scalar, fn, constraint } from '../typeSystem';
import { map, pathOr, pluck, reduce, keys, toPairs } from 'ramda';
import { hsPureResult, hsResult } from '../typeSystem/helpers';
import $ from 'sanctuary-def';
import {
  AstNode,
  def,
  HSContext,
  HSEffect,
  HSError,
  HSLibFn,
  HSLibFnGuard,
  HSLibFnValue,
  HSType,
  HSTypeResolution,
  HSValue,
  HueBridgeState
} from '../../sanctuary/types';
import { Just, justs, Nothing } from '../../sanctuary';

const createFunction = def('createFunction')({})([
  HSType,
  HSLibFnGuard,
  $.Unknown,
  HSLibFn
])(signature => guard => fn => ({
  type: signature,
  value: { fn, guard }
}));

const pass = () => () => Nothing;

const isGroupDefined = n => args => ctx => {
  const allowed = keys(ctx.bridgeState.groups);
  return allowed.includes('' + args[n].value)
    ? Nothing
    : Just({
        name: 'ValueOutOfRange',
        message: `Value is not in allowed set: ${map(
          ([id, g]) => `${id}(${g.name})`
        )(toPairs(ctx.bridgeState.groups)).join(', ')}`,
        argIdx: n,
        allowed,
        current: args[n].value
      });
};

const isLightDefined = n => args => ctx => {
  const allowed = keys(ctx.bridgeState.lights);
  return allowed.includes('' + args[n].value)
    ? Nothing
    : Just({
        name: 'ValueOutOfRange',
        message: `Value is not in allowed set: ${map(
          ([id, g]) => `${id}(${g.name})`
        )(toPairs(ctx.bridgeState.lights)).join(', ')}`,
        argIdx: n,
        allowed,
        current: args[n].value
      });
};

const delay = createFunction(fn([scalar('Number'), scalar('Void')]))(pass)(ms =>
  hsResult(scalar('Void'))(null)([{ name: 'delay', params: { ms: ms.value } }])
);

const light = createFunction(fn([scalar('Number'), scalar('Light')]))(
  isLightDefined(0)
)(id => ({
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
const group = createFunction(fn([scalar('Number'), scalar('Group')]))(
  isGroupDefined(0)
)(id => ({
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
  constraint({ a: ['Light', 'Group'] })(fn([scalar('a'), scalar('a')]))
)(pass)(target => ({
  result: target,
  effects: [{ name: 'on', params: { target } }]
}));

const bri = createFunction(
  constraint({ a: ['Light', 'Group'] })(
    fn([scalar('Number'), scalar('a'), scalar('a')])
  )
)(pass)((brightness, target) =>
  hsResult(target.type)(target.value)([
    {
      name: 'bri',
      params: { target, bri: brightness.value }
    }
  ])
);

const ct = createFunction(
  constraint({ a: ['Light', 'Group'] })(
    fn([scalar('Number'), scalar('a'), scalar('a')])
  )
)(pass)((ct, target) =>
  hsResult(target.type)(target.value)([
    {
      name: 'ct',
      params: { target, ct: ct.value }
    }
  ])
);

const transition = createFunction(
  constraint({ a: ['Light', 'Group'] })(
    fn([scalar('Number'), scalar('a'), scalar('a')])
  )
)(pass)((time, target) =>
  hsResult(target.type)(target.value)([
    {
      name: 'transition',
      params: { target, time: time.value }
    }
  ])
);

const setScene = createFunction(
  fn([scalar('String'), scalar('Group'), scalar('Group')])
)(pass)((scene, target) =>
  hsResult(scalar('Group'))(target.value)([
    { name: 'setScene', params: { target, scene: scene.value } }
  ])
);

/**
 * @example
 *  off({type: 'Light', ref: '/lights/1'}); // => {type: 'Light', state: {on: false}}
 *  off({type: 'Group', ref: '/groups/1'}); // => {type: 'Group', state: {on: false}}
 */
const off = createFunction(
  constraint({ a: ['Light', 'Group'] })(fn([scalar('a'), scalar('a')]))
)(pass)(target => ({
  result: target,
  effects: [{ name: 'off', params: { target } }]
}));

/**
 * @example
 *  dimmer(12); // => {type: 'Dimmer', ref: '/sensors/12'}
 */
const dimmer = createFunction(fn([scalar('Number'), scalar('Dimmer')]))(pass)(
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

const createButtonFn = name =>
  createFunction(fn([scalar('Dimmer'), scalar('Button')]))(pass)(sensor => ({
    result: {
      type: scalar('Button'),
      value: { button: name, sensor }
    },
    effects: []
  }));

const button1 = createButtonFn('button1');
const button2 = createButtonFn('button2');
const button3 = createButtonFn('button3');
const button4 = createButtonFn('button4');

/**
 * @example
 *  initial_press({type: 'Button', button: 'button1', sensor: {type: 'Dimmer', ref: '/sensors/12'}});
 *  // => {type: 'ButtonEvent', button: 'button1', eventCode: 1000, sensor: {type: 'Dimmer', ref: '/sensors/12'}}
 */
const initial_press = createFunction(
  fn([scalar('Button'), scalar('ButtonEvent')])
)(pass)(button => ({
  result: {
    type: scalar('ButtonEvent'),
    value: {
      button: button.value.button,
      eventCode: 1000,
      sensor: button.value.sensor
    }
  },
  effects: []
}));

const long_release = createFunction(
  fn([scalar('Button'), scalar('ButtonEvent')])
)(pass)(button => ({
  result: {
    type: scalar('ButtonEvent'),
    value: {
      button: button.value.button,
      eventCode: 4000,
      sensor: button.value.sensor
    }
  },
  effects: []
}));

/**
 * @example
 *  handle({type: 'ButtonEvent', ...}, {type: 'FunctionExpression', argsNames: [], fn});
 *  // => {type: 'EventHandler', event: {type: 'ButtonEvent', ...}, actions: [...]}
 */
const handle = createFunction(
  fn([fn([scalar('void')]), scalar('ButtonEvent'), scalar('Rule')])
)(args => context => {
  console.log(
    args[1].value.eventCode,
    JSON.stringify(args[1].value.sensor.value),
    JSON.stringify(
      map(
        r => [r.conditions, r.actions],
        filter(
          r =>
            !r.conditions ||
            any(
              c =>
                endsWith('buttonevent', c.address) &&
                c.value === '' + args[1].value.eventCode,
              r.conditions
            ),
          map(
            ref => getResourceByRef(context.bridgeState, ref),
            uniq(
              map(
                a => a[1],
                filter(
                  a => a[0] === args[1].value.sensor.value,
                  context.bridgeState.edges
                )
              )
            )
          )
        )
      ),
      null,
      2
    )
  );
  return Nothing;
})(
  (event, actions) =>
    console.log(event, actions) || hsResult(scalar('Rule'))({})([])
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
  fn([fn([scalar('a'), scalar('b')]), array(scalar('a')), array(scalar('b'))])
)(([it, list]) => ctx => {
  const wrongEntries = justs(map(a => it.value.guard([a])(ctx))(list.value));
  return wrongEntries.length > 0
    ? Just({
        name: 'ValueNotInRange',
        message: `Values passed (${map(e => e.current)(wrongEntries).join(
          ', '
        )}) to function are not in valid range(${wrongEntries[0].allowed.join(
          ', '
        )})`,
        argIdx: 0
      })
    : Nothing;
})((it, list) => {
  const elements = reduce(
    (p, c) => {
      const { result, effects } = it.value.fn(c);
      return {
        result: [...p.result, result],
        effects: [...p.effects, ...effects]
      };
    },
    { result: [], effects: [] },
    list.value
  );

  return hsResult(array(it.type))(elements.result)(elements.effects);
});

const tap = createFunction(
  fn([fn([scalar('a'), scalar('b')]), scalar('a'), scalar('a')])
)(pass)((f, target) => {
  const result = f.value.fn(target);

  return hsResult(target.type)(target.value)(result.effects);
});

const always = createFunction(
  fn([scalar('a'), fn([scalar('b'), scalar('a')])])
)(pass)(data => {
  const result = {
    fn: () => hsResult(data.type)(data.value)([]),
    guard: () => () => Nothing
  };

  return hsResult(fn([scalar('b'), scalar('a')]))(result)([]);
});

const removeFn = createFunction(
  constraint({ a: ['Group', 'Schedule', 'Rule'] })(
    fn([scalar('a'), scalar('Void')])
  )
)(pass)(target => {
  return hsResult(scalar('Void'))(null)([
    { name: 'remove', params: { target } }
  ]);
});

const print = createFunction(
  constraint({ a: ['String', 'Number'] })(fn([scalar('a'), scalar('Void')]))
)(pass)(data => {
  return hsResult(scalar('Void'))(null)([{ name: 'print', params: { data } }]);
});

const clear = createFunction(fn([scalar('Void')]))(pass)(() => {
  return hsResult(scalar('Void'))(null)([{ name: 'clear', params: {} }]);
});

const coreLib = {
  delay,
  light,
  group,
  on,
  bri,
  ct,
  transition,
  setScene,
  off,
  dimmer,
  button1,
  button2,
  button3,
  button4,
  initial_press,
  long_release,
  handle,
  schedule,
  eq,
  condition,
  map: mapFn,
  tap,
  always,
  remove: removeFn,
  print,
  clear
};

export default coreLib;
