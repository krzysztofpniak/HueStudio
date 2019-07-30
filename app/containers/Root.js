// @flow
import React, { useEffect } from 'react';
import { MemoryRouter as Router } from 'react-router';
import { KProvider } from '@k-frame/core';
import { scopedSagaMiddleware } from '@k-frame/sagas';
import type { Store } from '../reducers/types';
import Routes from '../Routes';

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

const Root = ({ store }) => {
  useEffect(() => {
    const menu = Menu.buildFromTemplate(getTemplate(store));
    Menu.setApplicationMenu(menu);
  }, []);
  return (
    <KProvider store={store} runSaga={scopedSagaMiddleware.run}>
      <Router>
        <Routes />
      </Router>
    </KProvider>
  );
};

export default Root;
