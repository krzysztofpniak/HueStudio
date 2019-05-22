import React, { useState, createElement } from 'react';
import { withStyles } from '@material-ui/core/styles';
import ListSubheader from '@material-ui/core/ListSubheader';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import StarBorder from '@material-ui/icons/StarBorder';
import { map, addIndex, evolve, not, lensProp, over } from 'ramda';

const mapWithKey = addIndex(map);

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  nested: {
    paddingLeft: '30px'
  }
});

const NestedList = ({ classes, items, onItemDoubleClick }) => {
  const [opened, setOpened] = useState({});

  return (
    <List component="nav" className={classes.root}>
      {mapWithKey(
        i => [
          <ListItem
            key={i.id}
            button
            onClick={() => setOpened(over(lensProp(i.id), not, opened))}
          >
            <ListItemIcon>
              {i.icon ? createElement(i.icon) : <InboxIcon />}
            </ListItemIcon>
            <ListItemText primary={i.name} />
            {opened[i.id] ? <ExpandLess /> : <ExpandMore />}
          </ListItem>,
          <Collapse
            key={`${i.id}_exp`}
            in={opened[i.id]}
            timeout="auto"
            unmountOnExit
          >
            <List component="div" disablePadding>
              {mapWithKey(
                c => (
                  <ListItem
                    key={c.id}
                    button
                    className={classes.nested}
                    onDoubleClick={() => onItemDoubleClick(c.id)}
                  >
                    <ListItemIcon>
                      {i.childIcon ? (
                        createElement(i.childIcon)
                      ) : (
                        <StarBorder />
                      )}
                    </ListItemIcon>
                    <ListItemText primary={c.name} />
                  </ListItem>
                ),
                i.items
              )}
            </List>
          </Collapse>
        ],
        items
      )}
    </List>
  );
};

export default withStyles(styles)(NestedList);
