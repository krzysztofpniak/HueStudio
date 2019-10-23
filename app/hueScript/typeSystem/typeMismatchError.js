import typeToString from './typeToString';
import $ from 'sanctuary-def';
import { def, HSType, CodeLocation, HSError } from '../../sanctuary/types';

const color = value => text => `<Color color="${value}" text="${text}" />`;
const red = color('red');
const lime = color('lime');

const typeMismatchError = def('typeMismatchError')({})([
  HSType,
  HSType,
  $.Maybe(CodeLocation),
  HSError
])(expected => given => location => ({
  name: 'TypeMismatchError',
  message: `Wrong type, expected ${lime(typeToString(expected))}, ${red(
    typeToString(given)
  )} given`,
  expected,
  given,
  location
}));

export default typeMismatchError;
