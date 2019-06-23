import React, { useEffect, useMemo, useState } from 'react';
import {
  find,
  map,
  propEq,
  toPairs,
  includes,
  filter,
  addIndex,
  values,
  startsWith,
  any,
  prop,
  sortBy,
  none
} from 'ramda';
import SplitPane from 'react-split-pane';
import styles from '../Home.css';
import Select from '@material-ui/core/Select/Select';
import MenuItem from '@material-ui/core/MenuItem/MenuItem';
import Button from '@material-ui/core/Button/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Edge from './edge';
import ScalableGraph from '../scalableGraph';
const ELK = require('elkjs');
const elk = new ELK();
const mapWithKey = addIndex(map);

const actions = {
  lights: [
    {
      id: 'on',
      name: 'On',
      requestCreator: (resourceId, data) => ({
        url: `/lights/${resourceId}/state`,
        method: 'PUT',
        body: {
          on: true
        }
      }),
      codeCreator: (resourceId, data) => `light(${resourceId}).on();`
    },
    {
      id: 'off',
      name: 'Off',
      requestCreator: (resourceId, data) => ({
        url: `/lights/${resourceId}/state`,
        method: 'PUT',
        body: {
          on: false
        }
      }),
      codeCreator: (resourceId, data) => `light(${resourceId}).off();`
    },
    {
      id: 'alert',
      name: 'Alert',
      requestCreator: (resourceId, data) => ({
        url: `/lights/${resourceId}/state`,
        method: 'PUT',
        body: {
          alert: 'select'
        }
      }),
      codeCreator: (resourceId, data) => `light(${resourceId}).alert('select);`
    },
    {
      id: 'effect1',
      name: 'Effect Loop',
      requestCreator: (resourceId, data) => ({
        url: `/lights/${resourceId}/state`,
        method: 'PUT',
        body: {
          effect: 'colorloop'
        }
      }),
      codeCreator: (resourceId, data) =>
        `light(${resourceId}).effect('colorloop);`
    },
    {
      id: 'effect2',
      name: 'Effect None',
      requestCreator: (resourceId, data) => ({
        url: `/lights/${resourceId}/state`,
        method: 'PUT',
        body: {
          effect: 'none'
        }
      }),
      codeCreator: (resourceId, data) => `light(${resourceId}).effect('none);`
    }
  ],
  groups: [
    {
      id: 'on',
      name: 'On',
      requestCreator: (resourceId, data) => ({
        url: `/groups/${resourceId}/action`,
        method: 'PUT',
        body: {
          on: true
        }
      }),
      codeCreator: (resourceId, data) => `group(${resourceId}).on();`
    },
    {
      id: 'off',
      name: 'Off',
      requestCreator: (resourceId, data) => ({
        url: `/groups/${resourceId}/action`,
        method: 'PUT',
        body: {
          on: false
        }
      }),
      codeCreator: (resourceId, data) => `group(${resourceId}).off();`
    },
    {
      id: 'alert',
      name: 'Alert',
      requestCreator: (resourceId, data) => ({
        url: `/groups/${resourceId}/action`,
        method: 'PUT',
        body: {
          alert: 'select'
        }
      }),
      codeCreator: (resourceId, data) => `group(${resourceId}).alert('select');`
    }
  ]
};

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    height: '100%'
  }
}));

function TabContainer({ children }) {
  return (
    <Typography
      component="div"
      style={{
        padding: 8 * 3,
        height: 'calc(100% - 24px)',
        boxSizing: 'border-box'
      }}
    >
      {children}
    </Typography>
  );
}

const getEmptyGraph = (children = [], edges = []) => ({
  id: 'root',
  layoutOptions: { 'elk.algorithm': 'layered' },
  children,
  edges
});

const tileSize = {
  width: 150,
  height: 30
};

const dfs = (hueData, v, onVisitNode, onVisitEdge) => {
  const { edges, getAdjacents } = hueData;
  const s = [];
  const discovered = {};
  s.push(v);
  while (s.length > 0) {
    v = s.pop();
    if (!discovered[v.ref]) {
      discovered[v.ref] = true;
      onVisitNode(v);
      const adjacentEdges = getAdjacents(v);
      for (let i = 0; i < adjacentEdges.length; i++) {
        const e = adjacentEdges[i];
        if (e.node) {
          onVisitEdge(v, e.node);
          s.push(e.node);
        } else {
          console.error('not found', e.ref);
        }
      }
    }
  }
};

const dfs2 = (hueData, v, onVisitNode, onVisitEdge) => {
  const { getAdjacents } = hueData;
  onVisitNode(v);
  const adjacentEdges = getAdjacents(v);
  for (let i = 0; i < adjacentEdges.length; i++) {
    const e = adjacentEdges[i];
    if (e.node) {
      onVisitEdge(v, e.node);
      onVisitNode(e.node);
    } else {
      const fakeNode = {
        ref: e.ref,
        name: `Not found: ${e.ref}`,
        hasError: true
      };
      onVisitEdge(v, fakeNode);
      onVisitNode(fakeNode);
      console.error('not found', v.ref, e.ref);
    }
  }
};

const Graph = ({ transform, data }) => (
  <g>
    {mapWithKey(
      ({ x, y, width, height, name }, key) => (
        <g transform={`translate(${x},${y})`} key={key}>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={4}
            ry={4}
            style={{ stroke: '#f87d42', strokeWidth: 1, fill: '#fff' }}
          />
          <g transform={`scale(${transform.k})`}>
            <text x={5} y={10} fontSize={8}>
              {name}
            </text>
          </g>
        </g>
      ),
      data.nodes
    )}
    {mapWithKey(
      (e, key) => (
        <Edge
          key={key}
          sX={e.sX}
          sY={e.sY}
          tX={e.tX}
          tY={e.tY}
          color="orange"
        />
      ),
      data.edges
    )}
  </g>
);

const rescale = (sX, sY, { children, edges }) => ({
  nodes: map(
    n => ({
      ...n,
      x: sX(n.x),
      y: sY(n.y),
      width: sX(n.x + n.width) - sX(n.x),
      height: sY(n.y + n.height) - sY(n.y)
    }),
    children
  ),
  edges: map(
    e => ({
      sX: sX(e.sections[0].startPoint.x),
      sY: sY(e.sections[0].startPoint.y),
      tX: sX(e.sections[0].endPoint.x),
      tY: sY(e.sections[0].endPoint.y),
      sId: e.source
    }),
    edges
  )
});

const Preview = ({ data }) => (
  <g>
    {mapWithKey(
      (n, idx) => (
        <rect
          key={idx}
          rx={1}
          ry={1}
          x={n.x}
          y={n.y}
          width={n.width}
          height={n.height}
          fill="#cdd6dd"
        />
      ),
      data.nodes
    )}
  </g>
);

const sortResources = (a, b) => {
  const [, typeA] = a.ref.split('/');
  const [, typeB] = b.ref.split('/');
  if (typeA === 'lights' && typeB === 'groups') {
    return [b, a];
  } else if (typeA === 'lights' && typeB === 'rules') {
    return [b, a];
  } else if (typeA === 'groups' && typeB === 'rules') {
    return [b, a];
  } else if (typeA === 'sensors' && typeB === 'rules') {
    return [a, b];
  } else if (typeA === 'rules' && typeB === 'sensors') {
    return [b, a];
  }

  return [a, b];
};

const ResourceViewer = ({
  activeTab,
  resource,
  hueData,
  defaultSize,
  onPanesChange,
  onRunClick
}) => {
  const [resourceType, resourceId] = useMemo(() => {
    const [, type, id] = activeTab.split('/');
    return [type, id];
  }, [activeTab]);

  const classes = useStyles();
  const [value, setValue] = useState(0);

  const [graph, setGraph] = useState(getEmptyGraph());

  const [action, setAction] = useState(null);

  function handleChange(event, newValue) {
    setValue(newValue);
  }

  useEffect(() => {
    if (resource) {
      const children = [];
      const edges = [];
      dfs(
        hueData,
        resource,
        a => {
          console.log(`visiting node ${a.name}`);
          children.push({ ...a, ...tileSize, id: a.ref });
        },
        (a, b) => {
          console.log(`visiting edge ${a.name} -> ${b.name}`);
          const [x, y] = sortResources(a, b);
          const key = `${x.ref}-${y.ref}`;
          if (none(propEq('id', key), edges)) {
            edges.push({
              id: key,
              sources: [x.ref],
              targets: [y.ref]
            });
          }
        }
      );
      elk
        .layout(getEmptyGraph(children, edges))
        .then(setGraph)
        .catch(console.error);
    }
  }, [hueData]);

  const currentResourceAction = null;
  useMemo(() => {
    const a = find(propEq('id', action), actions[resourceType] || []);
    return a
      ? {
          rest: a.requestCreator(resourceId, resource),
          hs: a.codeCreator(resourceId, resource)
        }
      : null;
  }, [resourceId, resourceType]);

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Relations" />
          <Tab label="Overview" />
          <Tab label="Raw data" />
        </Tabs>
      </AppBar>
      {value === 0 && (
        <TabContainer>
          <ScalableGraph
            rescaleFn={rescale}
            graph={Graph}
            preview={Preview}
            height={600}
            data={graph}
            previewWidth={200}
          />
        </TabContainer>
      )}
      {value === 1 && (
        <TabContainer>
          {currentResourceAction && (
            <div style={{ padding: '5px' }}>
              <h4>Choose action:</h4>
              <Select value={action} onChange={e => setAction(e.target.value)}>
                {map(
                  a => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ),
                  actions[resourceType]
                )}
              </Select>
              <h4>REST</h4>
              <pre className={styles.codeSimple}>
                {JSON.stringify(currentResourceAction.rest, null, 2)}
              </pre>
              <h4>Hue Script</h4>
              <pre className={styles.codeSimple}>
                {currentResourceAction.hs}
              </pre>
              <Button
                type="button"
                variant="contained"
                color="primary"
                onClick={() => onRunClick(currentResourceAction.rest)}
              >
                Run
              </Button>
            </div>
          )}
        </TabContainer>
      )}
      {value === 2 && (
        <TabContainer>
          <textarea
            className={styles.code}
            value={JSON.stringify(resource, null, 2)}
            readOnly
          />
        </TabContainer>
      )}
    </div>
  );
};

export default ResourceViewer;
