import React, { useCallback, useMemo, useState } from 'react';
import AppBar from '@material-ui/core/AppBar/AppBar';
import Tabs from '@material-ui/core/Tabs/Tabs';
import Tab from '@material-ui/core/Tab/Tab';
import styles from '../Home.css';
import {
  always,
  cond,
  equals,
  join,
  map,
  filter,
  compose,
  evolve,
  concat,
  identity,
  startsWith
} from 'ramda';

const getActionAddress = target =>
  target.type.name === 'Light'
    ? `${target.value}/action`
    : `${target.value}/action`;

const translateEffect = identity;

const requestToRawHttp = request => {
  const body = JSON.stringify(request.body);
  const url = new URL(request.address);
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
    ? `curl -X ${request.method} -H "Content-Type: application/json" -d '${body}' ${request.address}`
    : `curl -X ${request.method} ${request.address}`;
};

const requestToFetch = request => {
  const body = JSON.stringify(request.body);
  return body
    ? `fetch('${request.address}', {method: '${request.method}', body: ${body})`
    : `fetch('${request.address}', {method: '${request.method}')`;
};

const resolveUrl = baseUrl => request =>
  evolve({ address: concat(baseUrl) })(request);

const AstViewer = ({ baseApiUrl, effects, view, onViewChange }) => {
  const handleOutputViewChange = useCallback((e, value) => {
    onViewChange(value);
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
          resolveUrl(baseApiUrl)
        ),
        filter(e => !startsWith('/env', e.address), effects)
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
          resolveUrl(baseApiUrl)
        ),
        filter(e => !startsWith('/env', e.address), effects)
      )
    );
  }, [effects]);

  const curlOutput = useMemo(() => {
    return join(
      '\n\n',
      map(
        compose(
          requestToCurl,
          resolveUrl(baseApiUrl)
        ),
        filter(e => !startsWith('/env', e.address), effects)
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
      ])(view),
    [view, effects]
  );

  return (
    <div style={{ height: '100%' }}>
      <AppBar position="static">
        <Tabs
          value={view}
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
