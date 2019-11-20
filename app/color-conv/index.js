import { map, max } from 'ramda';

const RED = 0;
const GREEN = 1;
const BLUE = 2;

const X = 0;
const Y = 1;

// LivingColors Iris, Bloom, Aura, LightStrips
const GamutA = [[0.704, 0.296], [0.2151, 0.7106], [0.138, 0.08]];

// Hue A19 bulbs
const GamutB = [[0.675, 0.322], [0.4091, 0.518], [0.167, 0.04]];

// Hue BR30, A19 (Gen 3), Hue Go, LightStrips plus
const GamutC = [[0.692, 0.308], [0.17, 0.7], [0.153, 0.048]];

const getLightGamut = modelId => {
  /*Gets the correct color gamut for the provided model id.
  Docs: http://www.developers.meethue.com/documentation/supported-lights
  */
  if (
    [
      'LST001',
      'LLC010',
      'LLC011',
      'LLC012',
      'LLC006',
      'LLC007',
      'LLC013'
    ].includes(modelId)
  ) {
    return GamutA;
  } else if (
    ['LCT001', 'LCT007', 'LCT002', 'LCT003', 'LLM001'].includes(modelId)
  ) {
    return GamutB;
  } else if (
    ['LCT010', 'LCT014', 'LCT011', 'LLC020', 'LST002'].includes(modelId)
  ) {
    return GamutC;
  }
  throw 'Unknown gamut';
};

const decToHex = rgb => {
  const hex = Number(rgb).toString(16);

  return hex.length < 2 ? '0' + hex : hex;
};

const hexToRed = hex => parseInt(hex.substring(0, 2), 16);

const hexToGreen = hex => parseInt(hex.substring(2, 4), 16);

const hexToBlue = hex => parseInt(hex.substring(4, 6), 16);

const hexToRgb = h => [hexToRed(h), hexToGreen(h), hexToBlue(h)];

const rgbToHex = (r, g, b) => `${decToHex(r)}${decToHex(g)}${decToHex(b)}`;

const crossProduct = (p1, p2) => p1[X] * p2[Y] - p1[Y] * p2[X];

const checkPointInLampsReach = gamut => p => {
  //Check if the provided XYPoint can be recreated by a Hue lamp.//
  const v1 = [gamut[GREEN][X] - gamut[RED][X], gamut[GREEN][Y] - gamut[RED][Y]];
  const v2 = [gamut[BLUE][X] - gamut[RED][X], gamut[BLUE][Y] - gamut[RED][Y]];

  const q = [p[X] - gamut[RED][X], p[Y] - gamut[RED][Y]];
  const s = crossProduct(q, v2) / crossProduct(v1, v2);
  const t = crossProduct(v1, q) / crossProduct(v1, v2);

  return s >= 0.0 && t >= 0.0 && s + t <= 1.0;
};

const getClosestPointToLine = (A, B, P) => {
  //Find the closest point on a line. This point will be reproducible by a Hue lamp.//
  const AP = [P[X] - A[X], P[Y] - A[Y]];
  const AB = [B[X] - A[X], B[Y] - A[Y]];
  const ab2 = AB[X] * AB[X] + AB[Y] * AB[Y];
  const ap_ab = AP[X] * AB[X] + AP[Y] * AB[Y];
  let t = ap_ab / ab2;

  if (t < 0.0) {
    t = 0.0;
  } else if (t > 1.0) {
    t = 1.0;
  }

  return [A[X] + AB[X] * t, A[Y] + AB[Y] * t];
};

const getClosestPointToPoint = gamut => xy_point => {
  // Color is unreproducible, find the closest point on each line in the CIE 1931 'triangle'.
  const pAB = getClosestPointToLine(gamut[RED], gamut[GREEN], xy_point);
  const pAC = getClosestPointToLine(gamut[BLUE], gamut[RED], xy_point);
  const pBC = getClosestPointToLine(gamut[GREEN], gamut[BLUE], xy_point);

  // Get the distances per point and see which point is closer to our Point.
  const dAB = getDistanceBetweenTwoPoints(xy_point, pAB);
  const dAC = getDistanceBetweenTwoPoints(xy_point, pAC);
  const dBC = getDistanceBetweenTwoPoints(xy_point, pBC);

  let lowest = dAB;
  let closest_point = pAB;

  if (dAC < lowest) {
    lowest = dAC;
    closest_point = pAC;
  }

  if (dBC < lowest) {
    lowest = dBC;
    closest_point = pBC;
  }

  return closest_point;
};

const getDistanceBetweenTwoPoints = (one, two) => {
  //Returns the distance between two XYPoints.//
  const dx = one[X] - two[X];
  const dy = one[Y] - two[Y];
  return Math.sqrt(dx * dx + dy * dy);
};

const getXYPointFromRgb = gamut => (red_i, green_i, blue_i) => {
  /*Returns an XYPoint object containing the closest available CIE 1931 x, y coordinates
    based on the RGB input values.*/

  const red = red_i / 255.0;
  const green = green_i / 255.0;
  const blue = blue_i / 255.0;

  const r =
    red > 0.04045 ? ((red + 0.055) / (1.0 + 0.055)) ** 2.4 : red / 12.92;

  const g =
    green > 0.04045 ? ((green + 0.055) / (1.0 + 0.055)) ** 2.4 : green / 12.92;
  const b =
    blue > 0.04045 ? ((blue + 0.055) / (1.0 + 0.055)) ** 2.4 : blue / 12.92;

  const X = r * 0.664511 + g * 0.154324 + b * 0.162028;
  const Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
  const Z = r * 0.000088 + g * 0.07231 + b * 0.986039;

  const cx = X / (X + Y + Z);
  const cy = Y / (X + Y + Z);

  // Check if the given XY value is within the colour reach of our lamps.
  let xy_point = [cx, cy];
  const in_reach = checkPointInLampsReach(gamut)(xy_point);

  if (!in_reach) {
    xy_point = getClosestPointToPoint(gamut)(xy_point);
  }

  return xy_point;
};

const getRgbFromXYAndBrightness = gamut => (xy, bri = 1) => {
  // The xy to color conversion is almost the same, but in reverse order.
  // Check if the xy value is within the color gamut of the lamp.
  // If not continue with step 2, otherwise step 3.
  // We do this to calculate the most accurate color the given light can actually do.
  let xy_point = xy;

  if (!checkPointInLampsReach(gamut)(xy_point)) {
    // Calculate the closest point on the color gamut triangle
    // and use that as xy value See step 6 of color to xy.
    xy_point = getClosestPointToPoint(gamut)(xy_point);
  }

  // Calculate XYZ values Convert using the following formulas:
  const Y = bri;
  const X = (Y / xy_point[Y]) * xy_point[X];
  const Z = (Y / xy_point[Y]) * (1 - xy_point[X] - xy_point[X]);

  // Convert to RGB using Wide RGB D65 conversion
  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

  // Apply reverse gamma correction
  [r, g, b] = map(
    x =>
      x <= 0.0031308
        ? 12.92 * x
        : (1.0 + 0.055) * Math.pow(x, 1.0 / 2.4) - 0.055,
    [r, g, b]
  );

  // Bring all negative components to zero
  [r, g, b] = map(x => max(0, x), [r, g, b]);

  // If one component is greater than 1, weight components by that value.
  const max_component = max(max(r, g), b);

  if (max_component > 1) {
    [r, g, b] = map(x => x / max_component, [r, g, b]);
  }

  [r, g, b] = map(x => Math.floor(x * 255), [r, g, b]);

  // Convert the RGB values to your color object The rgb values from the above formulas are between 0.0 and 1.0.
  return [r, g, b];
};

const rgbToXY = gamut => (red, green, blue) => {
  return getXYPointFromRgb(gamut)(red, green, blue);
};

const hexToXY = gamut => h => {
  /*Converts hexadecimal colors represented as a String to approximate CIE
      1931 x and y coordinates.
      */
  const rgb = hexToRgb(h);
  return rgbToXY(gamut)(rgb[0], rgb[1], rgb[2]);
};

const xyToHex = gamut => (x, y, bri = 1) => {
  /*Converts CIE 1931 x and y coordinates and brightness value from 0 to 1
        to a CSS hex color.*/
  const [r, g, b] = getRgbFromXYAndBrightness(gamut)(x, y, bri);
  return rgbToHex(r, g, b);
};

const xyToRgb = gamut => (xy, bri = 1) =>
  getRgbFromXYAndBrightness(gamut)(xy, bri);

export {
  GamutA,
  GamutB,
  GamutC,
  hexToXY,
  rgbToXY,
  xyToHex,
  xyToRgb,
  checkPointInLampsReach,
  getClosestPointToPoint
};
