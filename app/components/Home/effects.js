import {
  takeEvery,
  select,
  cps,
  put,
  fork,
  debounce,
  cancel,
  delay,
  take,
  call,
  getContext
} from 'redux-saga/effects';
import { asyncAction } from '@k-frame/sagas';
import {
  propEq,
  propOr,
  find,
  values,
  map,
  dissoc,
  prop,
  indexBy,
  assoc,
  pick
} from 'ramda';
import { format, formatWithCursor } from 'prettier';
import { readFile, writeFile, existsSync } from 'fs';
import { join } from 'path';
import { getHuePreferencesPath } from '../../HuePreferences';
import store from '../../appSettings';
import lights from '../../../resources/responses/lights.json';
import scenes from '../../../resources/responses/scenes.json';
import groups from '../../../resources/responses/groups.json';
import schedules from '../../../resources/responses/schedules.json';
import rules from '../../../resources/responses/rules.json';
import sensors from '../../../resources/responses/sensors.json';
import ruleToAst from '../../hueScript/ruleToAst';
import { useEffect } from 'react';
import scheduleToAst from '../../hueScript/scheduleToAst';
import { toSource } from '../../hueScript';
import parseHueAsync from './parseHueAsync';
import { cond } from '../../sanctuary';
import {
  createHSContext,
  putContextBridgeState
} from '../../hueScript/astToBridgeState';
import processHueScriptSync from './processHueScriptSync';

const { remote } = require('electron');

const { app, Menu, dialog, getCurrentWindow } = remote;

const httpPut = async (url, data) => {
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return r.json();
};

function* newFile({ payload }) {
  const fileName = join(getHuePreferencesPath(), `${new Date().valueOf()}.hue`);
  yield cps(writeFile, fileName, '');
  yield put({ type: 'fileCreated', payload: { ref: payload.id, fileName } });
}

function* openFile({ payload: fileName }) {
  try {
    console.log('openFile', fileName);
    const content = yield cps(readFile, fileName, 'utf8');
    yield put({
      type: 'fileLoaded',
      payload: { content, fileName, temp: false }
    });
  } catch (e) {
    console.error(e);
  }
}

function* importBridgeState() {
  try {
    const hueDataRef = yield getContext('hueDataRef');
    const hueData = hueDataRef.current;

    const rules = values(hueData.rules);
    const schedules = values(hueData.schedules);
    if (rules.length > 0 && schedules.length > 0) {
      const schedulesAst = map(scheduleToAst, schedules);
      const rulesAst = map(ruleToAst, rules);
      const content = format(
        toSource(
          { type: 'program', statements: [...schedulesAst, ...rulesAst] },
          { style: 'object' }
        )
      );
      const fileName = join(
        getHuePreferencesPath(),
        `${new Date().valueOf()}.hue`
      );
      yield cps(writeFile, fileName, content);
      //const fileName = 'dupa';
      yield put({
        type: 'fileLoaded',
        payload: { content, fileName, temp: true }
      });
    }
  } catch (e) {
    console.error(e);
  }
}

function* saveFileAs() {
  const { openedResources, activeTabId } = yield select(s => s);
  const defaultPath = propOr(
    'Script',
    'name',
    find(propEq('ref', activeTabId), openedResources)
  );

  const fileName = dialog.showSaveDialog(getCurrentWindow(), {
    defaultPath,
    filters: [{ name: 'Hue Script', extensions: ['hue'] }]
  });

  if (fileName) {
    const { codeEditorStates, activeTabId } = yield select(s => s);
    const content = codeEditorStates[activeTabId];
    yield cps(writeFile, fileName, content);
    yield put({
      type: 'fileSaved',
      payload: { fileName, prevFileName: activeTabId }
    });
  }
}

function* saveFile(editorRef) {
  const [selectionStart] = editorRef.current.getSelection();
  const { codeEditorStates, activeTabId, openedResources } = yield select(
    s => s
  );
  const temp = propOr(
    false,
    'temp',
    find(propEq('ref', activeTabId), openedResources)
  );
  if (!temp && existsSync(activeTabId)) {
    const content = codeEditorStates[activeTabId];
    const { formatted, cursorOffset } = formatWithCursor(content, {
      cursorOffset: selectionStart,
      singleQuote: true,
      arrowParens: 'always'
    });
    yield put({
      type: 'setCodeEditorState',
      payload: { tabId: activeTabId, state: formatted }
    });
    yield delay(100);
    editorRef.current.focus(cursorOffset);
    yield cps(writeFile, activeTabId, formatted);
    yield put({
      type: 'fileSaved',
      payload: { fileName: activeTabId, prevFileName: activeTabId }
    });
  } else {
    yield saveFileAs();
  }
}

function* debounceBy(ms, pattern, groupBy, worker) {
  const tasks = {};
  while (true) {
    const action = yield take(pattern);
    const group = groupBy(action);
    if (tasks[group]) {
      yield cancel(tasks[group]);
    }
    tasks[group] = yield fork(function*() {
      yield delay(ms);
      yield call(worker, action);
    });
  }
}

function* persistence() {
  try {
    const openedResources = store.get('openedResources');
    for (let i = 0; i < openedResources.length; i += 1) {
      const f = openedResources[i];
      if (f.type === 'file') {
        yield put({ type: 'openFile', payload: f.ref });
        yield take('fileLoaded');
      }
    }
    const currentOpenedResources = indexBy(
      prop('ref'),
      yield select(m => m.openedResources)
    );
    yield put({
      type: 'setOpenedResources',
      payload: map(
        r =>
          assoc('savedContent', currentOpenedResources[r.ref].savedContent, r),
        openedResources
      )
    });
    if (openedResources.length > 0) {
      yield put({ type: 'setActiveTabId', payload: openedResources[0].ref });
    }
    yield takeEvery(
      ['fileSaved', 'fileCreated', 'fileLoaded', 'setOpenedResources'],
      function*() {
        const { openedResources } = yield select(s => s);
        store.set(
          'openedResources',
          map(dissoc('savedContent'), openedResources)
        );
      }
    );
    yield debounceBy(
      3000,
      'setCodeEditorState',
      a => a.payload.tabId,
      function*(a) {
        const { openedResources, activeTabId } = yield select(s => s);
        const temp = propOr(
          false,
          'temp',
          find(propEq('ref', activeTabId), openedResources)
        );
        if (temp) {
          yield cps(writeFile, a.payload.tabId, a.payload.state);
        }
      }
    );
  } catch (e) {
    console.error(e);
  }
}

const delayedPromise = data =>
  new Promise(resolve => setTimeout(() => resolve(data), 300));

const getLights = () => delayedPromise(lights);
const getGroups = () => delayedPromise(groups);
const getScenes = () => delayedPromise(scenes);
const getRules = () => delayedPromise(rules);
const getSchedules = () => delayedPromise(schedules);
const getSensors = () => delayedPromise(sensors);

function* loadResources() {
  yield* asyncAction('lights', getLights);
  yield* asyncAction('groups', getGroups);
  yield* asyncAction('scenes', getScenes);
  yield* asyncAction('rules', getRules);
  yield* asyncAction('schedules', getSchedules);
  yield* asyncAction('sensors', getSensors);
}

const terminalAddLine = text =>
  put({ type: 'terminal.addLine', payload: text });
const terminalClear = () => put({ type: 'terminal.clear' });

function* runSource(source, hsContext) {
  const baseApiUrl = (yield getContext('baseApiUrlRef')).current;
  yield terminalAddLine('running ...');
  const result = processHueScriptSync(true)(hsContext)(source);
  console.log(result);
  if (result.error) {
    yield terminalAddLine(result.error);
  } else {
    for (let effect of result.effects) {
      console.log('effect', effect);
      switch (effect.name) {
        case 'clear':
          yield terminalClear();
          break;
        case 'print':
          yield terminalAddLine(effect.params.data.value);
          break;
        case 'delay':
          yield delay(effect.params.ms);
          break;
        case 'on':
          if (effect.params.target.type.name === 'Light') {
            yield httpPut(`${baseApiUrl}${effect.params.target.value}/state`, {
              on: true
            });
          } else if (effect.params.target.type.name === 'Group') {
            yield httpPut(`${baseApiUrl}${effect.params.target.value}/action`, {
              on: true
            });
          }
          break;
        case 'off':
          if (effect.params.target.type.name === 'Light') {
            yield httpPut(`${baseApiUrl}${effect.params.target.value}/state`, {
              on: false
            });
          } else if (effect.params.target.type.name === 'Group') {
            yield httpPut(`${baseApiUrl}${effect.params.target.value}/action`, {
              on: false
            });
          }
          break;
        case 'bri':
          if (effect.params.target.type.name === 'Light') {
            yield httpPut(`${baseApiUrl}${effect.params.target.value}/state`, {
              bri: effect.params.bri
            });
          } else if (effect.params.target.type.name === 'Group') {
            yield httpPut(`${baseApiUrl}${effect.params.target.value}/action`, {
              bri: effect.params.bri
            });
          }
          break;
        case 'ct':
          if (effect.params.target.type.name === 'Light') {
            yield httpPut(`${baseApiUrl}${effect.params.target.value}/state`, {
              ct: effect.params.ct
            });
          } else if (effect.params.target.type.name === 'Group') {
            yield httpPut(`${baseApiUrl}${effect.params.target.value}/action`, {
              ct: effect.params.ct
            });
          }
          break;
        default:
          console.error('not implemented effect: ', effect);
      }
    }
  }
  yield terminalAddLine('done.');
  return result;
}

function* runSelection() {
  const selectedText = (yield getContext('selectedTextRef')).current;
  const hueData = (yield getContext('hueDataRef')).current;
  const hsContext = createHSContext(hueData);

  yield runSource(selectedText, hsContext);
}

let terminalContext = null;

function* runTerminal(action) {
  const selectedText = action.payload;
  const hueData = (yield getContext('hueDataRef')).current;
  if (!terminalContext) {
    terminalContext = createHSContext(hueData);
  } else {
    terminalContext = putContextBridgeState(hueData)(terminalContext);
  }

  console.log('runTerminal', selectedText);
  const state = yield runSource(selectedText, terminalContext);
  if (!state.error) {
    terminalContext = {
      ...pick(['vars', 'infos'], state),
      effects: [],
      bridgeState: hueData
    };
  }
}

function* saga(editorRef) {
  yield takeEvery('newFile', newFile);
  yield takeEvery('openFile', openFile);
  yield takeEvery('importBridgeState', importBridgeState);
  yield takeEvery('saveFile', saveFile, editorRef);
  yield takeEvery('saveFileAs', saveFileAs);
  yield takeEvery('runSelection', runSelection);
  yield takeEvery('terminal.exec', runTerminal);
  yield fork(persistence);
  yield loadResources();
}

function* deploySaga(data) {
  const { statements } = data;
  yield put({ type: 'terminal.addLine', payload: 'start' });

  for (let i = 0; i < statements.length; i += 1) {
    const d = statements[i];

    yield put({ type: 'terminal.addLine', payload: d.name });
  }
}

export default saga;

export { deploySaga };
