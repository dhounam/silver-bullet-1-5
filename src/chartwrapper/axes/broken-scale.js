// Utilities to identify and carry out broken scales

// GET Y-AXIS BROKEN SCALE PADDING
// Called from MixedChart, ScatterChart and VthermoChart.
// Also internally.
// Broken scale padding is different for bars and h-thermos
export function getYaxisBrokenScalePadding(chartType, config) {
  let brokenScalePadding = config.yAxis.brokenScalePadding.default;
  if (chartType.includes('thermo')) {
    brokenScalePadding = config.yAxis.brokenScalePadding.thermoHorizontal;
  }
  return brokenScalePadding;
}
// GET Y-AXIS BROKEN SCALE PADDING

// DOES Y-AXIS BREAK ON SCATTER
// Called from makeBreakScaleObj, since padding of xaxis labels
// changes if scatter  y-axis breaks
export function doesYaxisBreakOnScatter(chartType, config) {
  let yAxisBreaks = false;
  if (chartType.includes('scatter')) {
    // Inferential!
    const scaleMin = config.scales.right.minMaxObj.scale.min;
    const isLog = config.scales.right.log;
    yAxisBreaks = scaleMin > 0 && !isLog;
  }
  return yAxisBreaks;
}
// DOES Y-AXIS BREAK ON SCATTER

// FACTOR BSS POINTS
// Responsive DCs draw BS symbol at 200%
export function factorBssPoints(points, factor) {
  if (factor === 1) {
    return points;
  }
  // Still here? Clone (coz this gets called 2x: test and live) and factor
  const pts = points.map(onePt => {
    const ptObj = {
      x: onePt.x * factor,
      y: onePt.y * factor,
    };
    return ptObj;
  });
  return pts;
}
// FACTOR BSS POINTS ends

// MAKE BREAK-SCALE OBJECT
// Called from configX/YaxisLinear to assemble
// the properties for a BS symbol
export function makeBreakScaleObj(chartType, config) {
  const bss = config.brokenScaleSymbol;
  const padding = getYaxisBrokenScalePadding(chartType, config);
  const scatterYaxisBreaks = doesYaxisBreakOnScatter(chartType, config);
  // Size determines origin if right-aligned
  // const bsSizeFactor = config.brokenScaleFactors?.size
  // Prev doesn't work for me, so substituted:
  const bsSizeFactor = config.brokenScaleFactors
    ? config.brokenScaleFactors.size
    : undefined;
  const points = factorBssPoints(bss.points, bsSizeFactor);
  // Width of entire symbol: x-val of final point
  const origin = points[points.length - 1].x;
  // Strokewidth
  // const bsWidthFactor = config.brokenScaleFactors?.strokewidth;
  // Again, substitute:
  const bsWidthFactor = config.brokenScaleFactors
    ? config.brokenScaleFactors.strokewidth
    : undefined;
  const width = bss.width * bsWidthFactor;
  // NOTE: should also check if 'break' is T/F here, rather than
  // after return to caller
  return {
    break: false,
    linejoin: bss.linejoin,
    noSymbol: bss.noSymbol,
    origin,
    padding,
    points,
    horizontalPaddingToXaxisLabel: bss.horizontalPaddingToXaxisLabel,
    scatterYaxisBreaks,
    strokeName: bss.strokeName,
    strokeValue: bss.strokeValue,
    width,
  };
  // 'width' here is strokeWidth
}
// MAKE BREAK-SCALE OBJECT ends

// CHECK FOR BROKEN SCALE
// Called from X/YaxisLinear.drawBreakSymbol. Check whether
// charttype is in a list of 'noSymbol' types
export function checkForBrokenScaleSymbol(chartType, breakObj) {
  let drawSymbol = true;
  const noSymbArray = breakObj.noSymbol;
  for (let sNo = 0; sNo < noSymbArray.length; sNo++) {
    const type = noSymbArray[sNo];
    if (chartType.includes(type)) {
      drawSymbol = false;
      break;
    }
  }
  return drawSymbol;
}
// CHECK FOR BROKEN SCALE ends
