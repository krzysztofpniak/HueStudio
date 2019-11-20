import { curry } from 'ramda';

const getLinearScale = curry(([y1, y2], [x1, x2]) => {
  const a = (y2 - y1) / (x2 - x1);
  const b = y1 - a * x1;
  const fn = function(x) {
    return a * x + b;
  };
  fn.invert = x => (x - b) / a;
  return fn;
});

export default getLinearScale;
