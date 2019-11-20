import React, {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  both,
  cond,
  filter,
  nth,
  pathOr,
  propEq,
  T,
  toPairs,
  any,
  values,
  path,
  compose
} from 'ramda';
import { ChromePicker } from 'react-color';
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
import LabPicker from '../labPicker';
import Slider from '@material-ui/core/Slider';
import getLinearScale from '../../helpers/getLinearScale';
import useDebounce from '../../helpers/useDebounce';
import useThrottle from '../../helpers/useThrottle';

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

const RgbColorPicker = ({ value, onChange }) => {
  const [rgb, setState] = useState([255, 255, 255]);
  return (
    <ChromePicker
      color={rgb}
      onChange={x => {
        setState(x.rgb);
      }}
      onChangeComplete={x => {
        onChange([x.rgb.r, x.rgb.g, x.rgb.b]);
      }}
      disableAlpha
    />
  );
};

const XYColorPicker = ({
  hueData,
  resourceId,
  resourceType,
  value,
  onChange
}) => {
  const gamut = path(
    [resourceType, resourceId, 'capabilities', 'control', 'colorgamut'],
    hueData
  );
  return gamut ? (
    <LabPicker gamut={gamut} value={value} onChange={onChange} />
  ) : (
    <div>Not available</div>
  );
};

const formatCTPickerValue = value => `${value}K`;

const getMarks = (min, max) => [
  {
    value: 2200,
    label: '2200K (Flame)'
  },
  {
    value: 2700,
    label: '2700K (Warm light)'
  },
  {
    value: 3000,
    label: '3000K (White)'
  },
  {
    value: 5000,
    label: '5000K (Cool White)'
  },
  {
    value: 6500,
    label: '6500K (Daylight)'
  }
];

const miredToKelvin = compose(
  v => Math.round(v),
  getLinearScale([2000, 6500], [500, 153])
);

const kelvinToMired = compose(
  v => Math.floor(v),
  getLinearScale([500, 153], [2000, 6500])
);

const CTPicker = ({ hueData, resourceType, resourceId, value, onChange }) => {
  const { min, max } = map(miredToKelvin)(
    pathOr(
      { min: 0, max: 0 },
      [resourceType, resourceId, 'capabilities', 'control', 'ct'],
      hueData
    )
  );

  const marks = useMemo(() => getMarks(min, max), [min, max]);

  return (
    <div style={{ padding: '105px 155px 0 20px' }}>
      <Slider
        value={miredToKelvin(value)}
        onChange={(e, v) => onChange(kelvinToMired(v))}
        getAriaValueText={formatCTPickerValue}
        aria-labelledby="discrete-slider-custom"
        valueLabelDisplay="auto"
        marks={marks}
        min={max}
        max={min}
      />
    </div>
  );
};

const BriPicker = ({ hueData, resourceType, resourceId, value, onChange }) => {
  return (
    <div style={{ padding: '105px 155px 0 20px' }}>
      <Slider
        value={value}
        onChange={(e, v) => onChange(v)}
        aria-labelledby="discrete-slider-custom"
        valueLabelDisplay="auto"
        marks
        min={1}
        max={254}
      />
    </div>
  );
};

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
    },
    {
      id: 'ct',
      name: 'Temperature',
      editor: CTPicker,
      editorDefault: ({ hueData, resourceType, resourceId }) =>
        pathOr(3000, [resourceType, resourceId, 'state', 'ct'], hueData),
      codeCreator: (resourceId, { editorValue }) =>
        callNode('ct', editorValue, callNode('light', +resourceId))
    },
    {
      id: 'bri',
      name: 'Brightness',
      editor: BriPicker,
      editorDefault: ({ hueData, resourceType, resourceId }) =>
        pathOr(254, [resourceType, resourceId, 'state', 'bri'], hueData),
      codeCreator: (resourceId, { editorValue }) =>
        callNode('bri', editorValue, callNode('light', +resourceId))
    },
    {
      id: 'xy',
      name: 'XY Color',
      editor: XYColorPicker,
      editorDefault: ({ hueData, resourceType, resourceId }) =>
        pathOr([0.3, 0.3], [resourceType, resourceId, 'state', 'xy'], hueData),
      codeCreator: (resourceId, { editorValue }) =>
        callNode(
          'xy',
          editorValue[0],
          editorValue[1],
          callNode('light', +resourceId)
        )
    },
    {
      id: 'rgb',
      name: 'RGB',
      editor: RgbColorPicker,
      editorDefault: () => [255, 255, 255],
      codeCreator: (resourceId, { editorValue }) =>
        callNode(
          'rgb',
          editorValue[0],
          editorValue[1],
          editorValue[2],
          callNode('light', +resourceId)
        )
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

const emptyArray = [];

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

  const throttledEditorValue = useThrottle(editorValue, 400);

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
    throttledEditorValue
  ]);

  const debouncedEffects = useDebounce(
    currentResourceAction && currentResourceAction.hs
      ? currentResourceAction.effects
      : emptyArray,
    400
  );

  useEffect(() => {
    onRunClick(debouncedEffects);
  }, [debouncedEffects]);

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
    () =>
      sequence(Either)(
        chain(r => values(map(actionToEffects)(r.actions)))(
          values(currentRules)
        )
      ),
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
