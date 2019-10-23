import React, {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
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
  none,
  chain,
  head,
  pathOr,
  nth,
  mapAccum,
  join,
  curry
} from 'ramda';
import SplitPane from 'react-split-pane';
import Select from '@material-ui/core/Select/Select';
import MenuItem from '@material-ui/core/MenuItem/MenuItem';
import Button from '@material-ui/core/Button/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import styles from '../Home.css';
import Edge from './edge';
import ScalableGraph from '../scalableGraph';
import Toolbar from '@material-ui/core/Toolbar';
import { callNode, numberNode } from '../../hueScript/astBuilders';
import { toSource } from '../../hueScript/index';
import AstViewer from '../astViewer';
import getAdjacents from './getAdjacents';
import processHueScriptSync from '../Home/processHueScriptSync';
import { createHSContext } from '../../hueScript/astToBridgeState';
import Playground from './playground';

const ELK = require('elkjs');

const elk = new ELK();
const mapWithKey = addIndex(map);

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
        padding: '0',
        height: 'calc(100% - 48px)',
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

const dfs2 = (hueData, v, onVisitNode, onVisitEdge) => {
  onVisitNode(v);
  const adjacentEdges = getAdjacents(hueData, v);
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
      ({ x, y, width, height, name, fontSize, textTop, hasError }, key) => (
        <g transform={`translate(${x},${y})`} key={key}>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={4}
            ry={4}
            style={
              hasError
                ? { fill: '#f00' }
                : { stroke: '#f87d42', strokeWidth: 1, fill: '#fff' }
            }
          />
          <g transform={`scale(${transform.k})`}>
            <text
              x={5}
              y={textTop}
              fontSize={fontSize}
              fill={hasError ? 'white' : 'black'}
            >
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

const rescale = ({ sX, sY, factor }, { children, edges }) => ({
  nodes: map(
    n => ({
      ...n,
      x: sX(n.x),
      y: sY(n.y),
      width: sX(n.x + n.width) - sX(n.x),
      height: sY(n.y + n.height) - sY(n.y),
      fontSize: factor(14),
      textTop: factor(20)
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
  }
  if (typeA === 'lights' && typeB === 'rules') {
    return [b, a];
  }
  if (typeA === 'groups' && typeB === 'rules') {
    return [b, a];
  }
  if (typeA === 'sensors' && typeB === 'rules') {
    return [a, b];
  }
  if (typeA === 'rules' && typeB === 'sensors') {
    return [b, a];
  }
  if (typeA === 'schedules' && typeB === 'sensors') {
    return [a, b];
  }
  if (typeA === 'sensors' && typeB === 'schedules') {
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
  onRunClick,
  baseApiUrl
}) => {
  const [resourceType, resourceId] = useMemo(() => {
    const [, type, id] = activeTab.split('/');
    return [type, id];
  }, [activeTab]);

  const classes = useStyles();
  const [value, setValue] = useState(0);

  const [graph, setGraph] = useState(getEmptyGraph());

  function handleChange(event, newValue) {
    setValue(newValue);
  }

  useEffect(() => {
    if (resource) {
      const children = [];
      const edges = [];
      dfs2(
        hueData,
        resource,
        a => {
          children.push({ ...a, ...tileSize, id: a.ref });
        },
        (a, b) => {
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

  return (
    <div className={classes.root}>
      {resource && resource.errors.length > 0 && (
        <AppBar position="static" style={{ color: 'white', background: 'red' }}>
          <Toolbar>{resource.errors[0]}</Toolbar>
        </AppBar>
      )}
      <AppBar position="static">
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Playground" />
          <Tab label="Relations" />

          <Tab label="Raw data" />
        </Tabs>
      </AppBar>
      {value === 0 && (
        <TabContainer>
          <Playground
            hueData={hueData}
            resourceType={resourceType}
            resourceId={resourceId}
            baseApiUrl={baseApiUrl}
            onRunClick={onRunClick}
          />
        </TabContainer>
      )}
      {value === 1 && (
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
