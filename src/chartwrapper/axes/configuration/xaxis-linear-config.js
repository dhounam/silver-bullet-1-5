// CONFIG X-AXIS LINEAR
// Assembles x-axis config object for a linear axis:
// bars, hthermos and scatters

import * as d3 from 'd3';
import * as ScatterZKey from '../../scatterchart/scatterzkey';
import * as BrokenScale from '../broken-scale';
import * as AxisUtilities from '../axis-utilities';

// Arg 1: one chart definition from panelArray
// 2: inner box
// 3: flags whether test render, or 'live'
// eslint-disable-next-line import/no-anonymous-default-export
export default function(chartConfig, bounds, testFlag) {
  const xAxis = Object.assign({}, chartConfig.xAxis);
  // FIXME: this is wretched:
  let side = '';
  if (chartConfig.scales.left.type.includes('scatter')) {
    side = 'left';
  } else {
    side = AxisUtilities.getSide(chartConfig.scales);
  }
  const isLog = chartConfig.scales[side].log;
  const mmO = Object.assign({}, chartConfig.scales[side].minMaxObj.scale);
  const chartType = chartConfig.scales[side].type;
  // Blobs?
  const hasBlobs = chartConfig.blobs.hasBlobs;
  // Broken scale...?
  const breakScaleObj = BrokenScale.makeBreakScaleObj(chartType, chartConfig);
  // (No index check on a linear x-axis)
  if (mmO.min > 0 && !isLog) {
    if (testFlag) {
      bounds.x += breakScaleObj.padding;
      bounds.width -= breakScaleObj.padding;
    }
    breakScaleObj.break = true;
  }
  // Prefs for text...
  const textPrefs = Object.assign({}, xAxis.text);
  // (Fcn above)
  textPrefs.textFormat = AxisUtilities.scaleNumberFormat(mmO.increment);
  textPrefs.emVal = chartConfig.emVal;
  // ...and for ticks
  // We start with the defaults
  const tickPrefs = Object.assign({}, xAxis.ticks.default);
  // Then overwrite with style-specific:
  const barPrefs = xAxis.ticks.bar;
  if (typeof barPrefs !== 'undefined') {
    Object.keys(barPrefs).forEach(key => {
      tickPrefs[key] = barPrefs[key];
    });
  }
  // Axis header and additional baseline flag
  let header = '';
  let additionalBaseline = false;
  let scatterDotProps = {};
  // Broken scale padding is different for bars and h-thermos
  const brokenScalePadding = BrokenScale.getYaxisBrokenScalePadding(
    chartType,
    chartConfig,
  );
  if (chartType.includes('scatter')) {
    header = chartConfig.axisHeaders.xaxis;
    textPrefs.header = chartConfig.xAxis.header;
    additionalBaseline = true;
    // For any dot projection, scatters need
    // min actual x-value, and dot radius.
    // Also z-value and -scale for sized scatters
    let dotRad = 0;
    let xMin = chartConfig.scales[side].minMaxObj.actual.min;
    if (chartType === 'sizedscatter') {
      // Fake a specific config object, with scale- and
      // actual-max, to get a D3 scale
      const zScaleProps = chartConfig.scales.z;
      const zConfig = {
        zAxisBounds: { max: zScaleProps.max },
        maxZval: zScaleProps.actualMax,
      };
      const zScale = ScatterZKey.getSizedDotScale(zConfig);
      // Now I have to isolate one or more points with min
      // x-value. Then narrow down to the one with the
      // biggest z-value. So it's the leftmost dot with
      // biggest radius...
      const dotProps = ScatterZKey.getMinXandZvalues(
        chartConfig.chartData,
        chartConfig.headers,
      );
      // Radius can't be < 0 (in case neg value)
      dotRad = Math.max(zScale(dotProps.z) / 2, 0);
      xMin = dotProps.x;
    } else {
      dotRad = chartConfig.series.scatter.dots.fixedRadius;
    }
    // So obj with:
    //    min x value
    //    radius of dot
    scatterDotProps = {
      minVal: xMin,
      dotRad,
    };
  }
  // Add'nal prefs not inherited from defaults
  tickPrefs.tickDensity = mmO.tickDensity;
  tickPrefs.tickValues = mmO.tickValues;
  const xAxisConfig = {
    // NOTE: hard-wired to 'left'. Need this for any
    // bar projection
    actualMaxVal: chartConfig.scales.left.minMaxObj.actual.max,
    additionalBaseline,
    bounds,
    breakScaleObj,
    brokenScalePadding,
    chartIndex: chartConfig.chartIndex,
    chartType,
    colourLookup: chartConfig.colourLookup,
    duration: chartConfig.duration,
    factor: chartConfig.scales[side].factor,
    forceTurn: chartConfig.forceTurn,
    hasBlobs,
    hasSecondaryAxis: false,
    header,
    minVal: mmO.min,
    maxVal: mmO.max,
    orient: xAxis.orient[chartType],
    side,
    scatterDotProps,
    textPrefs,
    tickPrefs,
    zeroPrefs: chartConfig.yAxis.ticks.zero,
  };
  // Mixed +/– flag (including if max >= 0)
  xAxisConfig.mixedVals = mmO.min < 0 && mmO.max >= 0;
  // Assemble the x-scale object
  if (isLog) {
    xAxisConfig.scale = d3.scale
      .log()
      .range([0, bounds.width])
      .domain([mmO.min, mmO.max]);
  } else {
    xAxisConfig.scale = d3.scale
      .linear()
      .range([0, bounds.width])
      .domain([mmO.min, mmO.max]);
  }
  return xAxisConfig;
}
// CONFIG X-AXIS LINEAR ends
