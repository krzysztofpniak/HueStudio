import $ from 'sanctuary-def';
import { def, HSType } from '../../sanctuary/types';
import extractContraints from './extractConstraints';
import constraint from './constraint';

const fn = def('hsFn')({})([$.Array(HSType), HSType])(signature => {
  const [constr, types] = extractContraints(signature);
  return constraint(constr)({
    kind: 'Function',
    signature: types,
    constraints: {}
  });
});

export default fn;
