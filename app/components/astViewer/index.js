import React, { useCallback, useMemo, useState } from 'react';
import AppBar from '@material-ui/core/AppBar/AppBar';
import Tabs from '@material-ui/core/Tabs/Tabs';
import Tab from '@material-ui/core/Tab/Tab';
import styles from '../Home.css';
import {
  always,
  cond,
  equals,
  hasPath,
  join,
  map,
  propEq,
  T,
  compose,
  evolve,
  concat
} from 'ramda';

const getActionAddress = target =>
  target.type.name === 'Light'
    ? `${target.value}/action`
    : `${target.value}/action`;

const translateOn = ({ params: { target } }) => {
  return {
    url: getActionAddress(target),
    method: 'PUT',
    body: {
      on: true
    }
  };
};

const translateBri = ({ params: { target, bri } }) => {
  return {
    url: getActionAddress(target),
    method: 'PUT',
    body: {
      state: {
        bri
      }
    }
  };
};

const translateEffect = cond([
  [propEq('name', 'on'), translateOn],
  [propEq('name', 'bri'), translateBri],
  [T, always({ error: 'missing translation' })]
]);

const requestToRawHttp = request => {
  const body = JSON.stringify(request.body);
  const url = new URL(request.url);
  return body
    ? `${request.method} ${url.pathname} HTTP/1.1
Host: ${url.hostname}
Content-type: application/json
Content-length: ${body.length}

${body}`
    : `${request.method} ${url.pathname} HTTP/1.1
Host: ${url.hostname}
Content-length: 0`;
};

const requestToCurl = request => {
  const body = JSON.stringify(request.body);
  return body
    ? `curl -X ${request.method} -H "Content-Type: application/json" -d '${body}' ${request.url}`
    : `curl -X ${request.method} ${request.url}`;
};

const requestToFetch = request => {
  const body = JSON.stringify(request.body);
  return body
    ? `fetch('${request.url}', {method: '${request.method}', body: ${body})`
    : `fetch('${request.url}', {method: '${request.method}')`;
};

const resolveUrl = baseUrl => request =>
  evolve({ url: concat(baseUrl) })(request);

const AstViewer = ({ baseApiUrl, effects }) => {
  const [outputView, setOutputView] = useState('state');
  const handleOutputViewChange = useCallback((e, value) => {
    setOutputView(value);
  }, []);

  const stateOutput = useMemo(() => JSON.stringify(effects, null, 2), [
    effects
  ]);

  const astOutput = useMemo(
    () => JSON.stringify(map(translateEffect, effects), null, 2),
    [effects]
  );

  const httpOutput = useMemo(() => {
    return join(
      '\n\n',
      map(
        compose(
          requestToRawHttp,
          resolveUrl(baseApiUrl),
          translateEffect
        ),
        effects
      )
    );
  }, [effects]);

  const jsonOutput = useMemo(() => {
    return JSON.stringify(map(translateEffect, effects), null, 2);
  }, [effects]);

  const fetchOutput = useMemo(() => {
    return join(
      '\n\n',
      map(
        compose(
          requestToFetch,
          resolveUrl(baseApiUrl),
          translateEffect
        ),
        effects
      )
    );
  }, [effects]);

  const curlOutput = useMemo(() => {
    return join(
      '\n\n',
      map(
        compose(
          requestToCurl,
          resolveUrl(baseApiUrl),
          translateEffect
        ),
        effects
      )
    );
  }, [map(translateEffect, effects)]);

  const output = useMemo(
    () =>
      cond([
        [equals('ast'), always(astOutput)],
        [equals('state'), always(stateOutput)],
        [equals('json'), always(jsonOutput)],
        [equals('fetch'), always(fetchOutput)],
        [equals('curl'), always(curlOutput)],
        [equals('http'), always(httpOutput)]
      ])(outputView),
    [outputView, effects]
  );

  return (
    <div style={{ height: '100%' }}>
      <AppBar position="static">
        <Tabs
          value={outputView}
          onChange={handleOutputViewChange}
          variant="fullWidth"
        >
          <Tab label="Ast" value="ast" style={{ minWidth: 0 }} />
          <Tab label="State" value="state" style={{ minWidth: 0 }} />
          <Tab label="JSON" value="json" style={{ minWidth: 0 }} />
          <Tab label="fetch" value="fetch" style={{ minWidth: 0 }} />
          <Tab label="cURL" value="curl" style={{ minWidth: 0 }} />
          <Tab label="HTTP" value="http" style={{ minWidth: 0 }} />
        </Tabs>
      </AppBar>
      <pre
        className={styles.codeSimple}
        style={{
          whiteSpace: 'pre-wrap',
          height: 'calc(100% - 74px)',
          overflow: 'scroll'
        }}
      >
        {output}
      </pre>
    </div>
  );
};

export default AstViewer;
