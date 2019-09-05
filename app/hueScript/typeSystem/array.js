import $ from 'sanctuary-def';
import { def, HSType } from '../../sanctuary/types';

const array = def('hsArray')({})([HSType, HSType])(of => ({
  kind: 'Array',
  of: { ...of, constraints: {} },
  constraints: of.constraints
}));

export default array;
