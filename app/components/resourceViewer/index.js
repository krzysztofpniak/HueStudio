import { useMemo, useState } from 'react';
import { find, map, propEq } from 'ramda';
import SplitPane from 'react-split-pane';
import styles from '../Home.css';
import Select from '@material-ui/core/Select/Select';
import MenuItem from '@material-ui/core/MenuItem/MenuItem';
import Button from '@material-ui/core/Button/Button';
import React from 'react';

const ResourceViewer = ({
  resourceId,
  resourceType,
  resource,
  defaultSize,
  onPanesChange,
  onRunClick
}) => {
  const [action, setAction] = useState(actions[resourceType][0].id);

  const currentResourceAction = useMemo(() => {
    const a = find(propEq('id', action), actions[resourceType]);
    return {
      rest: a.requestCreator(resourceId, resource),
      hs: a.codeCreator(resourceId, resource)
    };
  });

  return (
    <SplitPane
      split="vertical"
      defaultSize={defaultSize}
      onChange={onPanesChange}
    >
      <textarea
        className={styles.code}
        value={JSON.stringify(resource, null, 2)}
        readOnly
      />
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
        <pre className={styles.codeSimple}>{currentResourceAction.hs}</pre>
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={() => onRunClick(currentResourceAction.rest)}
        >
          Run
        </Button>
      </div>
    </SplitPane>
  );
};

export default ResourceViewer;
