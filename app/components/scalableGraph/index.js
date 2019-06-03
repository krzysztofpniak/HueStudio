import React, { Component, createElement } from 'react';
import { Transform } from 'd3-zoom/src/transform';
import Preview from './preview';
import {
  maxXSelector,
  maxYSelector,
  scaleYSelector,
  scaledNodesSelector,
  previewNodesSelector,
  previewHeightSelector,
  brushSelectionSelector
} from './selectors';
import { zoom } from 'd3-zoom';
import { event, select } from 'd3-selection';

class ScalableGraph extends Component {
  constructor() {
    super();
    this.storeRef = this.storeRef.bind(this);
    this.storeMainGRef = this.storeMainGRef.bind(this);
    this.storeCanvasRef = this.storeCanvasRef.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.initZoom = this.initZoom.bind(this);
    this.onZoomed = this.onZoomed.bind(this);
    this.onBrushed = this.onBrushed.bind(this);
    this.state = {
      transform: {
        k: 1,
        x: 0,
        y: 0
      },
      width: 0,
      height: 1
    };
  }
  storeRef(ref) {
    this.svg = ref;
  }
  storeMainGRef(ref) {
    this.g = ref;
  }
  storeCanvasRef(ref) {
    this.canvas = ref;
  }
  onWindowResize() {
    const { width, height } = this.svg.getBoundingClientRect();
    this.setState({ width, height });
  }
  componentDidMount() {
    window.addEventListener('resize', this.onWindowResize);
    this.onWindowResize();
    this.initZoom();
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
  }
  onZoomed() {
    const e = event;
    if (
      !e.sourceEvent ||
      (e.sourceEvent && e.sourceEvent.type === 'brush') ||
      (e.sourceEvent && e.sourceEvent.type === 'zoom')
    ) {
      return;
    }

    const transform = new Transform(
      e.transform.k,
      e.transform.x,
      e.transform.y
    );
    this.setState({
      transform
    });
    this.zoom.transform(select(this.g), transform);
  }
  onBrushed(e) {
    if (e.sourceEvent && e.sourceEvent.type === 'zoom') {
      console.log(e.sourceEvent);
      return;
    }

    const transform = new Transform(
      e.transform.k,
      e.transform.x *
        e.transform.k *
        (this.state.width / this.props.previewWidth),
      e.transform.y *
        e.transform.k *
        (this.state.width / this.props.previewWidth)
    );

    this.setState({
      transform
    });
    this.zoom.transform(select(this.g), transform);
  }
  initZoom() {
    const { height } = this.state;
    const { width } = this.state;
    const sourceHeight = scaleYSelector(this.props, this.state)(
      maxYSelector(this.props, this.state)
    );
    this.zoom = zoom()
      .scaleExtent([1, Infinity])
      .extent([[0, 0], [width, height]])
      .translateExtent([[0, 0], [width, sourceHeight || height]])
      .on('zoom', this.onZoomed);
    this.zoom(select(this.g));
  }
  componentDidUpdate(prevProps, prevState) {
    const sourceHeight = scaleYSelector(this.props, this.state)(
      maxYSelector(this.props, this.state)
    );
    const prevSourceHeight = scaleYSelector(prevProps, prevState)(
      maxYSelector(prevProps, prevState)
    );
    if (
      prevState.width !== this.state.width ||
      prevState.height !== this.state.height ||
      prevSourceHeight !== sourceHeight
    ) {
      this.initZoom();
    }
  }
  render() {
    const { transform } = this.state;
    return (
      <div style={{ height: '100%' }}>
        {false && <pre>{JSON.stringify({ transform }, null, 2)}</pre>}
        <svg
          width="100%"
          height="100%"
          style={{ userSelect: 'none' }}
          viewBox={`0 0 ${this.state.width} ${this.state.height}`}
          ref={this.storeRef}
        >
          <g ref={this.storeMainGRef}>
            <rect
              width={this.state.width}
              height={this.state.height}
              fill="none"
              style={{ pointerEvents: 'all' }}
            />
            {createElement(this.props.graph, {
              transform: this.state.transform,
              data: scaledNodesSelector(this.props, this.state)
            })}
          </g>
          <Preview
            x={this.state.width - this.props.previewWidth}
            y={0}
            width={this.props.previewWidth}
            preview={this.props.preview}
            onBrushed={this.onBrushed}
            height={previewHeightSelector(this.props, this.state)}
            sourceWidth={maxXSelector(this.props, this.state)}
            sourceHeight={maxYSelector(this.props, this.state)}
            selection={brushSelectionSelector(this.props, this.state)}
            data={previewNodesSelector(this.props, this.state)}
          />
        </svg>
        <canvas style={{ display: 'none' }} ref={this.storeCanvasRef} />
      </div>
    );
  }
}

export default ScalableGraph;
