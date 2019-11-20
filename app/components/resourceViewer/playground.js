import React, {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  addIndex,
  both,
  cond,
  filter,
  nth,
  pathOr,
  propEq,
  T,
  toPairs,
  any,
  propOr,
  values
} from 'ramda';
import Select from '@material-ui/core/Select/Select';
import MenuItem from '@material-ui/core/MenuItem/MenuItem';
import styles from '../Home.css';
import Button from '@material-ui/core/Button/Button';
import AstViewer from '../astViewer';
import { toSource } from '../../hueScript';
import processHueScriptSync from '../Home/processHueScriptSync';
import { createHSContext } from '../../hueScript/astToBridgeState';
import { callNode } from '../../hueScript/astBuilders';
import Tabs from '@material-ui/core/Tabs/Tabs';
import Tab from '@material-ui/core/Tab/Tab';
import AppBar from '@material-ui/core/AppBar/AppBar';
import actionToEffects from '../../hueScript/effects/actionToEffects';
import { chain, Either, map, mapIndexed, sequence } from '../../sanctuary';

const render = Component => props => <Component {...props} />;

const createSelectEditor = optionsMapper => ({
  value,
  onChange,
  hueData,
  resourceId,
  resourceType
}) => {
  const options = useMemo(
    () => optionsMapper({ hueData, resourceId, resourceType }),
    [hueData, resourceId, resourceType]
  );
  return (
    <Select value={value} onChange={e => onChange(e.target.value)}>
      {map(o => (
        <MenuItem key={o.id} value={o.id}>
          {o.name}
        </MenuItem>
      ))(options)}
    </Select>
  );
};

const SceneSelector = createSelectEditor(({ hueData, resourceId }) =>
  map(([key, s]) => ({ id: key, name: s.name }))(
    filter(([k, s]) => s.group === resourceId, toPairs(hueData.scenes))
  )
);

const EffectSelector = createSelectEditor(() => [
  { id: 'none', name: 'None' },
  { id: 'colorloop', name: 'Color Loop' }
]);

const actions = {
  lights: [
    {
      id: 'on',
      name: 'On',
      codeCreator: resourceId => callNode('on', callNode('light', +resourceId))
    },
    {
      id: 'off',
      name: 'Off',
      codeCreator: resourceId => callNode('off', callNode('light', +resourceId))
    },
    {
      id: 'alert',
      name: 'Alert',
      codeCreator: resourceId =>
        callNode('alert', callNode('light', +resourceId), 'select')
    },
    {
      id: 'effect',
      name: 'Effect',
      editor: EffectSelector,
      editorDefault: () => 'colorloop',
      codeCreator: (resourceId, { editorValue }) =>
        callNode('effect', editorValue, callNode('light', +resourceId))
    }
  ],
  groups: [
    {
      id: 'on',
      name: 'On',
      codeCreator: resourceId => callNode('on', callNode('group', +resourceId))
    },
    {
      id: 'off',
      name: 'Off',
      codeCreator: resourceId => callNode('off', callNode('group', +resourceId))
    },
    {
      id: 'alert',
      name: 'Alert',
      codeCreator: resourceId =>
        callNode('alert', 'select', callNode('group', +resourceId))
    },
    {
      id: 'setScene',
      name: 'Set Scene',
      editor: SceneSelector,
      editorDefault: ({ hueData, resourceId }) =>
        pathOr(
          '',
          [0, 0],
          filter(([k, s]) => s.group === resourceId, toPairs(hueData.scenes))
        ),
      codeCreator: (resourceId, { editorValue }) =>
        callNode('setScene', editorValue, callNode('group', +resourceId))
    },
    {
      id: 'delete',
      name: 'Delete',
      codeCreator: resourceId =>
        callNode('delete', callNode('group', +resourceId))
    }
  ],
  schedules: [
    {
      id: 'enable',
      name: 'Enable',
      codeCreator: resourceId =>
        callNode('enable', callNode('schedule', +resourceId))
    },
    {
      id: 'disable',
      name: 'Disable',
      codeCreator: resourceId =>
        callNode('disable', callNode('schedule', +resourceId))
    },
    {
      id: 'delete',
      name: 'Delete',
      requestCreator: (resourceId, data) => ({
        url: `/schedules/${resourceId}`,
        method: 'DELETE'
      }),
      codeCreator: resourceId =>
        callNode('delete', callNode('schedule', +resourceId))
    }
  ],
  rules: [
    {
      id: 'enable',
      name: 'Enable',
      requestCreator: (resourceId, data) => ({
        url: `/rules/${resourceId}`,
        method: 'PUT',
        body: {
          status: 'enabled'
        }
      }),
      codeCreator: resourceId =>
        callNode('enable', callNode('rule', +resourceId))
    },
    {
      id: 'disable',
      name: 'Disable',
      requestCreator: (resourceId, data) => ({
        url: `/rules/${resourceId}`,
        method: 'PUT',
        body: {
          status: 'disabled'
        }
      }),
      codeCreator: resourceId =>
        callNode('disable', callNode('schedule', +resourceId))
    },
    {
      id: 'delete',
      name: 'Delete',
      requestCreator: (resourceId, data) => ({
        url: `/rules/${resourceId}`,
        method: 'DELETE'
      }),
      codeCreator: resourceId =>
        callNode('delete', callNode('schedule', +resourceId))
    }
  ]
};

const LightPlayground = ({
  hueData,
  resourceType,
  resourceId,
  baseApiUrl,
  onRunClick
}) => {
  const [view, setView] = useState('state');
  const [editorValue, setEditorValue] = useState('');
  const [actionIdx, setActionIdx] = useState(0);
  const currentResourceActionInt = useMemo(() => {
    const a = nth(actionIdx, actions[resourceType] || []);
    return a;
  }, [resourceType, actionIdx]);

  useEffect(() => {
    if (currentResourceActionInt && currentResourceActionInt.editorDefault) {
      const defaultValue = currentResourceActionInt.editorDefault({
        hueData,
        resourceType,
        resourceId
      });
      setEditorValue(defaultValue);
    }
  }, [currentResourceActionInt, resourceId]);

  const actionParamEditor = useMemo(() => {
    return currentResourceActionInt && currentResourceActionInt.editor
      ? createElement(currentResourceActionInt.editor, {
          hueData,
          resourceType,
          resourceId,
          value: editorValue,
          onChange: setEditorValue
        })
      : null;
  }, [
    resourceType,
    resourceId,
    hueData,
    currentResourceActionInt,
    editorValue
  ]);

  const currentResourceAction = useMemo(() => {
    const a = currentResourceActionInt;

    if (a) {
      try {
        const ast = a.codeCreator(resourceId, {
          resourceType,
          hueData,
          editorValue
        });

        const hs = toSource(ast, { style: 'object' });

        const { effects } = processHueScriptSync(true)(
          createHSContext(hueData)
        )(hs);

        return {
          ast,
          hs,
          effects
        };
      } catch (e) {
        console.error(e);
        return null;
      }
    }

    return null;
  }, [
    resourceId,
    resourceType,
    currentResourceActionInt,
    hueData,
    editorValue
  ]);

  return (
    currentResourceAction && (
      <div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '50%', padding: 5 }}>
            <h4>Choose action:</h4>
            <Select
              value={actionIdx}
              onChange={e => setActionIdx(e.target.value)}
            >
              {mapIndexed(a => idx => (
                <MenuItem key={a.id} value={idx}>
                  {a.name}
                </MenuItem>
              ))(actions[resourceType])}
            </Select>
            {actionParamEditor}
            <h4>Hue Script</h4>
            <pre className={styles.codeSimple}>{currentResourceAction.hs}</pre>
            <Button
              type="button"
              variant="contained"
              color="primary"
              onClick={() => onRunClick(currentResourceAction.effects)}
            >
              Run
            </Button>
          </div>
          <div style={{ width: '50%' }}>
            <AstViewer
              baseApiUrl={baseApiUrl}
              effects={currentResourceAction.effects}
              view={view}
              onViewChange={setView}
            />
          </div>
        </div>
      </div>
    )
  );
};

const createButtonEventFilter = dimmerId => eventCode => r =>
  any(
    c =>
      c.address === `/sensors/${dimmerId}/state/buttonevent` &&
      c.value === '' + eventCode,
    r.conditions
  );

const SwitchSensorPlayground = ({ hueData, resourceId, resourceType }) => {
  const resource = hueData[resourceType][resourceId];
  const [currentButton, setCurrentButton] = useState(0);
  const [currentButtonEventIdx, setCurrentButtonEventIdx] = useState(0);

  const handleButtonSet = useCallback((e, value) => {
    setCurrentButton(value);
  }, []);

  const currentButtonEvents = useMemo(
    () => resource.capabilities.inputs[currentButton].events,
    [currentButton, resource]
  );

  const handleButtonEventSet = useCallback((e, value) => {
    setCurrentButtonEventIdx(value);
  }, []);

  const currentButtonEvent = useMemo(
    () =>
      resource.capabilities.inputs[currentButton].events[currentButtonEventIdx]
        .buttonevent,
    [currentButton, currentButtonEventIdx, resource]
  );

  const currentRules = useMemo(
    () =>
      filter(
        createButtonEventFilter(resourceId)(currentButtonEvent),
        hueData.rules
      ),
    [hueData.rules, resourceId, currentButtonEvent]
  );

  const currentActions = useMemo(
    () => values(map(r => r.actions, currentRules)),
    [currentRules]
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Tabs
          value={currentButton}
          onChange={handleButtonSet}
          variant="fullWidth"
        >
          {mapIndexed(b => i => (
            <Tab
              key={i}
              label={`Button ${i + 1}`}
              value={i}
              style={{ minWidth: 0 }}
            />
          ))(resource.capabilities.inputs)}
        </Tabs>
      </AppBar>
      <AppBar position="static">
        <Tabs
          value={currentButtonEventIdx}
          onChange={handleButtonEventSet}
          variant="fullWidth"
        >
          {mapIndexed(e => i => (
            <Tab
              key={i}
              label={e.eventtype}
              value={i}
              style={{ minWidth: 0 }}
            />
          ))(currentButtonEvents)}
        </Tabs>
      </AppBar>
      <pre style={{ overflow: 'scroll' }}>
        {JSON.stringify(currentActions, null, 2)}
      </pre>
    </div>
  );
};

const Playground = cond([
  [
    both(
      propEq('resourceType', 'sensors'),
      ({ hueData, resourceId, resourceType }) => {
        const resource = hueData[resourceType][resourceId];
        return (
          resource &&
          resource.capabilities &&
          resource.capabilities.inputs &&
          resource.capabilities.inputs.length > 0
        );
      }
    ),
    render(SwitchSensorPlayground)
  ],
  [T, render(LightPlayground)],
  [T, () => 'not implemented yet']
]);

export default Playground;
