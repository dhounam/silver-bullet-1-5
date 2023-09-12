// Assembles config object for ordinal y-axis
// (bar and hthermo charts)

import * as d3 from 'd3'
import * as BrokenScale from '../broken-scale'
import * as AxisUtilities from '../axis-utilities'

export default function(chartConfig, bounds, testFlag) {
  const yAxis = Object.assign({}, chartConfig.yAxis)
  // Prefs for text...
  const textPrefs = Object.assign({}, yAxis.text)
  // ...and ticks
  const tickPrefs = Object.assign({}, yAxis.ticks.default)
  // Then overwrite with style-specific, which can be 'bar'
  // or 'thermohorizontal'; so...
  // (Is this such a good idea? Is there a better way...?)
  let tPrefs = yAxis.ticks.bar
  if (chartConfig.thermometer) {
    tPrefs = yAxis.ticks.thermohorizontal
  }
  if (typeof tPrefs !== 'undefined') {
    Object.keys(tPrefs).forEach((key) => {
      tickPrefs[key] = tPrefs[key]
    })
  }
  tickPrefs.tickCount = chartConfig.pointCount
  tickPrefs.tickPadding = yAxis.margins.ordinalInnerMargin
  // Get side:
  const side = AxisUtilities.getSide(chartConfig.scales)
  const chartType = chartConfig.scales[side].type
  // Broken scale?
  const minVal = chartConfig.scales[side].minMaxObj.scale.min
  const isLog = chartConfig.scales[side].log
  let breakScale = false
  if (minVal > 0 && !isLog) {
    breakScale = true
  }
  // Broken scale padding is different for bars and h-thermos
  const brokenScalePadding = BrokenScale.getYaxisBrokenScalePadding(
    chartType,
    chartConfig
  )
  const yAxisConfig = {
    bounds,
    breakScale,
    brokenScalePadding,
    categories: chartConfig.categories,
    categoryType: chartConfig.categoryType,
    chartIndex: chartConfig.chartIndex,
    chartType,
    colourLookup: chartConfig.colourLookup,
    duration: chartConfig.duration,
    emVal: chartConfig.emVal,
    forceTurn: chartConfig.forceTurn,
    orient: yAxis.orient[chartType],
    // Pre-margins x-pos for positioning left-aligned cat strings
    // NOTE: inferential?
    originalX: chartConfig.originalInnerBox.x,
    testFlag,
    textPrefs,
    tickPrefs,
  }
  // Y-SCALE
  // Get category column header, to identify each cat string in data:
  const catHead = chartConfig.headers[0]
  const yDomain = chartConfig.chartData.map((ddd) => ddd[catHead])
  // Offset from IB top and bottom:
  let tickOffset = 0
  if (chartConfig.thermometer) {
    const thermoDots = chartConfig.scales[side].thermoDots
    if (thermoDots) {
      // I'm assuming same radius/length for horiz and vert thermos
      tickOffset = chartConfig.series.thermohorizontal.dot.radius
    } else {
      tickOffset = chartConfig.series.thermohorizontal.line.length / 2
    }
  } else {
    tickOffset = AxisUtilities.getHalfClusterWidthForAxis(
      chartConfig,
      bounds,
      false
    )
  }
  // NOTE: but allow for font emsize?
  yAxisConfig.scale = d3.scale
    .ordinal()
    .domain(yDomain)
    .rangePoints([tickOffset, bounds.height - tickOffset], 0, 0)
  return yAxisConfig
}
