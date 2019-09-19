import React, { useCallback, useMemo, useState } from 'react';
import AppBar from '@material-ui/core/AppBar/AppBar';
import Tabs from '@material-ui/core/Tabs/Tabs';
import Tab from '@material-ui/core/Tab/Tab';
import styles from '../Home.css';
import { showHSContext } from '../../hueScript/astToBridgeState';
import { always, cond, equals, hasPath, join, map } from 'ramda';
import { either, Left } from '../../sanctuary';

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

const AstViewer = ({ baseApiUrl, effects }) => {
  const [outputView, setOutputView] = useState('state');
  const handleOutputViewChange = useCallback((e, value) => {
    setOutputView(value);
  }, []);

  const stateOutput = useMemo(() => JSON.stringify(effects, null, 2), [
    effects
  ]);

  const resolvedStream = useMemo(() => {
    return 'not supported yet';
    /*const restStream = bridgeState ? astToRest(bridgeState) : [];
    return nth(
      1,
      mapAccum(
        (p, c) => [p, evolve({ url: a => baseApiUrl + a }, c.request({}))],
        {},
        restStream || []
      )
    );*/
  }, [effects, baseApiUrl]);

  const astOutput = useMemo(() => JSON.stringify(effects, null, 2), [effects]);

  const httpOutput = useMemo(() => {
    return 'not supported yet';
    join('\n\n', map(requestToRawHttp, resolvedStream));
  }, [resolvedStream]);

  const jsonOutput = useMemo(() => {
    return 'not supported yet';
    return JSON.stringify(resolvedStream, null, 2);
  }, [effects]);

  const fetchOutput = useMemo(() => {
    return 'not supported yet';
    join('\n\n', map(requestToFetch, resolvedStream));
  }, [resolvedStream]);

  const curlOutput = useMemo(() => {
    return 'not supported yet';
    join('\n\n', map(requestToCurl, resolvedStream));
  }, [resolvedStream]);

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
