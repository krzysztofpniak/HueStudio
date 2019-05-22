import React from 'react';
import { Route } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import HomePage from './containers/HomePage';
import CounterPage from './containers/CounterPage';

export default () => (
  <App>
    <Route path={routes.HOME} exact component={HomePage} />
    <Route path={routes.COUNTER} component={CounterPage} />
  </App>
);
