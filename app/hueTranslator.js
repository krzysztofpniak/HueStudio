import { append, concat, evolve, map, reduce } from 'ramda';

const eventCodes = {
  dimmer: {
    button1: {
      initial_press: 1000,
      repeat: 1001,
      short_release: 1002,
      long_release: 1003
    },
    button2: {
      initial_press: 2000,
      repeat: 2001,
      short_release: 2002,
      long_release: 2003
    },
    button3: {
      initial_press: 3000,
      repeat: 3001,
      short_release: 3002,
      long_release: 3003
    },
    button4: {
      initial_press: 4000,
      repeat: 4001,
      short_release: 4002,
      long_release: 4003
    }
  }
};

const resolveName = (c, vars) =>
  vars[c.name] ? resolveName(vars[c.name], vars) : c.name;

const resolveArgs = (c, vars) => ({
  ...c,
  name: resolveName(c, vars),
  args: map(
    a => (vars[a.name] ? resolveArgs(vars[a.name], vars) : a),
    c.args || []
  )
});

const translateAction = (e, vars) => {
  const resolved = resolveArgs(e, vars);
  console.log('translateAction', resolved);

  if (resolved.name === 'in') {
    return processIn(resolved, vars);
  } else if (resolved.name === 'now') {
    return processNow(resolved, vars);
  } else if (resolved.name === 'timePattern') {
    return translateTimePattern(resolved, vars);
  } else if (resolved.name === 'on') {
    return translateOn(resolved, vars);
  } else if (resolved.name === 'off') {
    return translateOff(resolved, vars);
  } else if (resolved.name === 'light') {
    return translateLight(resolved, vars);
  } else if (resolved.name === 'number') {
    return translateNumber(resolved, vars);
  }

  throw `missing translation for ${e.name} ${e.type}`;
};

const translateOn = (e, vars) => {
  return {
    address: translateAction(e.args[0], vars),
    method: 'PUT',
    body: {
      on: true
    }
  };
};

const translateOff = (e, vars) => {
  return {
    address: translateAction(e.args[0], vars),
    method: 'PUT',
    body: {
      on: false
    }
  };
};

const translateLight = (e, vars) => {
  return `/lights/${translateAction(e.args[0], vars)}/action`;
};

const translateNumber = e => {
  return e.value;
};

const process = (requestBase, statements, vars) =>
  reduce(
    (p, c) => {
      if (c.type === 'condition') {
        const e = evolve(
          {
            conditions: append(translateAction(c.condition, vars)),
            actions: concat(map(x => translateAction(x, vars), c.statements))
          },
          requestBase
        );
        return [...p, e];
      }
      return p;
    },
    [],
    statements
  );

const processNow = (e, vars) => {
  return '/config/localtime';
};

const translateTimePattern = (e, vars) => {
  return e.value;
};

const processIn = (e, vars) => {
  console.log('processIn', e);
  const left = translateAction(e.args[0], vars);
  const right = translateAction(e.args[1], vars);

  const result = {
    address: left,
    operator: 'in',
    value: right
  };

  return result;
};

const handle = (e, vars) => {
  const [source, event, handler] = resolveArgs(e, vars).args;

  const sourceName = source.name;
  const eventName = event.name;
  const [sensor] = source.args;
  const sensorType = sensor.name;
  const sensorId = sensor.args[0].value;
  const eventCode = eventCodes[sensorType][sourceName][eventName];
  //const actions = map(a => resolveArgs(a, vars), handler.value);

  const requestBase = {
    conditions: [
      {
        address: `/sensors/${sensorId}/state/buttonevent`,
        operator: 'eq',
        value: `${eventCode}`
      },
      {
        address: `/sensors/${sensorId}/state/lastupdated`,
        operator: 'dx'
      }
    ],
    actions: []
  };

  //const result = reduce((p, c) => p, [requestBase], handler.value);

  return process(requestBase, handler.value, vars);
};

export { handle };
