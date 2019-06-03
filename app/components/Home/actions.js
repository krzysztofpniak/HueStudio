import { createAction } from '@k-frame/core';
import { addLine } from '../terminal';

const wrapActionCreator = (fn, ...types) => (...args) => {
  const action = fn(...args);
  return {
    ...action,
    type: `${types.join('.')}.${action.type}`
  };
};

const addTerminalLine2 = wrapActionCreator(addLine, 'terminal');

const actions = {
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
  toggleEditorMode: createAction('toggleEditorMode'),
  addTerminalLine: addTerminalLine2
};

export default actions;
