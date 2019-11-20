import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { emptyReducer } from '@k-frame/core';
import { scopedSagaMiddleware } from '@k-frame/sagas';
import { createLogger } from 'redux-logger';
import * as counterActions from '../actions/counter';
import type { counterStateType } from '../reducers/types';

const configureStore = (initialState?: counterStateType) => {
  // Redux Configuration
  const middleware = [];
  const enhancers = [];

  // Thunk Middleware
  middleware.push(thunk);

  // Logging Middleware
  const logger = createLogger({
    level: 'info',
    collapsed: true
  });

  // Skip redux logs in console during the tests
  if (process.env.NODE_ENV !== 'test') {
    //middleware.push(logger);
  }

  // Router Middleware
  middleware.push(scopedSagaMiddleware);

  // Redux DevTools Configuration
  const actionCreators = {
    ...counterActions
  };
  // If Redux DevTools Extension is installed use it, otherwise use Redux compose
  /* eslint-disable no-underscore-dangle */
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        // Options: http://extension.remotedev.io/docs/API/Arguments.html
        actionCreators
      })
    : compose;
  /* eslint-enable no-underscore-dangle */

  // Apply Middleware & Compose Enhancers
  enhancers.push(applyMiddleware(...middleware));
  const enhancer = composeEnhancers(...enhancers);

  return createStore(emptyReducer, enhancer);
};

export default { configureStore };
