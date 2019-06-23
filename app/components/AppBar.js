import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import MenuIcon from '@material-ui/icons/Publish';
import SettingsIcon from '@material-ui/icons/Settings';
import CloseIcon from '@material-ui/icons/Close';
import { map, addIndex } from 'ramda';
import routes from '../constants/routes';
import { Link } from 'react-router-dom';

const mapWithKey = addIndex(map);

const styles = {
  root: {
    flexGrow: 1
  },
  menuButton: {
    marginLeft: -18,
    marginRight: 10
  },
  tabs: {
    maxWidth: 'calc(100% - 230px)'
  }
};

const DenseAppBar = ({
  classes,
  onSendClick,
  tabs,
  activeTab,
  onTabClick,
  onTabCloseClick
}) => {
  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography variant="h5">Hue Studio</Typography>
          <IconButton
            color="inherit"
            aria-label="Open drawer"
            onClick={onSendClick}
          >
            <MenuIcon />
          </IconButton>
          <Tabs
            value={activeTab}
            onChange={(e, value) => onTabClick(value)}
            variant="scrollable"
            className={classes.tabs}
            scrollButtons="auto"
          >
            {mapWithKey(
              t => (
                <Tab
                  key={t.ref}
                  component="div"
                  value={t.ref}
                  label={
                    <div style={{ color: t.modified ? 'aqua' : 'white' }}>
                      {t.name.substring(0, 10)}
                      <Button
                        style={{ minWidth: '30px' }}
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          onTabCloseClick(t.ref);
                        }}
                      >
                        <CloseIcon />
                      </Button>
                    </div>
                  }
                />
              ),
              tabs
            )}
          </Tabs>
          <div style={{ flex: '1' }} />
          <IconButton to={routes.SETTINGS} component={Link} color="inherit">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default withStyles(styles)(DenseAppBar);
