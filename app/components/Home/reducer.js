import {
  createPayloadReducer,
  createReducer,
  handleAsyncs
} from '@k-frame/core';
import {
  always,
  assoc,
  assocPath,
  compose,
  curry,
  evolve,
  identity,
  keys,
  map,
  prepend,
  propEq,
  reduce,
  reject,
  when
} from 'ramda';
import { basename } from 'path';
import actions2 from './actions';

const renameKeys = curry((keysMap, obj) =>
  reduce((acc, key) => assoc(keysMap[key] || key, obj[key], acc), {}, keys(obj))
);

const reducer = createReducer(
  {
    codeEditorStates: {},
    currentFileName: '',
    openedResources: [],
    activeTabId: null,
    metaPressed: false
  },
  [
    createPayloadReducer(actions2.setCodeEditorState, ({ tabId, state }) =>
      assocPath(['codeEditorStates', tabId], state)
    ),
    createPayloadReducer(actions2.fileLoaded, ({ content, fileName }) =>
      evolve({
        codeEditorStates: assoc(fileName, content),
        openedResources: compose(
          prepend({
            type: 'file',
            ref: fileName,
            name: basename(fileName),
            temp: false,
            savedContent: content
          }),
          reject(propEq('ref', fileName))
        ),
        activeTabId: always(fileName)
      })
    ),
    createPayloadReducer(actions2.newFile, ({ id }) =>
      evolve({
        codeEditorStates: assoc(id, ''),
        openedResources: prepend({
          type: 'file',
          ref: id,
          temp: true,
          name: `${id} Hue Script.hue`,
          savedContent: ''
        }),
        activeTabId: always(id)
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
    createPayloadReducer(
      actions2.fileSaved,
      ({ fileName, prevFileName }) => state =>
        evolve(
          {
            codeEditorStates:
              fileName !== prevFileName
                ? renameKeys({ [prevFileName]: fileName })
                : identity,
            openedResources: map(r =>
              r.ref === prevFileName
                ? {
                    ...r,
                    ref: fileName,
                    name: basename(fileName),
                    temp: false,
                    savedContent: state.codeEditorStates[prevFileName]
                  }
                : r
            ),
            activeTabId: always(fileName)
          },
          state
        )
    ),
    createPayloadReducer(actions2.toggleEditorMode, assoc('metaPressed')),
    handleAsyncs({
      lights: { defaultValue: [] },
      groups: { defaultValue: [] },
      scenes: { defaultValue: [] },
      rules: { defaultValue: [] },
      schedules: { defaultValue: [] },
      sensors: { defaultValue: [] }
    })
  ]
);

export default reducer;
