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
  call
} from 'redux-saga/effects';
import { propEq, propOr, find } from 'ramda';
import { readFile, writeFile, existsSync } from 'fs';
import { join } from 'path';
import { getPlainText } from '../codeEditor';
import { getHuePreferencesPath } from '../../HuePreferences';
import store from '../../appSettings';

const { remote } = require('electron');

const { app, Menu, dialog, getCurrentWindow } = remote;

function* newFile({ payload }) {
  const fileName = join(getHuePreferencesPath(), `${new Date().valueOf()}.hue`);
  yield cps(writeFile, fileName, '');
  yield put({ type: 'fileCreated', payload: { ref: payload.id, fileName } });
}

function* openFile({ payload: fileName }) {
  const content = yield cps(readFile, fileName, 'utf8');
  yield put({ type: 'fileLoaded', payload: { content, fileName } });
}

function* saveFileAs(prevFileName) {
  const { openedResources } = yield select(s => s);
  const defaultPath = propOr(
    'Script',
    'name',
    find(propEq('ref', prevFileName), openedResources)
  );

  const fileName = dialog.showSaveDialog(getCurrentWindow(), {
    defaultPath,
    filters: [{ name: 'Hue Script', extensions: ['hue'] }]
  });

  if (fileName) {
    const { codeEditorStates, activeTabId } = yield select(s => s);
    const content = getPlainText(codeEditorStates[activeTabId]);
    yield cps(writeFile, fileName, content);
    yield put({ type: 'fileSaved', payload: { fileName, prevFileName } });
  }
}

function* saveFile() {
  const { codeEditorStates, activeTabId, openedResources } = yield select(
    s => s
  );
  const temp = propOr(
    false,
    'temp',
    find(propEq('ref', activeTabId), openedResources)
  );
  if (!temp && existsSync(activeTabId)) {
    const content = getPlainText(codeEditorStates[activeTabId]);
    yield cps(writeFile, activeTabId, content);
    yield put({
      type: 'fileSaved',
      payload: { fileName: activeTabId, prevFileName: activeTabId }
    });
  } else {
    yield saveFileAs(activeTabId);
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
  const openedResources = store.get('openedResources');
  for (let i = 0; i < openedResources.length; i += 1) {
    const f = openedResources[i];
    yield put({ type: 'openFile', payload: f.ref });
    yield take('fileLoaded');
  }
  yield put({ type: 'setOpenedResources', payload: openedResources });
  yield takeEvery(
    ['fileSaved', 'fileCreated', 'fileLoaded', 'setOpenedResources'],
    function*() {
      const { openedResources } = yield select(s => s);
      store.set('openedResources', openedResources);
    }
  );
  yield debounceBy(5000, 'setCodeEditorState', a => a.payload.tabId, function*(
    a
  ) {
    yield cps(writeFile, a.payload.tabId, getPlainText(a.payload.state));
  });
}

function* saga() {
  yield takeEvery('newFile', newFile);
  yield takeEvery('openFile', openFile);
  yield takeEvery('saveFile', saveFile);
  yield takeEvery('saveFileAs', saveFileAs);
  yield fork(persistence);
}

export default saga;
