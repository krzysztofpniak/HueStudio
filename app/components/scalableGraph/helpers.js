import { curry } from 'ramda';

const invertX = curry((transform, x) => (x - transform.x) / transform.k);

const invertY = curry((transform, y) => (y - transform.y) / transform.k);

const invert = curry((transform, location) => [
  (location[0] - transform.x) / transform.k,
  (location[1] - transform.y) / transform.k
]);

const getLinearScaleXFromTransform = curry(({ k, x }) => {
  return xn => k * xn + x;
});

const getLinearScaleYFromTransform = curry(({ k, y }) => {
  return yn => k * yn + y;
});

const getLinearScale = curry(([y1, y2], [x1, x2]) => {
  const a = (y2 - y1) / (x2 - x1);
  const b = y1 - a * x1;
  const fn = function(x) {
    return a * x + b;
  };
  fn.invert = x => (x - b) / a;
  return fn;
});

const getLinearFactor = curry(([y1, y2], [x1, x2]) => {
  const a = (y2 - y1) / (x2 - x1);
  const fn = function(x) {
    return a * x;
  };
  fn.invert = x => x / a;
  return fn;
});

export {
  invertX,
  invertY,
  invert,
  getLinearScaleXFromTransform,
  getLinearScaleYFromTransform,
  getLinearScale,
  getLinearFactor
};
