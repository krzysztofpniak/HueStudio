import React, { Component } from 'react';
import { Transform } from 'd3-zoom/src/transform';
import { min, max, clamp } from 'ramda';

const minOf3 = (a, b, c) => min(min(a, b), c);
const maxOf3 = (a, b, c) => max(max(a, b), c);

const MIN_BRUSH_SIZE = 5;

class Brush extends Component {
  constructor() {
    super();
    this.storeRef = this.storeRef.bind(this);
    this.getNewSelection = this.getNewSelection.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }
  storeRef(ref) {
    this.g = ref;
  }
  getNewSelection(point) {
    const { width, height } = this.props;
    const s = this.state.startSelection;
    const offsetX = point.x - this.state.startPoint.x;
    const offsetY = point.y - this.state.startPoint.y;
    const [[sX1, sY1], [sX2, sY2]] = s;
    const sW = sX2 - sX1;
    const sH = sY2 - sY1;
    const aspectRatio = sW / sH;

    if (this.state.startClass === 'selection') {
      const safeOffsetX = clamp(-sX1, width - sX2, offsetX);
      const safeOffsetY = clamp(-sY1, height - sY2, offsetY);

      return [
        [sX1 + safeOffsetX, sY1 + safeOffsetY],
        [sX2 + safeOffsetX, sY2 + safeOffsetY]
      ];
    } else if (this.state.startClass === 'handle--s') {
      const topBound = sY1 - sY2 + MIN_BRUSH_SIZE;
      const bottomBound = minOf3(
        height - sY2,
        (2 * sX1) / aspectRatio,
        ((width - sX2) * 2) / aspectRatio
      );
      const safeOffsetY = clamp(topBound, bottomBound, offsetY);
      const safeOffsetX = (safeOffsetY * aspectRatio) / 2;

      return [[sX1 - safeOffsetX, sY1], [sX2 + safeOffsetX, sY2 + safeOffsetY]];
    } else if (this.state.startClass === 'handle--e') {
      const leftBound = sX1 - sX2 + MIN_BRUSH_SIZE;
      const rightBound = minOf3(
        width - sX2,
        (height - sY2) * 2 * aspectRatio,
        2 * sY1 * aspectRatio
      );
      const safeOffsetX = clamp(leftBound, rightBound, offsetX);
      const safeOffsetY = safeOffsetX / aspectRatio / 2;

      return [[sX1, sY1 - safeOffsetY], [sX2 + safeOffsetX, sY2 + safeOffsetY]];
    } else if (this.state.startClass === 'handle--w') {
      const leftBound = maxOf3(
        -sX1,
        -2 * aspectRatio * sY1,
        -2 * aspectRatio * (height - sY2)
      );
      const rightBound = sX2 - sX1 - MIN_BRUSH_SIZE;
      const safeOffsetX = clamp(leftBound, rightBound, offsetX);
      const safeOffsetY = safeOffsetX / aspectRatio / 2;

      return [[sX1 + safeOffsetX, sY1 + safeOffsetY], [sX2, sY2 - safeOffsetY]];
    } else if (this.state.startClass === 'handle--n') {
      const topBound = maxOf3(
        -sY1,
        (-2 * sX1) / aspectRatio,
        (-2 * (width - sX2)) / aspectRatio
      );
      const bottomBound = sY2 - sY1 - MIN_BRUSH_SIZE;
      const safeOffsetY = clamp(topBound, bottomBound, offsetY);
      const safeOffsetX = (safeOffsetY * aspectRatio) / 2;

      return [[sX1 + safeOffsetX, sY1 + safeOffsetY], [sX2 - safeOffsetX, sY2]];
    }
  }
  onMouseDown(e) {
    const startClass = e.target.getAttribute('class');
    const boundingRect = this.g.getBoundingClientRect();
    this.setState({ boundingRect });
    const { left, top } = boundingRect;

    const point = {
      x: e.clientX - left,
      y: e.clientY - top
    };

    this.setState({
      startPoint: point,
      startClass,
      startSelection: this.props.selection
    });
  }
  onMouseMove(e) {
    this.pt.x = e.clientX;
    this.pt.y = e.clientY;
    const { left, top } = this.state.boundingRect;
    const { width } = this.props;

    const point = {
      x: e.clientX - left,
      y: e.clientY - top
    };

    if (
      this.state &&
      this.state.startPoint &&
      (this.state.startClass === 'selection' ||
        this.state.startClass === 'handle--s' ||
        this.state.startClass === 'handle--n' ||
        this.state.startClass === 'handle--w' ||
        this.state.startClass === 'handle--e')
    ) {
      const nS = this.getNewSelection(point);

      const scale = width / (nS[1][0] - nS[0][0]);
      const translate = [-nS[0][0], -nS[0][1]];

      e.transform = new Transform(scale, translate[0], translate[1]);
      const e2 = {
        ...e,
        sourceEvent: {
          type: 'brush'
        }
      };
      if (this.props.onBrushed) {
        this.props.onBrushed(e2);
      }
    }

    if (
      this.state &&
      this.state.startPoint &&
      this.state.startClass === 'overlay'
    ) {
      const startPoint = this.state.startPoint;
      const { width } = this.props;
      const d = (point.x - startPoint.x) / (point.y - startPoint.y || 1);

      /*
            const {startSelection: [[sX1, sY1], [sX2, sY2]]} = this.state;
            const sW = sX2 - sX1;
            const sH = sY2 - sY1;
            const aspectRatio = sW / sH;

            const [offsetX, offsetY] = [point.x - startPoint.x, (point.x - startPoint.x) * aspectRatio];

            const nS = [
                [startPoint.x, startPoint.y],
                [startPoint.x + offsetX, startPoint.y + offsetY]
            ];

            const scale = width / (nS[1][0] - nS[0][0]);
            const translate = [-nS[0][0], -nS[0][1]];

            e.transform = new Transform(
                scale,
                translate[0],
                translate[1]
            );
            const e2 = {
                ...e,
                sourceEvent: {
                    type: 'brush'
                },
            };
            if (this.props.onBrushed) {
                this.props.onBrushed(e2);
            }
            */
    }
  }
  onMouseUp() {
    this.setState({ startPoint: null });
  }
  componentDidMount() {
    this.pt = this.g.ownerSVGElement.createSVGPoint();
    const boundingRect = this.g.getBoundingClientRect();
    this.setState({ boundingRect });
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }
  componentWillUnmount() {
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }
  render() {
    const {
      selection: [[sX1, sY1], [sX2, sY2]]
    } = this.props;
    const sW = sX2 - sX1;
    const sH = sY2 - sY1;

    return (
      <g
        transform="translate(0,0)"
        width={this.props.width}
        height={this.props.height}
        fill="none"
        ref={this.storeRef}
        pointerEvents="all"
        style={{
          cursor: 'move',
          fill: 'none',
          pointerEvents: 'all',
          WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)'
        }}
      >
        <rect
          className="overlay"
          pointerEvents="all"
          cursor="crosshair"
          x="0"
          y="0"
          width={this.props.width}
          height={this.props.height}
        />
        <rect
          className="selection"
          cursor="move"
          fill="rgb(0, 108, 236)"
          fillOpacity="0.1"
          rx={3}
          shapeRendering="crispEdges"
          x={sX1}
          y={sY1}
          width={sW}
          height={sH}
        />

        <rect
          className="handle--n"
          cursor="ns-resize"
          x={sX1 - 3}
          y={sY1 - 3}
          width={sW + 6}
          height="6"
        />
        <rect
          className="handle--w"
          cursor="ew-resize"
          x={sX1 - 3}
          y={sY1 - 3}
          width="6"
          height={sH + 6}
        />
        <rect
          className="handle--s"
          cursor="ns-resize"
          x={sX1 - 3}
          y={sY1 + sH - 3}
          width={sW + 6}
          height="6"
        />
        <rect
          className="handle--e"
          cursor="ew-resize"
          x={sX1 + sW - 3}
          y={sY1 - 3}
          width="6"
          height={sH + 6}
        />
        <rect
          className="handle--nw"
          cursor="nwse-resize"
          x={sX1 - 3}
          y={sY1 - 3}
          width="6"
          height="6"
        />
        <rect
          className="handle--ne"
          cursor="nesw-resize"
          x={sX1 + sW - 3}
          y={sY1 - 3}
          width="6"
          height="6"
        />
        <rect
          className="handle--se"
          cursor="nwse-resize"
          x={sX1 + sW - 3}
          y={sY1 + sH - 3}
          width="6"
          height="6"
        />
        <rect
          className="handle--sw"
          cursor="nesw-resize"
          x={sX1 - 3}
          y={sY1 + sH - 3}
          width="6"
          height="6"
        />
      </g>
    );
  }
}

export default Brush;
