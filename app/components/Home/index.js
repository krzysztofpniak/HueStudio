// @flow
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef
} from 'react';
import SplitPane from 'react-split-pane';
import { Link } from 'react-router-dom';
import fs from 'fs';
import { basename } from 'path';
import {
  map,
  addIndex,
  filter,
  startsWith,
  values,
  mapObjIndexed,
  curry,
  evolve,
  prop,
  indexBy,
  chain,
  prepend,
  includes,
  reject,
  T,
  head,
  toPairs,
  cond,
  propEq,
  compose,
  tryCatch,
  objOf,
  ifElse,
  of,
  always,
  hasPath,
  path,
  assoc,
  assocPath,
  keys,
  reduce,
  identity,
  when
} from 'ramda';
import LightIcon from '@material-ui/icons/WbIncandescent';
import NoteIcon from '@material-ui/icons/Remove';
import TimerIcon from '@material-ui/icons/Timer';
import SceneIcon from '@material-ui/icons/Panorama';
import GroupIcon from '@material-ui/icons/GroupWork';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import NestedList from '../NestedList';
import AppBar from '../AppBar';
import routes from '../../constants/routes';
import styles from '../Home.css';
import '../splitter.global.css';
import hueParser from '../../huejs.peg';
import store from '../../appSettings';
import Terminal from '../terminal';
import ResourceViewer from '../resourceViewer';
import {
  Scope,
  withScope,
  createAction,
  createPayloadReducer,
  createStateReducer,
  createReducer,
  useKReducer,
  usePrevious
} from '@k-frame/core';
import { useSaga } from '@k-frame/sagas';
import HSEditor from '../sqlEditor';
import { getInitialValue, getPlainText } from '../codeEditor';
import saga from './effects';

const filterWithKey = addIndex(filter);
const mapWithKey = addIndex(map);

const get = async url => {
  const r = await fetch(url);
  const result = await r.json();
  return result;
};

const remove = async url => {
  const r = await fetch(url, {
    method: 'DELETE'
  });
  const result = await r.json();
  return result;
};

const post = async (url, data) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const result = await r.json();
  return result;
};

const getRules = () =>
  get('http://192.168.0.13/api/YOUR_BRIDGE_USERNAME/rules');

try {
  console.log(hueParser.parse('const group = group(2);'));
} catch (e) {
  console.error(e);
}

type ListItemProps = {
  id: string,
  title: string,
  onRemoveClick: string => void
};

const ListItem0 = ({ id, title, onRemoveClick }: ListItemProps) => {
  return (
    <div>
      #{id} {title}{' '}
      <button type="button" onClick={() => onRemoveClick(id)}>
        Remove
      </button>
    </div>
  );
};

const baseApiPath = 'api/YOUR_BRIDGE_USERNAME';

const baseApiUrl = `http://192.168.0.13/${baseApiPath}`;

const useLoadCreator = (url, callback, transform) =>
  useCallback(
    (...args) =>
      get(url)
        .then(data => {
          const finalData = transform ? transform(data, ...args) : data;
          callback(finalData);
          return finalData;
        })
        .catch(r => console.error(r)),
    []
  );

const resolveAddress = curry((refs, address) =>
  address.replace(/ref\((.*?)\)/g, (a, b) => refs[b])
);

const resolveRule = (refs, r) =>
  evolve({ actions: map(evolve({ address: resolveAddress(refs) })) }, r);

const resolveRules = (refs, rules) => map(r => resolveRule(refs, r), rules);

const useHue = () => {
  const [rules, setRules] = useState({});
  const [groups, setGroups] = useState({});
  const [lights, setLights] = useState({});
  const [scenes, setScenes] = useState({});
  const [schedules, setSchedules] = useState({});

  const loadSchedules = useLoadCreator(`${baseApiUrl}/schedules`, setSchedules);
  const loadRules = useLoadCreator(`${baseApiUrl}/rules`, setRules);
  const loadLights = useLoadCreator(`${baseApiUrl}/lights`, setLights);
  const loadGroups = useLoadCreator(`${baseApiUrl}/groups`, setGroups);
  const loadScenes = useLoadCreator(
    `${baseApiUrl}/scenes`,
    setScenes,
    (data, gs) =>
      map(
        s => ({ name: s.name + s.group + (gs[s.group] && gs[s.group].name) }),
        data
      )
  );

  const removeRule = useCallback(async id => {
    const r = await remove(`${baseApiUrl}/rules/${id}`);
    await loadRules();
  }, []);

  const postRule = useCallback(async data => {
    await post(`${baseApiUrl}/rules`, data);
    await loadRules();
  }, []);

  const removeSchedule = useCallback(async id => {
    const r = await remove(`${baseApiUrl}/schedules/${id}`);
    await loadSchedules();
  }, []);

  const postSchedule = useCallback(async data => {
    const r = await post(`${baseApiUrl}/schedules`, data);
    await loadSchedules();
    return r;
  }, []);

  const deployHsResources = useCallback(async data => {
    const refs = {};
    const ss = await loadSchedules();
    const s2 = filter(r => startsWith('hs:', r.name), ss);
    await Promise.all(values(mapObjIndexed((a, id) => removeSchedule(id), s2)));

    const rs = await loadRules();
    const r2 = filter(r => startsWith('hs:', r.name), rs);

    await Promise.all(values(mapObjIndexed((a, id) => removeRule(id), r2)));

    const xx = await Promise.all(
      map(async r => {
        const result = await postSchedule({
          ...r.def,
          command: {
            ...r.def.command,
            address: `/${baseApiPath}${r.def.command.address}`
          }
        });

        refs[r.ref] = `/schedules/${result[0].success.id}`;

        return { ...r, id: result[0].success.id };
      }, data.schedules)
    );
    const resolvedRules = resolveRules(refs, data.rules);
    console.log(xx, refs, resolvedRules);
    await Promise.all(map(r => postRule(r), resolvedRules));
  }, []);

  useEffect(() => {
    loadGroups()
      .then(g => loadScenes(g))
      .catch(console.error);
    loadRules();
    loadLights();
    loadSchedules();
  }, []);

  return {
    rules,
    loadRules,
    removeRule,
    groups,
    loadGroups,
    lights,
    loadLights,
    scenes,
    schedules,
    loadScenes,
    deployHsResources
  };
};

const Rules = ({ rules, scenes, lights, groups, onRemoveClick }) => {
  const [currentView, setCurrentView] = useState('groups');

  const dataMap = {
    rules,
    groups,
    scenes,
    lights
  };

  return (
    <div style={{ width: '300px', textAlign: 'left' }}>
      <select
        value={currentView}
        onChange={e => setCurrentView(e.target.value)}
      >
        <option value="groups">Groups</option>
        <option value="rules">Rules</option>
        <option value="scenes">Scenes</option>
        <option value="lights">Lights</option>
      </select>
      <div style={{ overflow: 'scroll', height: '500px' }}>
        {Object.entries(dataMap[currentView]).map(([k, r]) => (
          <ListItem0
            key={k}
            id={k}
            title={r.name}
            onRemoveClick={onRemoveClick}
          />
        ))}
      </div>
    </div>
  );
};

const RuleEditor = ({
  text,
  onTextChange,
  parsed,
  errors,
  defaultSize,
  onPanesChange
}) => {
  const json = useMemo(
    () =>
      parsed.data ? JSON.stringify(parsed.data, null, 2) : parsed.error.message,
    [parsed]
  );

  // const xx = useMemo(getInitialValue, [text]);

  return (
    <SplitPane
      split="vertical"
      defaultSize={defaultSize}
      onChange={onPanesChange}
    >
      <HSEditor value={text} onChange={onTextChange} errors={errors} />
      <textarea className={styles.code} value={json} readOnly />
    </SplitPane>
  );
};

const usePersisted = key => {
  const result = useState('');
  const [text, setText] = result;
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  });

  useEffect(() => {
    console.log('loading 2');
    setText(store.get(key));
    return () => {
      console.log('saving');
      store.set(key, textRef.current);
    };
  }, []);

  return result;
};

const getSideBarItems = ({ lights, groups, scenes, schedules, rules }) => [
  {
    id: 'lights',
    name: 'Lights',
    icon: LightIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/lights/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(lights)
    )
  },
  {
    id: 'groups',
    name: 'Groups',
    icon: GroupIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/groups/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(groups)
    )
  },
  {
    id: 'scenes',
    name: 'Scenes',
    icon: SceneIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/scenes/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(scenes)
    )
  },
  {
    id: 'schedules',
    name: 'Schedules',
    icon: TimerIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/schedules/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(schedules)
    )
  },
  {
    id: 'rules',
    name: 'Rules',
    icon: TimerIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/rules/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(rules)
    )
  }
];

const actions = {
  lights: [
    {
      id: 'on',
      name: 'On',
      requestCreator: (resourceId, data) => ({
        url: `/lights/${resourceId}/state`,
        method: 'PUT',
        body: {
          on: true
        }
      }),
      codeCreator: (resourceId, data) => `light(${resourceId}).on();`
    },
    {
      id: 'off',
      name: 'Off',
      requestCreator: (resourceId, data) => ({
        url: `/lights/${resourceId}/state`,
        method: 'PUT',
        body: {
          on: false
        }
      }),
      codeCreator: (resourceId, data) => `light(${resourceId}).off();`
    },
    {
      id: 'alert',
      name: 'Alert',
      requestCreator: (resourceId, data) => ({
        url: `/lights/${resourceId}/state`,
        method: 'PUT',
        body: {
          alert: 'select'
        }
      }),
      codeCreator: (resourceId, data) => `light(${resourceId}).alert('select);`
    },
    {
      id: 'effect1',
      name: 'Effect Loop',
      requestCreator: (resourceId, data) => ({
        url: `/lights/${resourceId}/state`,
        method: 'PUT',
        body: {
          effect: 'colorloop'
        }
      }),
      codeCreator: (resourceId, data) =>
        `light(${resourceId}).effect('colorloop);`
    },
    {
      id: 'effect2',
      name: 'Effect None',
      requestCreator: (resourceId, data) => ({
        url: `/lights/${resourceId}/state`,
        method: 'PUT',
        body: {
          effect: 'none'
        }
      }),
      codeCreator: (resourceId, data) => `light(${resourceId}).effect('none);`
    }
  ],
  groups: [
    {
      id: 'on',
      name: 'On',
      requestCreator: (resourceId, data) => ({
        url: `/groups/${resourceId}/action`,
        method: 'PUT',
        body: {
          on: true
        }
      }),
      codeCreator: (resourceId, data) => `group(${resourceId}).on();`
    },
    {
      id: 'off',
      name: 'Off',
      requestCreator: (resourceId, data) => ({
        url: `/groups/${resourceId}/action`,
        method: 'PUT',
        body: {
          on: false
        }
      }),
      codeCreator: (resourceId, data) => `group(${resourceId}).off();`
    },
    {
      id: 'alert',
      name: 'Alert',
      requestCreator: (resourceId, data) => ({
        url: `/groups/${resourceId}/action`,
        method: 'PUT',
        body: {
          alert: 'select'
        }
      }),
      codeCreator: (resourceId, data) => `group(${resourceId}).alert('select');`
    }
  ]
};

const { parse } = hueParser;

const parseHue = tryCatch(
  compose(
    objOf('data'),
    parse
  ),
  objOf('error')
);

const toErrors = ifElse(
  hasPath(['error', 'location']),
  compose(
    of,
    path(['error', 'location'])
  ),
  always([])
);

const renameKeys = curry((keysMap, obj) =>
  reduce((acc, key) => assoc(keysMap[key] || key, obj[key], acc), {}, keys(obj))
);

const actions2 = {
  setCodeEditorState: createAction('setCodeEditorState', (tabId, state) => ({
    tabId,
    state
  })),
  newFile: createAction('newFile'),
  openFile: createAction('openFile'),
  fileLoaded: createAction('fileLoaded'),
  fileCreated: createAction('fileCreated'),
  fileSaved: createAction('fileSaved'),
  setOpenedResources: createAction('setOpenedResources'),
  setActiveTabId: createAction('setActiveTabId'),
  setModified: createAction('setModified')
};

const reducer = createReducer(
  {
    codeEditorStates: {},
    currentFileName: '',
    openedResources: [],
    activeTabId: null,
    modified: {}
  },
  [
    createPayloadReducer(actions2.setCodeEditorState, ({ tabId, state }) =>
      assocPath(['codeEditorStates', tabId], state)
    ),
    createPayloadReducer(actions2.fileLoaded, ({ content, fileName }) =>
      evolve({
        codeEditorStates: assoc(fileName, getInitialValue(content)),
        openedResources: compose(
          prepend({
            type: 'file',
            ref: fileName,
            name: basename(fileName)
          }),
          reject(propEq('ref', fileName))
        ),
        activeTabId: always(fileName),
        modified: assoc(fileName, false)
      })
    ),
    createPayloadReducer(actions2.newFile, ({ id }) =>
      evolve({
        codeEditorStates: assoc(id, getInitialValue('')),
        openedResources: prepend({
          type: 'file',
          ref: id,
          temp: true,
          name: `${id} Hue Script.hue`
        }),
        activeTabId: always(id),
        modified: assoc(id, true)
      })
    ),
    createPayloadReducer(actions2.fileCreated, ({ ref, fileName }) =>
      evolve({
        codeEditorStates: renameKeys({ [ref]: fileName }),
        openedResources: map(when(propEq('ref', ref), assoc('ref', fileName))),
        activeTabId: always(fileName)
      })
    ),
    createPayloadReducer(actions2.setOpenedResources, assoc('openedResources')),
    createPayloadReducer(actions2.setActiveTabId, assoc('activeTabId')),
    createPayloadReducer(actions2.fileSaved, ({ fileName, prevFileName }) =>
      evolve({
        codeEditorStates:
          fileName !== prevFileName
            ? renameKeys({ [prevFileName]: fileName })
            : identity,
        openedResources: map(r =>
          r.ref === prevFileName
            ? { ...r, ref: fileName, name: basename(fileName), temp: false }
            : r
        ),
        activeTabId: always(fileName),
        modified: assoc(fileName, false)
      })
    ),
    createPayloadReducer(actions2.setModified, p =>
      p ? assocPath(['modified', p], true) : identity
    ),
    (s, a) => console.log('qq', s, a) || s
  ]
);
/*
const s1 = reducer(undefined, { type: '@@INIT' });
const s2 = reducer(s1, { type: '@@INIT' });
console.log('s2', s2);
*/

const withStaticScope = scope => BaseComponent => props => (
  <Scope scope={scope}>
    <BaseComponent {...props} />
  </Scope>
);

const Editor = cond([
  [propEq('type', 'file'), RuleEditor],
  [propEq('type', 'resource'), ResourceViewer],
  [T, always('Open a file or resource')]
]);

const usePersistance = (key, data, onLoad) => {
  useEffect(() => {
    onLoad(store.get(key));
  }, []);

  const prev = usePrevious(data);

  useEffect(() => {
    if (prev !== data) {
      store.set(key, data);
    }
  }, [prev, data]);
};

const Home = withStaticScope('home')(() => {
  const {
    codeEditorStates,
    setCodeEditorState,
    openedResources,
    setOpenedResources,
    activeTabId,
    setActiveTabId,
    modified,
    setModified,
    openFile
  } = useKReducer(reducer, actions2);
  useSaga(saga);

  /*
  usePersistance('openedResources', openedResources, rs => {
    forEach(r => openFile(r.ref), rs);
  });
  */

  const text = useMemo(
    () =>
      codeEditorStates[activeTabId]
        ? getPlainText(codeEditorStates[activeTabId])
        : '',
    [codeEditorStates, activeTabId]
  );

  const prevText = usePrevious(text);

  useEffect(() => {
    if (text !== prevText) {
      setModified(activeTabId);
    }
  }, [text !== prevText]);

  const parsed = useMemo(() => parseHue(text), [text]);

  const errors = useMemo(() => toErrors(parsed), [parsed]);

  const {
    rules,
    groups,
    scenes,
    schedules,
    lights,
    deployHsResources
  } = useHue();

  const hueData = useMemo(
    () => ({ rules, groups, scenes, lights, schedules }),
    [rules, groups, scenes, lights, schedules]
  );

  const sideBarItems = useMemo(() => getSideBarItems(hueData), [hueData]);

  const tabs = useMemo(
    () => map(r => assoc('modified', modified[r.ref], r), openedResources),
    [modified, openedResources]
  );

  const indexedTabs = useMemo(() => indexBy(prop('ref'), tabs), [tabs]);

  const indexedResources = useMemo(
    () => indexBy(prop('id'), chain(prop('items'), sideBarItems)),
    [sideBarItems]
  );

  const activeTab = useMemo(() => indexedTabs[activeTabId], [activeTabId]);

  const currentResourceInfo = useMemo(() => {
    if (activeTab && includes('/', activeTab)) {
      const [, type, id] = activeTab.split('/');
      return [type, id];
    }
    return [null, null];
  }, [activeTab]);

  const currentResourceType = useMemo(() => currentResourceInfo[0], [
    currentResourceInfo
  ]);
  const currentResourceId = useMemo(() => currentResourceInfo[1], [
    currentResourceInfo
  ]);

  const currentHueResource = useMemo(() => {
    if (currentResourceType && currentResourceId) {
      return hueData[currentResourceType][currentResourceId];
    }
    return {};
  }, [currentResourceType, currentResourceId, hueData]);

  const panesDefaults = useMemo(
    () => ({
      sp1: store.get('sp1'),
      sp2: store.get('sp2'),
      sp3: store.get('sp3')
    }),
    [activeTab]
  );

  const openTab = itemId => {
    if (!includes(itemId, openedResources)) {
      setOpenedResources(prepend(itemId, openedResources));
    }

    setActiveTabId(itemId);
  };

  const closeTab = itemId => {
    const newValue = reject(propEq('ref', itemId), openedResources);
    setOpenedResources(newValue);

    const newActiveTab = head(newValue);
    setActiveTabId(newActiveTab ? newActiveTab.ref : null);
  };

  const runRest = request => {
    fetch(`${baseApiUrl}${request.url}`, {
      method: request.method,
      body: request.body ? JSON.stringify(request.body) : null
    });
  };

  const handleEditorTextChange = useCallback(
    e => setCodeEditorState(activeTabId, e),
    [activeTabId]
  );

  return (
    <div>
      <AppBar
        onSendClick={() => deployHsResources(parsed)}
        tabs={tabs}
        activeTab={activeTabId}
        onTabClick={setActiveTabId}
        onTabCloseClick={closeTab}
      />
      <div className={styles.container} data-tid="container">
        <SplitPane
          split="horizontal"
          defaultSize={panesDefaults.sp1}
          onChange={s => store.set('sp1', s)}
        >
          <SplitPane
            split="vertical"
            defaultSize={panesDefaults.sp2}
            onChange={s => store.set('sp2', s)}
          >
            <div className={styles.sideBar}>
              <NestedList items={sideBarItems} onItemDoubleClick={openTab} />
            </div>
            {activeTab && (
              <Editor
                type={activeTab.type}
                text={codeEditorStates[activeTabId]}
                onTextChange={handleEditorTextChange}
                parsed={parsed}
                errors={errors}
                defaultSize={panesDefaults.sp3}
                onPanesChange={s => store.set('sp3', s)}
                resourceId={currentResourceId}
                resourceType={currentResourceType}
                resource={currentHueResource}
                onRunClick={runRest}
              />
            )}
          </SplitPane>
          <div style={{ height: `calc(100vh - ${panesDefaults.sp1}px)` }}>
            {true && <Terminal scope="terminal" />}
          </div>
        </SplitPane>
      </div>
    </div>
  );
});

export default Home;

// a.b.dupa('asd');
// dupa(b(a), 'asd');
