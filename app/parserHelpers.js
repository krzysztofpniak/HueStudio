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

const vars = {};

const getHelpers = ({ error }) => {
  const toCall = (name, args, location) => {
    return {
      type: 'call',
      name,
      args,
      location
    };
  };

  const reduce = (fn, seed, array) =>
    Array.prototype.reduce.call(array, fn, seed);
  const map = (fn, array) => Array.prototype.map.call(array, fn);

  const toMCall = xs => map(x => ({ ...x, mcall: true }), xs);

  const clearVars = () => {
    for (let prop in vars) {
      if (vars.hasOwnProperty(prop)) {
        delete vars[prop];
      }
    }
  };

  return {
    toCall,
    vars,
    signature,
    reduce,
    map,
    toMCall,
    clearVars
  };
};

export { getHelpers };
