// @flow
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { emptyReducer } from '@k-frame/core';
import { scopedSagaMiddleware } from '@k-frame/sagas';
import { createLogger } from 'redux-logger';
import type { counterStateType } from '../reducers/types';

const logger = createLogger({
  level: 'info',
  collapsed: true
});

const enhancer = applyMiddleware(logger, thunk, scopedSagaMiddleware);

function configureStore(initialState?: counterStateType) {
  return createStore<*, counterStateType, *>(emptyReducer, enhancer);
}

export default { configureStore };
