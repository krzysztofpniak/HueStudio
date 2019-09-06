import typeToString from './typeToString';

const typeMismatchError = (expected, given, location) => ({
  name: 'TypeMismatchError',
  message: `Wrong type, expected ${typeToString(expected)}, ${typeToString(
    given
  )} given`,
  expected,
  given,
  location
});

export default typeMismatchError;
