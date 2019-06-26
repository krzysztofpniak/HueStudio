import { createSelector } from 'reselect';
import { map, max, reduce, compose, divide, unless, always } from 'ramda';
import {
  getLinearScale,
  getLinearScaleXFromTransform,
  invert,
  getLinearScaleYFromTransform,
  getLinearFactor
} from './helpers';

const dataSelector = props => props.data;
const previewWidthSelector = props => props.previewWidth;
const rescaleSelector = props => props.rescaleFn;
const transformSelector = (props, state) => state.transform;
const widthSelector = (props, state) => state.width || 1;
const heightSelector = (props, state) => state.height || 1;

const maxXSelector = createSelector(
  dataSelector,
  data =>
    compose(
      reduce(max, 0),
      map(n => n.x + n.width + 15)
    )(data.children)
);

const domainXSelector = createSelector(
  maxXSelector,
  maxX => [0, maxX]
);

const scaleXSelector = createSelector(
  widthSelector,
  domainXSelector,
  (width, domain) => getLinearScale([0, width], domain)
);

const factorSelector = createSelector(
  widthSelector,
  domainXSelector,
  (width, domain) => getLinearFactor([0, width], domain)
);

const viewportScaleXSelector = createSelector(
  scaleXSelector,
  transformSelector,
  (scaleX, transform) =>
    compose(
      getLinearScaleXFromTransform(transform),
      scaleX
    )
);

const maxYSelector = createSelector(
  dataSelector,
  scaleXSelector,
  heightSelector,
  (data, scaleX, height) =>
    compose(
      unless(isFinite, always(1)),
      max(scaleX.invert(height)),
      reduce(max, 0),
      map(n => n.y + n.height + 15)
    )(data.children)
);

const domainYSelector = createSelector(
  maxYSelector,
  maxY => [0, maxY]
);

const aspectRatioSelector = createSelector(
  maxXSelector,
  maxYSelector,
  (maxX, maxY) => (maxX !== 0 && maxY !== 0 ? divide(maxX, maxY) : 1)
);

const scaleYSelector = createSelector(
  domainYSelector,
  widthSelector,
  aspectRatioSelector,
  (domain, width, aspectRatio) =>
    getLinearScale([0, width / aspectRatio], domain)
);

const viewportScaleYSelector = createSelector(
  scaleYSelector,
  transformSelector,
  (scaleY, transform) =>
    compose(
      getLinearScaleYFromTransform(transform),
      scaleY
    )
);

const scaledNodesSelector = createSelector(
  viewportScaleXSelector,
  viewportScaleYSelector,
  factorSelector,
  dataSelector,
  rescaleSelector,
  (sX, sY, factor, data, rescale) => rescale({ sX, sY, factor }, data)
);

const previewScaleXSelector = createSelector(
  previewWidthSelector,
  domainXSelector,
  (previewWidth, domainX) => getLinearScale([0, previewWidth], domainX)
);

const previewScaleYSelector = createSelector(
  previewWidthSelector,
  domainYSelector,
  aspectRatioSelector,
  (previewWidth, domainY, aspectRatio) =>
    getLinearScale([0, previewWidth / aspectRatio], domainY)
);

const previewNodesSelector = createSelector(
  previewScaleXSelector,
  previewScaleYSelector,
  factorSelector,
  dataSelector,
  rescaleSelector,
  (sX, sY, factor, data, rescale) => rescale({ sX, sY, factor }, data)
);

const previewHeightSelector = createSelector(
  previewWidthSelector,
  aspectRatioSelector,
  divide
);

const viewPortAspectRatioSelector = createSelector(
  maxXSelector,
  maxYSelector,
  heightSelector,
  (sourceWidth, sourceHeight, height) =>
    sourceWidth !== 0 && sourceHeight !== 0 ? divide(sourceWidth, height) : 1
);

const brushHeightSelector = createSelector(
  previewWidthSelector,
  viewPortAspectRatioSelector,
  divide
);

const brushSelectionSelector = createSelector(
  widthSelector,
  heightSelector,
  previewWidthSelector,
  brushHeightSelector,
  transformSelector,
  scaleYSelector,
  (width, height, previewWidth, brushHeight, transform, scaleY) =>
    map(
      compose(
        ([x, y]) => [x, scaleY.invert(y)],
        invert({
          ...transform,
          x: transform.x / (width / previewWidth),
          y: transform.y / (height / brushHeight)
        })
      ),
      [[0, 0], [previewWidth, brushHeight]]
    )
);

export {
  maxXSelector,
  maxYSelector,
  widthSelector,
  aspectRatioSelector,
  scaleXSelector,
  scaleYSelector,
  viewportScaleYSelector,
  previewScaleXSelector,
  previewScaleYSelector,
  scaledNodesSelector,
  previewNodesSelector,
  previewHeightSelector,
  brushHeightSelector,
  brushSelectionSelector
};
