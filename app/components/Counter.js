// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Counter.css';
import routes from '../constants/routes';
import Toolbar from '@material-ui/core/Toolbar/Toolbar';
import AppBar from '@material-ui/core/AppBar/AppBar';
import Typography from '@material-ui/core/Typography/Typography';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';

type Props = {
  increment: () => void,
  incrementIfOdd: () => void,
  incrementAsync: () => void,
  decrement: () => void,
  counter: number
};

export default class Counter extends Component<Props> {
  props: Props;

  render() {
    const {
      increment,
      incrementIfOdd,
      incrementAsync,
      decrement,
      counter
    } = this.props;
    return (
      <div>
        <AppBar position="static">
          <Toolbar variant="dense">
            <Typography variant="h5">Settings</Typography>
            <div style={{ flex: 1 }} />
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              component={Link}
              to={routes.HOME}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        Settings
      </div>
    );
  }
}
