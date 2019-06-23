import { useCallback, useMemo } from 'react';
import {
  always,
  any,
  assoc,
  chain,
  curry,
  evolve,
  filter,
  fromPairs,
  identity,
  join,
  map,
  mergeRight,
  prop,
  toPairs,
  uniqBy,
  values
} from 'ramda';

const normalize = (resourceName, data, transform) =>
  fromPairs(
    map(
      ([id, e]) => [
        id,
        (transform || identity)(
          mergeRight(e, {
            ref: `/${resourceName}/${id}`,
            resourceType: resourceName
          })
        )
      ],
      toPairs(data)
    )
  );

const transformRule = r => {
  const code = {};

  return { ...r, code };
};

const transformSchedule = s => {
  const [, , , ...rest] = s.command.address.split('/');

  return evolve(
    {
      command: {
        address: always(`/${join('/', rest)}`)
      }
    },
    s
  );
};

const getRefFromAddress = address => {
  const [, typeId, id] = address.split('/');

  return `/${typeId}/${id}`;
};

const getEdges = hueData => {
  const groupsEdges = chain(
    g => map(l => [`/lights/${l}`, g.ref], g.lights),
    values(hueData.groups)
  );
  const schedulesEdges = map(
    s => [s.ref, getRefFromAddress(s.command.address)],
    values(hueData.schedules)
  );
  const rulesConditionsEdges = chain(
    r => map(c => [getRefFromAddress(c.address), r.ref], r.conditions),
    values(hueData.rules)
  );
  const rulesActionsEdges = chain(
    r => map(c => [r.ref, getRefFromAddress(c.address)], r.actions),
    values(hueData.rules)
  );

  return [
    ...groupsEdges,
    ...schedulesEdges,
    ...rulesConditionsEdges,
    ...rulesActionsEdges
  ];
};

const getResourceByRef = (hueData, ref) => {
  if (ref === '/config/localtime') {
    return { ref: '/config/localtime', name: '/config/localtime' };
  }

  if (ref === '/groups/0') {
    return { ref: '/groups/0', name: 'All lights' };
  }

  const [, type, id] = ref.split('/');
  return hueData[type][id];
};

const getAdjacentsInt = curry((hueData, edges, v) => {
  return map(([a, b]) => {
    const ref = a === v.ref ? b : a;
    const node = getResourceByRef(hueData, ref);
    return { node, ref };
  }, filter(([a, b]) => a === v.ref || b === v.ref, edges));
});

const useHueData = data => {
  const { lights, rules, schedules, scenes, groups, sensors } = data;

  const hueData = useMemo(
    () => ({
      rules: normalize('rules', rules.result, transformRule),
      groups: normalize('groups', groups.result),
      scenes: normalize('scenes', scenes.result),
      lights: normalize('lights', lights.result),
      schedules: normalize('schedules', schedules.result, transformSchedule),
      sensors: normalize('sensors', sensors.result)
    }),
    [rules, groups, scenes, lights, schedules, sensors]
  );

  const edges = useMemo(() => getEdges(hueData), [hueData]);

  const getAdjacents = useCallback(v => getAdjacentsInt(hueData, edges, v), [
    hueData,
    edges
  ]);

  /*const z = map(
    r =>
      assoc(
        'errors',
        map(
          a => `Reference to not existing resource: ${a.ref}`,
          uniqBy(prop('ref'), filter(a => !a.node, getAdjacents(r)))
        ),
        r
      ),
    chain(values, values(hueData))
  );*/

  const hueDataWithErrors = useMemo(
    () =>
      map(
        map(r =>
          assoc(
            'errors',
            map(
              a => `Reference to not existing resource: ${a.ref}`,
              uniqBy(prop('ref'), filter(a => !a.node, getAdjacents(r)))
            ),
            r
          )
        ),
        hueData
      ),
    [hueData]
  );

  //console.log('zz', filter(z => z.errors.length > 0, z));

  return { ...hueDataWithErrors, edges, getAdjacents };
};

export default useHueData;
