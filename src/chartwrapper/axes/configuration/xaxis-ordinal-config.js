// CONFIG X-AXIS ORDINAL
// Assembles ordinal x-axis config object

import * as d3 from 'd3'
// import * as BrokenScale from '../broken-scale';
import * as AxisUtilities from '../axis-utilities'
import * as Granularity from '../granularity'
import * as XaxisFilters from '../xaxis-filters'
import FixYearInDate from '../../chartside-utilities/fix-year'

// Params are the chart CO, the inner box, test flag
// granularity is undefined on first call
export default function(chartConfig, bounds, testFlag, granularity) {
  const xAxis = Object.assign({}, chartConfig.xAxis)
  const side = AxisUtilities.getSide(chartConfig.scales)
  const chartType = chartConfig.scales[side].type
  const isMixed = chartConfig.scales.isMixed
  const isDouble = chartConfig.scales.isDouble
  const isIndexed = chartConfig.indexDot.indexFlag
  const invert = chartConfig.scales[side].invert
  // TEXT prefs
  const textPrefs = Object.assign({}, xAxis.text)
  textPrefs.emVal = chartConfig.emVal
  // Axis needs to know about broken scale, left or right,
  // for baseline ends
  const breakScale = getBreakScaleObj(chartConfig.scales, side)
  // And original inner box
  const originalBounds = chartConfig.originalInnerBox
  // TICK prefs
  // We start with the defaults
  const tickPrefs = Object.assign({}, xAxis.ticks.default)
  // Then overwrite with style-specific prefs, which can be 'line',
  // 'column', thermohorizontal or, awkwardly, 'mixed'...
  let styleName = chartType
  if (isDouble || isMixed) {
    styleName = 'mixed'
  }
  const styleSpecificPrefs = xAxis.ticks[styleName]
  if (typeof styleSpecificPrefs !== 'undefined') {
    Object.keys(styleSpecificPrefs).forEach((key) => {
      tickPrefs[key] = styleSpecificPrefs[key]
    })
  }
  // Granularity is passed in as an empty object on test run. It gets
  // populated
  // Test text in main panel group:
  const grpId = `content-group-${chartConfig.chartIndex}`
  const testConfig = {
    textPrefs,
    hasSecondaryAxis: false,
  }
  const testText = AxisUtilities.appendTestText(testConfig, grpId)
  if (testFlag) {
    granularity = Granularity.getGranularity(
      bounds.width,
      chartConfig,
      testText,
      textPrefs
    )
  }
  testText.remove()
  tickPrefs.ticksOn = granularity.ticksOn
  tickPrefs.tickCount = chartConfig.pointCount
  // Granularity insert ends
  // Axis header
  const header = chartConfig.axisHeaders.xaxis
  textPrefs.header = chartConfig.xAxis.header
  const xAxisConfig = {
    bounds,
    // Flag that y-scale breaks
    breakScale,
    categories: chartConfig.categories,
    categoryType: chartConfig.categoryType,
    chartIndex: chartConfig.chartIndex,
    chartType,
    colourLookup: chartConfig.colourLookup,
    duration: chartConfig.duration,
    forceTurn: chartConfig.forceTurn,
    granularity,
    hasSecondaryAxis: false,
    header,
    indexed: chartConfig.indexDot,
    invert,
    isDouble,
    isIndexed,
    orient: xAxis.orient[chartType],
    originalBounds,
    outerWidth: chartConfig.outerWidth,
    pointCount: chartConfig.pointCount,
    side,
    testFlag,
    textPrefs,
    thermometer: chartConfig.thermometer,
    tickPrefs,
    // Object contains timeFormat/axis-row properties
    // For string cats, this is an empty object; but at least it exists...
    timeFormats: chartConfig.timeFormats,
    yearsAdjustedBy: chartConfig.yearsAdjustedBy,
  }
  // For l/r margins, we may need to know thermometer
  // marker width
  if (chartConfig.thermometer) {
    let thermoMargin = chartConfig.series.thermovertical.line.length / 2
    if (chartConfig.scales.right.thermoDots) {
      thermoMargin = chartConfig.series.thermovertical.dot.radius
    }
    xAxisConfig.thermoMargin = thermoMargin
  }
  // NOTE: kludge to see if I can override default time formats
  // NOTE: nasty check on integrity of 'granularity'. The trouble is,
  // I'm using this before xAxis-test has actually set it...
  //
  //
  // NOTE: FIX THIS
  if (typeof granularity.primary !== 'undefined') {
    xAxisConfig.timeFormats.format = granularity.primary.format
    // And check if we need to knock months back to "M" only...
    // ...but do I actually use this? I think it got dropped.
    xAxisConfig.firstLetterOnly = granularity.primary.firstLetterOnly
    xAxisConfig.timeFormats.yyyyOn = granularity.primary.yyyyOn
    xAxisConfig.timeFormats.yyyyThreshold = granularity.primary.yyyyThreshold
  }
  if (typeof granularity.secondary !== 'undefined') {
    xAxisConfig.timeFormats.secondFormat = granularity.secondary.format
    // NOTE: must be a better way to flag 2ndary axis on/off...
    xAxisConfig.hasSecondaryAxis = true
    xAxisConfig.timeFormats.yyyyOn = granularity.secondary.yyyyOn
    xAxisConfig.timeFormats.yyyyThreshold = granularity.secondary.yyyyThreshold
  }
  // Array of data: single-scale charts all look in the 'all' node
  const cData = chartConfig.chartData

  // Set filters on x-axis:
  XaxisFilters.getAnyAxisFilter(xAxisConfig, chartConfig, granularity)

  // NOTE: this just gets worse and worse!!! NOTE
  // The value I'm after is the number of labels along any years scale
  // At the moment, I'm updating 'granularity' by reference in
  // getAxisFilter, and now I'm passing it to something else! Basically,
  // I'm just making up properties as I go along. Among other things,
  // unless these conditions are true, the new properties are undefined...
  // FIX! (How??)
  if (typeof granularity.primary !== 'undefined') {
    xAxisConfig.yearCount = granularity.primary.yearCount
  }
  if (typeof granularity.secondary !== 'undefined') {
    xAxisConfig.yearCount = granularity.secondary.yearCount
  }

  // NOTE: if categoryType='strings', no filters are created
  // XaxisOrdinal is on the lookout for this...

  // DOMAIN
  // Date/category column header, to identify date/string in data:
  const catHead = chartConfig.headers[0]
  const xDomain = cData.map((ddd) => {
    let dataItem = ddd[catHead]
    if (chartConfig.categoryType === 'time') {
      // Work round Javascript date parsing issue...
      if (chartConfig.yearsAdjustedBy === 0) {
        dataItem = FixYearInDate(dataItem)
      }
    }
    return dataItem
  })
  // Column charts only need to allow for cluster width
  // Mod Apr'18 for mixed charts where one 'side' has columns...
  // ...hasColumns flag set in Editor.reconcileEditorToChartConfig
  if (testFlag && chartConfig.hasColumns) {
    // If chart is too narrow, clusterWidth and padding change
    const halfClusterWidth = AxisUtilities.getHalfClusterWidthForAxis(
      chartConfig,
      bounds,
      true
    )
    // Cluster width for calculating left/right margins:
    xAxisConfig.halfClusterWidth = halfClusterWidth
  } else if (testFlag && chartConfig.overallChartType === 'thermovertical') {
    // FIXME: mostly duplicated in ConfigYaxisOrdinal
    const thermoDots = chartConfig.scales[side].thermoDots
    let halfMarker = chartConfig.series.thermovertical.line.length / 2
    if (thermoDots) {
      halfMarker = chartConfig.series.thermovertical.dot.radius
    }
    xAxisConfig.halfClusterWidth = halfMarker
  }

  // xShift is half a 'slot'. If axis labels are 'between', this is
  // the distance that ticks move to the left. I only get this value
  // during the test-render, when I'm working with the width after allowing
  // for y-axis labels.
  // (If I did it on the 'real' render, I'd be calculating on the
  // width of the inner box after I've allowed for this value....)
  xAxisConfig.xShift = bounds.halfDataPointWidth
  xAxisConfig.scaleType = 'ordinal'
  xAxisConfig.scale = d3.scale
    .ordinal()
    .domain(xDomain)
    .rangePoints([0, bounds.width], 0, 0)
  return xAxisConfig
}
// CONFIG X-AXIS ORDINAL ends

// GET BREAK-SCALE OBJ
// Returns an object that flags left and right end
// positions for broken-scale baseline
export function getBreakScaleObj(scales, side) {
  const breakScale = {
    left: false,
    right: false,
  }
  const breaks = scales[side].minMaxObj.scale.min > 0
  if (scales.isDouble) {
    // Doublescale: if either side breaks, both do
    if (breaks) {
      breakScale.left = true
      breakScale.right = true
    }
  } else {
    // Single checks active 'side' only
    // (So far, this can only be 'right')
    breakScale[side] = breaks
  }
  return breakScale
}
// GET BREAK-SCALE OBJ ends
