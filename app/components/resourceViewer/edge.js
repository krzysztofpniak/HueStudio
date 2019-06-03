import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

const createEdgePathArray = (
  sourceX,
  sourceY,
  c1X,
  c1Y,
  c2X,
  c2Y,
  targetX,
  targetY
) => ['M', sourceX, sourceY, 'C', c1X, c1Y, c2X, c2Y, targetX, targetY];

const defaultNodeSize = 72;

const edgeEnhance = withStyles({
  orange: {
    fill: 'none',
    stroke: '#ffa533'
  },
  blue: {
    fill: 'none',
    stroke: '#024fa6'
  },
  red: {
    fill: 'none',
    stroke: '#ff4166'
  },
  fillNone: {
    fill: 'none'
  },
  fillWhite: {
    fill: '#fff'
  }
});

const getArrowPoints2 = (x, y) => `${x},${y + 2} ${x + 3},${y} ${x},${y - 2}`;

const Edge = edgeEnhance(({ sX, sY, tX, tY, color, classes }) => {
  const sourceX = sX + 2;
  const sourceY = sY;
  const targetX = tX - 4;
  const targetY = tY;

  // Organic / curved edge
  let c1X, c1Y, c2X, c2Y;
  if (targetX - 5 < sourceX) {
    const curveFactor = ((sourceX - targetX) * defaultNodeSize) / 200;
    if (Math.abs(targetY - sourceY) < defaultNodeSize / 2) {
      // LoopBack
      c1X = sourceX + curveFactor;
      c1Y = sourceY - curveFactor;
      c2X = targetX - curveFactor;
      c2Y = targetY - curveFactor;
    } else {
      // Stick out some
      c1X = sourceX + curveFactor;
      c1Y = sourceY + (targetY > sourceY ? curveFactor : -curveFactor);
      c2X = targetX - curveFactor;
      c2Y = targetY + (targetY > sourceY ? -curveFactor : curveFactor);
    }
  } else {
    // Controls halfway between
    c1X = sourceX + (targetX - sourceX) / 2;
    c1Y = sourceY;
    c2X = c1X;
    c2Y = targetY;
  }

  const path = createEdgePathArray(
    sourceX,
    sourceY,
    c1X,
    c1Y,
    c2X,
    c2Y,
    targetX,
    targetY
  ).join(' ');

  const arrowPoints = getArrowPoints2(targetX, targetY);

  return (
    <g>
      <circle
        r="2"
        cx={sX}
        cy={sourceY}
        className={classNames(classes[color], classes.fillWhite)}
        fill="#fff"
      />
      <path d={path} className={classNames(classes[color], classes.fillNone)} />
      <polygon
        points={arrowPoints}
        className={classNames(classes[color], classes.fillWhite)}
      />
    </g>
  );
});

export default Edge;
