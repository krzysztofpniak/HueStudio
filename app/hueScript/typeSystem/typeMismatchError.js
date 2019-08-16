import typeToString from './typeToString';

const typeMismatchError = (expected, given) => ({
  name: 'TypeMismatchError',
  message: `Wrong type, expected ${typeToString(expected)}, ${typeToString(
    given
  )} given`,
  expected,
  given
});

export default typeMismatchError;
