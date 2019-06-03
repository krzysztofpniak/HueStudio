import { any, unless, of, equals, pluck, find } from 'ramda';

const orderDict = ['first', 'second', 'third'];

const signature = (returnType, ...argTypes) => ({ argTypes, returnType });

const ButtonSignature = signature('EventSource', 'SwitchSensor');

const HandleSignature = signature(
  'EventSource',
  'EventSource',
  'DimmerEventType',
  'Handler'
);

const fns = {
  button1: ButtonSignature,
  button2: ButtonSignature,
  button3: ButtonSignature,
  button4: ButtonSignature,
  handle: HandleSignature,
  short_release: signature('DimmerEventType'),
  long_release: signature('DimmerEventType'),
  initial_press: signature('DimmerEventType'),
  repeat: signature('DimmerEventType'),
  dimmer: signature('SwitchSensor', 'number'),
  group: signature('Group', 'number'),
  light: signature('Light', 'number'),
  on: [signature('Light', 'Light'), signature('Group', 'Group')],
  off: [signature('Light', 'Light'), signature('Group', 'Group')],
  transition: [
    signature('Light', 'Light', 'number'),
    signature('Group', 'Group', 'number')
  ],
  alert: [
    signature('Light', 'Light', 'number'),
    signature('Group', 'Group', 'number')
  ],
  lastAccess: signature('DateTime', 'SwitchSensor'),
  now: signature('DateTime'),
  in: signature('Bool', 'DateTime', 'TimePattern')
};

const vars = {};

const getHelpers = ({ error }) => {
  const toCall = (name, args, location) => {
    if (!fns[name] && !vars[name]) {
      error(`unknown identifier ${name}`, location);
    }

    return {
      type: 'call',
      name,
      args,
      cls: fns[name]
        ? fns[name].returnType
        : vars[name]
        ? vars[name].cls
        : null, // todo
      location
    };
  };

  const validateCall = c => {
    let cls;
    if (vars[c.name]) {
      cls = vars[c.name].cls;
    } else {
      const s = getSignature(fns[c.name], c);

      if (!s) {
        if (isMemberCall(c)) {
          error(`${c.args[0].name} has no member ${c.name}`, c.location); //
        } else {
          error('unknown symbol');
        }
      }
      cls = s.returnType;
    }

    if (fns[c.name]) {
      if (isMemberCall(c)) {
        if (!checkArgType(fns[c.name], 0, c)) {
          error(`${c.args[0].name} has no member ${c.name}`, c.location); //
        }
      }

      if (!checkArgsLength(fns[c.name], c)) {
        //error(`${c.name} expects ${requiredArgs(fns[c.name], c)} arguments, ${requiredArgs(c.args.length, c)} given`, c.location);
        error(
          `${c.name} expects ${JSON.stringify(
            fns[c.name]
          )} arguments, ${requiredArgs(c.args.length, c)} given`,
          c.location
        );
      }

      /*for (let i = 0; i < fns[c.name].argTypes.length; i++) {
        if (!c.args[i].cls) {
          error(`unknown parameter ${c.args[i].name}`, c.args[i].location);
        }
        if (c.args[i].cls !== fns[c.name].argTypes[i]) {
          error(`wrong type of the ${orderDict[i - (isMemberCall(c) ? 1 : 0)]} parameter, ${fns[c.name].argTypes[i]} expected, ${c.args[i].cls} given`, c.args[i].location);
        }
      }*/
    }
    return { ...c, cls, location: undefined };
  };

  const reduce = (fn, seed, array) =>
    Array.prototype.reduce.call(array, fn, seed);
  const map = (fn, array) => Array.prototype.map.call(array, fn);

  const isMemberCall = x =>
    x.args && x.args.length > 0 && x.args[0].type === 'mcall';

  const checkArgsLength = (signature, x) =>
    Array.isArray(signature)
      ? any(s => x.args && x.args.length === s.argTypes.length, signature)
      : x.args && x.args.length === signature.argTypes.length;
  const requiredArgs = (c, x) => (isMemberCall(x) ? c - 1 : c);
  const checkArgType = (signature, idx, x) =>
    any(
      s => x.args && x.args[idx].cls === s.argTypes[idx],
      unless(Array.isArray, of, signature)
    );

  const getSignature = (overloads, call) =>
    find(
      s => equals(s.argTypes, pluck('cls', call.args)),
      unless(Array.isArray, of, overloads)
    );

  const toMCall = xs => map(x => ({ ...x, type: 'mcall' }), xs);

  const clearVars = () => {
    for (let prop in vars) {
      if (vars.hasOwnProperty(prop)) {
        delete vars[prop];
      }
    }
  };

  return {
    toCall,
    fns,
    vars,
    signature,
    validateCall,
    reduce,
    map,
    toMCall,
    clearVars
  };
};

export { getHelpers, fns };
