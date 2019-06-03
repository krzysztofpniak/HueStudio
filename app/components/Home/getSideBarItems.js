import { keys, map, toPairs } from 'ramda';
import LightIcon from '@material-ui/icons/WbIncandescent';
import NoteIcon from '@material-ui/icons/Remove';
import GroupIcon from '@material-ui/icons/GroupWork';
import SceneIcon from '@material-ui/icons/Panorama';
import TimerIcon from '@material-ui/icons/Timer';
import TransformIcon from '@material-ui/icons/Transform';
import InputIcon from '@material-ui/icons/Input';

const getSideBarItems = ({
  lights,
  groups,
  scenes,
  schedules,
  rules,
  sensors
}) => [
  {
    id: 'lights',
    name: `Lights (${keys(lights).length})`,
    icon: LightIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/lights/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(lights)
    )
  },
  {
    id: 'groups',
    name: `Groups (${keys(groups).length})`,
    icon: GroupIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/groups/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(groups)
    )
  },
  {
    id: 'scenes',
    name: `Scenes (${keys(scenes).length})`,
    icon: SceneIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/scenes/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(scenes)
    )
  },
  {
    id: 'schedules',
    name: `Schedules (${keys(schedules).length})`,
    icon: TimerIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/schedules/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(schedules)
    )
  },
  {
    id: 'rules',
    name: `Rules (${keys(rules).length})`,
    icon: TransformIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/rules/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(rules)
    )
  },
  {
    id: 'sensors',
    name: `Sensors (${keys(sensors).length})`,
    icon: InputIcon,
    childIcon: NoteIcon,
    items: map(
      ([a, b]) => ({
        id: `/sensors/${a}`,
        name: `#${a} ${b.name}`
      }),
      toPairs(sensors)
    )
  }
];

export default getSideBarItems;
