import React from 'react';
import { clientId, clientSecret } from '../../config';
import { remote } from 'electron';

const authUrl =
  'https://api.meethue.com/oauth2/auth?clientid=Ao4BMNUK4pc0DMom2A44bADwlrNsGeUl&appid=hue_studio&deviceid=001&devicename=Test&state=dupa&response_type=code';

let authWindow = { current: null };

const remoteAuth = () =>
  new Promise((resolve, reject) => {
    if (authWindow.current) {
      authWindow.current.close();
    }
    const parent = remote.getCurrentWindow();
    authWindow.current = new remote.BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        webSecurity: false,
        devTools: false
      },
      parent
    });

    authWindow.current.loadURL(authUrl);
    authWindow.current.show();
    // 'will-navigate' is an event emitted when the window.location changes
    // newUrl should contain the tokens you need
    authWindow.current.webContents.on(
      'will-navigate',
      async (event, newUrl) => {
        const url = new URL(newUrl);
        console.log('navigate', url);
        if (url.host === 'localhost' && url.pathname === '/callback') {
          const code = url.searchParams.get('code');
          console.log('code', code);

          if (code) {
            const r = await fetch(
              `https://api.meethue.com/oauth2/token?code=${code}&grant_type=authorization_code`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`
                }
              }
            );
            authWindow.current.close();
            const token = await r.json();

            resolve(token);
          } else {
            reject();
            authWindow.current.close();
          }
        }
      }
    );

    authWindow.current.on('closed', function() {
      authWindow.current = null;
    });
  });

export default remoteAuth;
