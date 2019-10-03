// @flow
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import SplitPane from 'react-split-pane';
import {
  always,
  assoc,
  compose,
  cond,
  dissoc,
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
import store from '../../appSettings';
import Terminal, { addLine } from '../terminal';
import ResourceViewer from '../resourceViewer';
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
import parseHueAsync from './parseHueAsync';
import { createHSContext } from '../../hueScript/astToBridgeState';

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
  baseApiUrl,
  hueData,
  onSelect
}) => {
  const [view, setView] = useState('state');
  const debouncedText = useDebounce(text, 200);
  const [{ error, errorLocations, effects, infos }, setParseResult] = useState({
    error: null,
    errorLocations: [],
    effects: [],
    infos: {}
  });

  const debouncedHueData = useDebounce(hueData, 2000);

  useEffect(() => {
    parseHueAsync({
      source: debouncedText,
      hsContext: createHSContext(debouncedHueData)
    }).then(setParseResult);
  }, [debouncedText, debouncedHueData]);

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
            errors={errorLocations}
            ref={inputRef}
            metaPressed={metaPressed}
            args={{ ...args, infos }}
            onSelect={onSelect}
          />
        </div>
      </div>
      {error ? (
        <div style={{ padding: 10, color: 'red' }}>{error}</div>
      ) : (
        <AstViewer
          baseApiUrl={baseApiUrl}
          effects={effects}
          view={view}
          onViewChange={setView}
        />
      )}
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

  const [selection, setSelection] = useState({
    start: 0,
    end: 0
  });

  const selectedText = useMemo(
    () => text.substring(selection.start, selection.end),
    [text, selection]
  );

  console.log('selectedText', selectedText);

  const vars = {};

  const hueData = useHueData(data);

  const hueDataRef = useRef(hueData);
  const selectedTextRef = useRef(selectedText);
  const baseApiUrlRef = useRef(baseApiUrl);

  useEffect(() => {
    hueDataRef.current = hueData;
    selectedTextRef.current = selectedText;
    baseApiUrlRef.current = baseApiUrl;
  });

  const { fork } = useSagaRunner({
    hueDataRef,
    selectedTextRef,
    baseApiUrlRef
  });

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
                onSelect={setSelection}
              />
            )}
          </SplitPane>
          <div
            style={{
              height: '100%',
              width: '100%',
              position: 'absolute'
            }}
          >
            <Terminal scope="terminal" />
          </div>
        </SplitPane>
      </div>
    </div>
  );
});

export default Home;
