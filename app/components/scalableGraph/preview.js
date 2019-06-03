import React, { createElement } from 'react';
import Brush from './brush';

const Preview = props => {
  const { x, y, data, selection, onBrushed, preview } = props;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={props.width}
        height={props.height}
        fill="#FFFFFF"
        fillOpacity={0.7}
        rx={3}
        ry={3}
        stroke="#d9dee1"
      />
      {createElement(preview, { data })}
      <Brush
        x={0}
        y={0}
        width={props.width}
        height={props.height}
        selection={selection}
        onBrushed={onBrushed}
      />
    </g>
  );
};

export default Preview;
