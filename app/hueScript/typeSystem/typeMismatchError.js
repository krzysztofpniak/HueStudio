import typeToString from './typeToString';
import $ from 'sanctuary-def';
import { def, HSType, CodeLocation, HSError } from '../../sanctuary/types';

const typeMismatchError = def('typeMismatchError')({})([
  HSType,
  HSType,
  $.Maybe(CodeLocation),
  HSError
])(expected => given => location => ({
  name: 'TypeMismatchError',
  message: `Wrong type, expected ${typeToString(expected)}, ${typeToString(
    given
  )} given`,
  expected,
  given,
  location
}));

export default typeMismatchError;
