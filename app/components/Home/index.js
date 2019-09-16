// @flow
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import SplitPane from 'react-split-pane';
import {
  always,
  assoc,
  compose,
  cond,
  fromPairs,
  head,
  ifElse,
  includes,
  indexBy,
  map,
  none,
  of,
  path,
  prepend,
  prop,
  propEq,
  reject,
  T
} from 'ramda';
import NestedList from '../NestedList';
import AppBar from '../AppBar';
import styles from '../Home.css';
import '../splitter.global.css';
import { parseHue, toSource } from '../../hueScript';
import store from '../../appSettings';
import Terminal, { addLine } from '../terminal';
import ResourceViewer from '../resourceViewer';
import { useTransition, animated } from 'react-spring';
import { Scope, useKReducer } from '@k-frame/core';
import { useSagaRunner } from '@k-frame/sagas';
import HSEditor from '../hueScriptEditor';
import saga from './effects';
import useDebounce from '../../helpers/useDebounce';
import getSideBarItems from './getSideBarItems';
import actions from './actions';
import reducer from './reducer';
import useHueData from './useHueData';
import AstViewer from '../astViewer';
import {
  createEmptyContext,
  translateProgram
} from '../../hueScript/astToBridgeState';
import { either, chain, maybeToNullable } from '../../sanctuary';

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
  defaultSize,
  onPanesChange,
  inputRef,
  metaPressed,
  args,
  baseApiUrl
}) => {
  const debouncedText = useDebounce(text, 200);

  const parsed = useMemo(() => parseHue(debouncedText), [debouncedText]);

  const { state, infos } = useMemo(() => {
    const context = createEmptyContext();
    const state = chain(p => translateProgram(p)(context))(parsed);
    return {
      state,
      infos: context.infos
    };
  }, [parsed]);

  const errors = useMemo(() => {
    return either(v => {
      const location =
        v.location && v.location.value
          ? maybeToNullable(v.location)
          : v.location;
      return location && location.start ? [location] : [];
    })(() => [])(state);
  }, [parsed, state]);

  const transitions = useTransition(parsed.error, null, {
    from: { opacity: 0, color: 'red' },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  });

  const lastErrorRef = useRef(parsed.error);
  useEffect(() => {
    if (parsed.error) {
      lastErrorRef.current = parsed.error;
    }
  });

  return (
    <SplitPane
      split="vertical"
      defaultSize={defaultSize}
      onChange={onPanesChange}
      pane1Style={{ overflow: 'scroll' }}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          flexDirection: 'column'
        }}
      >
        <div style={{ flex: 1 }}>
          <HSEditor
            value={text}
            onValueChange={onTextChange}
            padding={10}
            errors={errors}
            ref={inputRef}
            metaPressed={metaPressed}
            args={{ ...args, infos }}
          />
        </div>
        {transitions.map(
          ({ item, key, props }) =>
            item && (
              <animated.div key={key} style={props}>
                {parsed.error && parsed.error.message}
              </animated.div>
            )
        )}
      </div>
      <AstViewer baseApiUrl={baseApiUrl} bridgeState={state} />
    </SplitPane>
  );
};

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

  const vars = {};

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

  const runRest = async ast => {
    /*const requests = astToRest(ast);
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i].request({});
      const response = await fetch(`${baseApiUrl}${request.url}`, {
        method: request.method,
        body: request.body ? JSON.stringify(request.body) : null
      });
      const data = await response.json();
      addTerminalLine(JSON.stringify(data));
    }*/
  };

  const handleEditorTextChange = useCallback(
    e => setCodeEditorState(activeTabId, e),
    [activeTabId]
  );

  const startDeploy = async () => {
    if (parsed.data) {
    }
  };

  const handleKeyDown = useCallback(e => {
    if (e.keyCode === 91 || e.keyCode === 17) {
      toggleEditorMode(true);
    }
  }, []);

  const handleKeyUp = useCallback(e => {
    if (e.keyCode === 91 || e.keyCode === 17) {
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
                baseApiUrl={baseApiUrl}
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
