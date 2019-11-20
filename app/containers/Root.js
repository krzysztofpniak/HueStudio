// @flow
import React, { useEffect } from 'react';
import { MemoryRouter as Router } from 'react-router';
import { KProvider } from '@k-frame/core';
import { scopedSagaMiddleware } from '@k-frame/sagas';
import Routes from '../Routes';
import { ThemeProvider } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core';

const { remote } = require('electron');

const { app, Menu, dialog, getCurrentWindow } = remote;

type Props = {
  store: Store,
  history: {}
};

let ids = 0;

const getId = () => {
  ids += 1;
  return '' + ids;
};

const getTemplate = store => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click() {
            store.dispatch({ type: 'home.newFile', payload: { id: getId() } });
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            const result = dialog.showOpenDialog(getCurrentWindow(), {
              properties: ['openFile']
            });
            if (result && result.length === 1) {
              store.dispatch({ type: 'home.openFile', payload: result[0] });
            }
          }
        },
        {
          label: 'Import from bridge',
          click: () => {
            store.dispatch({
              type: 'home.importBridgeState',
              payload: { id: getId() }
            });
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click() {
            store.dispatch({ type: 'home.saveFile', payload: {} });
          }
        },
        {
          label: 'Save as',
          click() {
            store.dispatch({ type: 'home.saveFileAs', payload: {} });
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'Run',
      submenu: [
        {
          label: 'Run Selection',
          accelerator: 'CmdOrCtrl+Shift+E',
          click() {
            store.dispatch({
              type: 'home.runSelection'
            });
          }
        }
      ]
    }
  ];
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Edit menu
    template[2].submenu.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }]
      }
    );
  }
  return template;
};

const theme = createMuiTheme({
  overrides: {
    MuiToolbar: {
      root: {
        minHeight: '36px'
      },
      dense: {
        minHeight: '36px'
      },
      gutters: {
        paddingLeft: 0
      }
    },
    MuiTabs: {
      root: {
        minHeight: '36px'
      }
    },
    MuiTab: {
      root: {
        minHeight: '36px'
      }
    },
    MuiIconButton: {
      sizeSmall: {
        padding: 0
      }
    },
    PrivateTabIndicator: {
      root: {
        mixBlendMode: 'color',
        height: '36px',
        pointerEvents: 'none'
      }
    },
    MuiSlider: {
      markLabel: {
        transform: 'translate(1px, -40px) rotate(-40deg)',
        transformOrigin: 'left'
      }
    }
  }
});

const Root = ({ store }) => {
  useEffect(() => {
    const menu = Menu.buildFromTemplate(getTemplate(store));
    Menu.setApplicationMenu(menu);
  }, []);
  return (
    <KProvider store={store} runSaga={scopedSagaMiddleware.run}>
      <ThemeProvider theme={theme}>
        <Router>
          <Routes />
        </Router>
      </ThemeProvider>
    </KProvider>
  );
};

export default Root;
