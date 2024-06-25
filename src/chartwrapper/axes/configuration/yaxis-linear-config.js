// Assembles linear y-axis config object

import * as d3 from 'd3'
import * as BrokenScale from '../broken-scale'
import * as AxisUtilities from '../axis-utilities'

// Args are one chart definition from panelArray; and side ('left'/'right')
export default function(chartConfig, bounds, testFlag, side) {
  const yAxis = Object.assign({}, chartConfig.yAxis)
  const mmO = Object.assign({}, chartConfig.scales[side].minMaxObj.scale)
  const chartType = chartConfig.scales[side].type
  // But I need both left and right types
  const leftType = chartConfig.scales.left.type
  const rightType = chartConfig.scales.right.type
  const indexed = chartConfig.indexDot
  const stacked = chartConfig.scales[side].stacked
  const isLog = chartConfig.scales[side].log
  const invert = chartConfig.scales[side].invert
  // Kludge, June'24: if *either* scale inverts, set a flag to prevent
  // double scale charts breaking inverted scales
  let allowBrokenScale = true;
  if (chartConfig.scales.isDouble) {
    if (chartConfig.scales.left.invert || chartConfig.scales.right.invert) {
      allowBrokenScale = false;
    } 
  }
  const breakScaleObj = BrokenScale.makeBreakScaleObj(chartType, chartConfig);
  // If BS is allowd, and chart is not indexed, log-scale or inverted-scale...
  // if min val > 0, break scale:
  if (allowBrokenScale) {
    if (!indexed.indexFlag && !isLog && !invert) {
      if (mmO.min > 0) {
        breakScaleObj.break = true
        bounds.height -= breakScaleObj.padding
      }
    }
  }

  // NOTE: originalBounds was designed for barchart ordinal
  // y-axis, where I need to move cat strings back to original l/h edge
  // Maybe redundant, but you never know...
  const originalBounds = chartConfig.originalInnerBox
  // TEXT prefs
  const textPrefs = Object.assign({}, yAxis.text)
  textPrefs.emVal = chartConfig.emVal
  textPrefs.textFormat = AxisUtilities.scaleNumberFormat(mmO.increment)
  const isMixed = chartConfig.scales.isMixed
  // With double (not mixed) scale, there are some textPrefs overrides
  const isDouble = chartConfig.scales.isDouble
  const isScatter = chartConfig.scales[side].type.includes('scatter')
  const headers = {}
  if (isDouble) {
    const dPrefs = yAxis.doubleScale
    AxisUtilities.setDoubleScaleAxisColours(
      textPrefs,
      dPrefs,
      side,
      leftType,
      rightType
    )
    // Double scale font prefs
    AxisUtilities.setDoubleScaleAxisTextProps(textPrefs, dPrefs)
    // I also need to send in a couple of headers...
    headers.left = chartConfig.axisHeaders.yaxisleft
    headers.right = chartConfig.axisHeaders.yaxisright
  } else if (isScatter) {
    // Scatters currently using an arbitrary margin
    // I need something from DPs...
    textPrefs.headerMargin = yAxis.scatter.headerMargin
    headers.right = chartConfig.axisHeaders.yaxisright
    if (side === 'left') {
      headers.left = chartConfig.axisHeaders.yaxisleft
    }
  }
  // TICK prefs
  const tickPrefs = Object.assign({}, yAxis.ticks.default)

  // Then overwrite with style-specific prefs, which can be 'line',
  // 'column' or, awkwardly, 'mixed'...
  let styleName = chartType
  if (isDouble || isMixed) {
    styleName = 'mixed'
  }
  const styleSpecificPrefs = yAxis.ticks[styleName]
  if (typeof styleSpecificPrefs !== 'undefined') {
    Object.keys(styleSpecificPrefs).forEach((key) => {
      tickPrefs[key] = styleSpecificPrefs[key]
    })
  }
  // Add'nal prefs not inherited from defaults
  tickPrefs.tickDensity = mmO.tickDensity
  tickPrefs.tickValues = mmO.tickValues

  // For double scales, omit ticks on (arbitrary) left side...
  let drawTicks = true
  if (isDouble && side === 'left') {
    drawTicks = false
  }
  // Additional baseline
  const additionalBaseline = AxisUtilities.flagAdditionalBaseline(
    chartConfig,
    side
  )
  // NOTE: so tickPrefs goes in to the axis component as set out in lookup,
  // with style-specific overrides...
  const yAxisConfig = {
    additionalBaseline,
    bounds,
    breakScaleObj,
    chartIndex: chartConfig.chartIndex,
    chartType,
    colourLookup: chartConfig.colourLookup,
    drawTicks,
    duration: chartConfig.duration,
    enabled: true,
    forceTurn: chartConfig.forceTurn,
    headers,
    indexed,
    innerMargin: yAxis.margins.linearInnerMargin,
    noScaleInnerMargin: yAxis.margins.noScaleInnerMargin,
    invert,
    isDouble,
    isScatter,
    minVal: mmO.min,
    maxVal: mmO.max,
    orient: side,
    originalBounds,
    outerWidth: chartConfig.outerWidth,
    side,
    stacked,
    testFlag,
    textPrefs,
    tickPrefs,
    zeroPrefs: chartConfig.yAxis.ticks.zero,
  }
  // Mixed +/– flag:
  yAxisConfig.mixedVals = mmO.min < 0 && mmO.max >= 0
  // Assemble the scale object
  let domainArray = [mmO.min, mmO.max]
  if (invert) {
    domainArray = [mmO.max, mmO.min]
  }
  if (isLog) {
    yAxisConfig.scale = d3.scale
      .log()
      .range([bounds.height, 0])
      .domain(domainArray)
  } else {
    yAxisConfig.scale = d3.scale
      .linear()
      .range([bounds.height, 0])
      .domain(domainArray)
  }
  return yAxisConfig
}
