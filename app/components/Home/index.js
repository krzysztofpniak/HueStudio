// @flow
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import SplitPane from 'react-split-pane';
import {
  addIndex,
  always,
  assoc,
  chain,
  compose,
  cond,
  evolve,
  filter,
  fromPairs,
  hasPath,
  head,
  identity,
  ifElse,
  includes,
  indexBy,
  join,
  map,
  none,
  objOf,
  of,
  path,
  pathOr,
  prepend,
  prop,
  propEq,
  reject,
  T,
  toPairs,
  tryCatch,
  values
} from 'ramda';
import NestedList from '../NestedList';
import AppBar from '../AppBar';
import styles from '../Home.css';
import '../splitter.global.css';
import { parseHue, toSource } from '../../hueScript';
import store from '../../appSettings';
import Terminal, { addLine } from '../terminal';
import ResourceViewer from '../resourceViewer';
import { format } from 'prettier';
import {
  createAction,
  createPayloadReducer,
  createReducer,
  createStateReducer,
  handleAsyncs,
  Scope,
  useKReducer,
  usePrevious,
  withScope
} from '@k-frame/core';
import { useSagaRunner } from '@k-frame/sagas';
import HSEditor from '../hueScriptEditor';
import saga, { deploySaga } from './effects';
import { withStyles } from '@material-ui/core';
import { handle } from '../../hueTranslator';
import useDebounce from '../../helpers/useDebounce';
import getSideBarItems from './getSideBarItems';
import actions from './actions';
import reducer from './reducer';
import ruleToAst from '../../hueScript/ruleToAst';
import scheduleToAst from '../../hueScript/scheduleToAst';
import useHueData from './useHueData';

const filterWithKey = addIndex(filter);
const mapWithKey = addIndex(map);

const get = async url => {
  const r = await fetch(url);
  return r.json();
};

const remove = async url => {
  const r = await fetch(url, {
    method: 'DELETE'
  });
  return r.json();
};

const post = async (url, data) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return r.json();
};

const put = async (url, data) => {
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return r.json();
};

const baseApiPath = 'api/YOUR_BRIDGE_USERNAME';

const baseApiUrl = `http://192.168.0.13/${baseApiPath}`;

const RuleEditor = ({
  text,
  onTextChange,
  parsed,
  errors,
  defaultSize,
  onPanesChange,
  inputRef,
  metaPressed,
  args
}) => {
  const json = useMemo(
    () =>
      parsed.data ? JSON.stringify(parsed.data, null, 2) : parsed.error.message,
    [parsed]
  );

  return (
    <SplitPane
      split="vertical"
      defaultSize={defaultSize}
      onChange={onPanesChange}
      pane1Style={{ overflow: 'scroll' }}
    >
      <HSEditor
        value={text}
        onValueChange={onTextChange}
        padding={10}
        errors={errors}
        ref={inputRef}
        metaPressed={metaPressed}
        args={args}
      />
      <textarea className={styles.code} value={json} readOnly />
    </SplitPane>
  );
};

const toErrors = ifElse(
  hasPath(['error', 'location']),
  compose(
    of,
    path(['error', 'location'])
  ),
  always([])
);

const withStaticScope = scope => BaseComponent => props => (
  <Scope scope={scope}>
    <BaseComponent {...props} />
  </Scope>
);

const render = Component => props => <Component {...props} />;

const Editor = cond([
  [propEq('type', 'file'), render(RuleEditor)],
  [propEq('type', 'resource'), render(ResourceViewer)],
  [T, always('Open a file or resource')]
]);

const Home = withStaticScope('home')(() => {
  const {
    codeEditorStates,
    setCodeEditorState,
    openedResources,
    setOpenedResources,
    activeTabId,
    setActiveTabId,
    addTerminalLine,
    metaPressed,
    toggleEditorMode,
    data
  } = useKReducer(reducer, actions);
  const editorRef = useRef();

  const text = useMemo(
    () => (codeEditorStates[activeTabId] ? codeEditorStates[activeTabId] : ''),
    [codeEditorStates, activeTabId]
  );

  const debouncedText = useDebounce(text, 500);

  const parsed = useMemo(() => parseHue(debouncedText), [debouncedText]);

  const vars = useMemo(() => pathOr([], ['data', 'vars'], parsed), [parsed]);

  const errors = useMemo(() => toErrors(parsed), [parsed]);

  const hueData = useHueData(data);

  const hueDataRef = useRef(hueData);

  useEffect(() => {
    hueDataRef.current = hueData;
  });

  const { fork } = useSagaRunner({ hueDataRef });

  useEffect(() => {
    fork(saga, editorRef);
  }, []);

  const sideBarItems = useMemo(() => getSideBarItems(hueData), [hueData]);

  const modified2 = useMemo(
    () =>
      fromPairs(
        map(
          r => [r.ref, r.savedContent !== codeEditorStates[r.ref]],
          openedResources
        )
      ),
    [openedResources, codeEditorStates]
  );

  const tabs = useMemo(
    () => map(r => assoc('modified', modified2[r.ref], r), openedResources),
    [modified2, openedResources]
  );

  const indexedTabs = useMemo(() => indexBy(prop('ref'), tabs), [tabs]);

  const activeTab = useMemo(() => indexedTabs[activeTabId], [activeTabId]);

  const currentResourceInfo = useMemo(() => {
    if (
      activeTab &&
      activeTab.type === 'resource' &&
      includes('/', activeTab.ref)
    ) {
      const [, type, id] = activeTab.ref.split('/');
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
    if (includes('/', itemId)) {
      const [, type, id] = itemId.split('/');
      const resource = hueData[type][id];
      if (none(propEq('ref', itemId), openedResources)) {
        setOpenedResources(
          prepend(
            { type: 'resource', ref: itemId, name: resource.name },
            openedResources
          )
        );
      }
      setActiveTabId(itemId);
    }
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

  const startDeploy = () => {
    if (parsed.data) {
      fork(deploySaga, parsed.data);
    }
  };

  const handleKeyDown = useCallback(e => {
    if (e.keyCode === 91) {
      toggleEditorMode(true);
    }
  }, []);

  const handleKeyUp = useCallback(e => {
    if (e.keyCode === 91) {
      toggleEditorMode(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const debugText0 = useMemo(() => {
    try {
      const vars = {};

      for (let i = 0; i < parsed.data.statements.length; i += 1) {
        const d = parsed.data.statements[i];
        if (d.type === 'const') {
          vars[d.name] = d.value;
        }
        console.log('vars', vars);
        if (d.name === 'handle') {
          const result = handle(d, vars);

          return { data: result };
        }
      }
    } catch (e) {
      return { error: e };
    }
  }, [parsed]);

  const debugText = parsed;

  return (
    <div>
      <AppBar
        onSendClick={startDeploy}
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
                activeTab={activeTabId}
                text={codeEditorStates[activeTabId]}
                onTextChange={handleEditorTextChange}
                parsed={debugText}
                errors={errors}
                defaultSize={panesDefaults.sp3}
                onPanesChange={s => store.set('sp3', s)}
                resourceId={currentResourceId}
                resourceType={currentResourceType}
                resource={currentHueResource}
                onRunClick={runRest}
                inputRef={editorRef}
                metaPressed={metaPressed}
                args={{ vars, editorRef }}
                hueData={hueData}
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
