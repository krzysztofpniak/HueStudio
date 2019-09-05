import $ from 'sanctuary-def';
import { def, HSType, HSTypeResolution } from '../../sanctuary/types';
//typeToTypeResolution :: Type -> TypeResolution
const typeToTypeResolution = def('typeToTypeResolution')({})([
  HSType,
  HSTypeResolution
])(type => ({ type, resolutions: {} }));

export default typeToTypeResolution;
