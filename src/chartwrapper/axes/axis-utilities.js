// AXIS UTILITIES
// Functions shared by various chart-type components, to create
// config objects for linear/ordinal x/y-axes...

// We need D3 and ChartUtilities
import * as d3 from 'd3'

// SCALE NUMBER FORMAT
// Called by axis-config functions
// Passed scale increment, returns an approp D3 number format
// Cheap and cheerful. And may need separating into a double-
// process: dps, then format...
// NOTE: duped in BlobUtils.formatBlobVal
export function scaleNumberFormat(scaleIncr) {
  const numArray = scaleIncr.toString().split('.')
  // Always thou separators...
  // let snForm = ',f';
  let snForm = ','
  if (numArray.length > 1) {
    snForm = `,.${numArray[1].length}f`
  }
  return snForm
}
// SCALE NUMBER FORMAT ends

// GET SIDE
// Cheaply and cheerfully returns axis side. This
// needs a proper left/right/top/bottom fix eventually...
export function getSide(scales) {
  let side = 'left'
  if (scales.enableScale.right) {
    side = 'right'
  }
  return side
}
// GET SIDE ends

// GET HALF CLUSTER WIDTH FOR AXIS
// Called from xaxis-ordinal-config.
// Returns half width of a bar/column cluster
// so that we can adjust bounds. This duplicates
// ChartUtils.getSeriesClusterWidthAndPadding
export function getHalfClusterWidthForAxis(config, bounds, isCol) {
  // NOTE: is this necessary?
  let bound = bounds.height
  if (isCol) {
    bound = bounds.width
  }
  // Thermo, column or bar?
  let type = 'thermovertical'
  if (!config.thermometer) {
    if (isCol) {
      type = 'column'
    } else {
      type = 'bar'
    }
  }
  const defaultPadding = config.series[type].gap
  const pointCount = config.pointCount
  // Add up total amount of default padding
  const paddingTotal = (pointCount - 1) * defaultPadding
  // And get w/h of one cluster
  let clusterWidth = (bound - paddingTotal) / pointCount
  // But what if cluster is too narrow?
  const minWidth = config.series[type].minWidth
  const absoluteMinWidth = config.series[type].absoluteMinWidth
  const maxWidth = config.series[type].maxWidth
  const narrowGap = config.series[type].narrowGap
  // Check for min/max column width...
  if (clusterWidth < absoluteMinWidth) {
    clusterWidth = bound / pointCount
  } else if (clusterWidth < minWidth) {
    clusterWidth = bound / pointCount - narrowGap
  } else if (type === 'column' && clusterWidth > maxWidth) {
    // Only apply a max width to columns
    clusterWidth = maxWidth
  }
  // I only want half
  return clusterWidth / 2
}
// GET HALF CLUSTER WIDTH FOR AXIS ends

// GET BAR-THERMO GAP
// Called from ConfigYaxisOrdinal and, in Barchart,
// configBlobs
export function getBarThermoGap(config) {
  if (config.thermometer) {
    return config.series.thermohorizontal.gap
  }
  // Still here?
  return config.series.bar.gap
}
// GET BAR-THERMO GAP ends

// SET DOUBLE SCALE AXIS COLOURS
// Called from ConfigYaxisLinear, sets colours for left or right
// axis labels and header. Defaults to left and right colours; but
// if chart types differ (line/column), overrides with type-specific colours
export function setDoubleScaleAxisColours(
  textPrefs,
  dPrefs,
  side,
  leftType,
  rightType
) {
  // I want to set 2 props: fill and fillValue, according to side
  // Default is left/right
  const leftLine = leftType.includes('line')
  const rightLine = rightType.includes('line')
  // NOTE: no doubt I could be cleverer and duck this fork; but I
  // suspect it would make the code even more impenetrable...
  if (side === 'left') {
    // 'fill' is colour name, for Illustrator to pick up
    // 'fillValue' is actual hex val for browser display
    textPrefs.fill = dPrefs.fill.left
    textPrefs.fillValue = dPrefs.fill.leftVal
    // If series types differ...
    if (leftLine !== rightLine) {
      if (leftLine) {
        textPrefs.fill = dPrefs.fill.linealone
        textPrefs.fillValue = dPrefs.fill.linealoneVal
      } else {
        textPrefs.fill = dPrefs.fill.columnalone
        textPrefs.fillValue = dPrefs.fill.columnaloneVal
      }
    }
  } else {
    // Right axis
    textPrefs.fill = dPrefs.fill.right
    textPrefs.fillValue = dPrefs.fill.rightVal
    if (leftLine !== rightLine) {
      if (rightLine) {
        textPrefs.fill = dPrefs.fill.linealone
        textPrefs.fillValue = dPrefs.fill.linealoneVal
      } else {
        textPrefs.fill = dPrefs.fill.columnalone
        textPrefs.fillValue = dPrefs.fill.columnaloneVal
      }
    }
  }
}
// SET DOUBLE SCALE AXIS COLOURS ends

// SET DOUBLE SCALE AXIS TEXT PROPS
// Called from ConfigYaxisLinear
export function setDoubleScaleAxisTextProps(textPrefs, dPrefs) {
  textPrefs.font = dPrefs.font
  textPrefs.leading = dPrefs.leading
  textPrefs.size = dPrefs.size
  textPrefs.headerMargin = dPrefs.headerMargin
}
// SET DOUBLE SCALE AXIS TEXT PROPS ends

// CHECK PROPERTIES FOR ADDITIONAL BASELINE
// Called from flagAdditionalBaseline
// Arg is scale definition, left/right
// This is for y-axis only
export function checkPropertiesForAdditionalBaseline(scaleDef) {
  let baseFlag = false
  if (
    scaleDef.type.includes('column') ||
    scaleDef.type.includes('scatter') ||
    scaleDef.type.includes('thermo') ||
    scaleDef.stacked
  ) {
    if (scaleDef.minMaxObj.scale.min <= 0) {
      baseFlag = true
    }
  }
  return baseFlag
}
// CHECK PROPERTIES FOR ADDITIONAL BASELINE ends

// FLAG ADDITIONAL BASELINE
// Called from ConfigYaxisLinear. Determines whether the chart needs
// the additional baseline in front of the series
export function flagAdditionalBaseline(config, side) {
  let addBaseline = false
  // Mixed: test both sides
  // Single: just 'this' side
  // Test 'this' side:
  const thisSide = config.scales[side]
  addBaseline = checkPropertiesForAdditionalBaseline(thisSide)
  // Now mixed (only if not already set)
  if (!addBaseline) {
    if (config.scales.isMixed || config.scales.isDouble) {
      let otherSideName = 'right'
      if (side === 'right') {
        otherSideName = 'left'
      }
      const otherSide = config.scales[otherSideName]
      addBaseline = checkPropertiesForAdditionalBaseline(otherSide)
    }
  }
  return addBaseline
}
// FLAG ADDITIONAL BASELINE ends

// APPEND TEST TEXT
// Called from axis component string-tests. Passed
// the config object and a group, draws a text
// object into which test strings are injected
// (caller removes)
export function appendTestText(config, contextId) {
  const axisGroup = d3.select(`#${contextId}`)
  // Text object
  const testText = axisGroup
    .append('text')
    .attr('id', 'testText')
    .style({
      'font-family': config.textPrefs.font,
      'font-size': () => {
        let size = config.textPrefs.size.primaryOnly
        if (config.hasSecondaryAxis) {
          size = config.textPrefs.size.primaryIfSecondary
        }
        return `${size}px`
      },
      fill: config.textPrefs.fillValue,
    })
  return testText
}
// APPEND TEST TEXT ends

// APPEND IN-FRONT TICK
// Draws the additional tick in front of series, x or y axis.
//  Called from linear axis components
//    Arg 1 is calling component's config object
//    Arg 2 is true for yaxis/column, false for xaxis/bar
//    Arg 3 contains coords for line ends
export function appendInFrontTick(config, isHorizontal, points) {
  const zPrefs = config.tickPrefs.zero
  const start = points.start
  const end = points.end
  const scaleVal = points.scaleVal
  const duration = config.duration
  // How will the zero line appear?
  let zColVal = zPrefs.simpleValue
  let zColName = zPrefs.simple
  if (config.mixedVals) {
    zColVal = zPrefs.mixedValue
    zColName = zPrefs.mixed
  }
  const zClass = 'axis-zero-line'
  const zId = `${zClass}~~~stroke:${zColName}`
  const zThickness = zPrefs.width
  // Use a separate group so this lies above the series
  const zeroGrp = `.zeroline-group-${config.chartIndex}`
  // Bind data
  const zBinding = d3
    .select(zeroGrp)
    .selectAll(zClass)
    .data([0])
  // If there's already a zero line (double scales), tiptoe away now
  if (config.isDouble && zBinding[0].parentNode.childElementCount > 0) {
    return
  }
  // ENTER
  zBinding.enter().append('line')
  // NOTE. This works with +/– values, but I haven't
  // looked at broken scales yet
  // (Although if scale breaks, the zero line will vanish somewhere off-chart...)
  zBinding
    .transition()
    .duration(duration)
    .attr({
      class: zClass,
      x1: () => {
        let val = start
        if (!isHorizontal) {
          val = scaleVal
        }
        return val
      },
      x2: () => {
        let val = end
        if (!isHorizontal) {
          val = scaleVal
        }
        return val
      },
      y1: () => {
        let val = start
        if (isHorizontal) {
          val = scaleVal
        }
        return val
      },
      y2: () => {
        let val = end
        if (isHorizontal) {
          val = scaleVal
        }
        return val
      },
      id: zId,
    })
    .style({
      'stroke-width': zThickness,
      stroke: zColVal,
    })

  zBinding.exit().remove()
}
// APPEND IN-FRONT TICK ends

// FIX NEGATIVE LABELS
// Called from XaxisLinear.updateXaxis and
// XaxisOrdinal.updatePrimaryXaxis
// Adjust position of negative labels,
// to centre-align on the number
export function fixNegativeLabels(axisGroup) {
  axisGroup.selectAll('text').each(function(ddd) {
    const thisLab = d3.select(this)
    // Now that this is called from XaxisOrdinal, we have
    // to check for dates (which evaluate to < 0), too
    if (typeof ddd !== 'object' && +ddd < 0) {
      thisLab.attr('x', () => {
        let xVal = thisLab.attr('x')
        // Get width of label with '-'. Then re-measure
        // without the '-' and adjust by half. Not
        // overwhelmingly efficient, but shouldn't be
        // a big drag
        // (Keep value as a string)
        const originalVal = thisLab.text()
        const widA = thisLab.node().getComputedTextLength()
        thisLab.text(originalVal.substring(1))
        const widB = thisLab.node().getComputedTextLength()
        const halfMinus = (widA - widB) / 2
        thisLab.text(originalVal)
        xVal -= halfMinus
        return xVal
      })
    }
  })
}
// FIX NEGATIVE LABELS ends

// GET AXIS LABEL WIDTH
// Called from XaxisOrdinal and XaxisLinear, to get width
// of first or last axis label, for margin adjustment
export function getAxisLabelWidth(testObj, tVal, forceTurn, isFirst) {
  // Fork on whether text turns, in which case
  // check width of each 'line'
  const textTurns = tVal.toString().includes(forceTurn)
  let valArray = [tVal]
  if (textTurns) {
    valArray = tVal.split(forceTurn)
  }
  let labelWidth = 0
  // Loop on 'lines'
  for (let vNo = 0; vNo < valArray.length; vNo++) {
    const thisVal = valArray[vNo]
    let minusAdj = 0
    // Get line width
    testObj.text(thisVal)
    let tWidth = testObj.node().getBBox().width
    if (!textTurns) {
      // If text doesn't turn (i.e. it's a simple label)
      // and first val < 0, allow for the width of the '-'
      // Ticks will subsequently align to centre of value without '-'
      let unMinusWidth = 0
      if (isFirst && tVal < 0) {
        // Measure without any minus
        testObj.text(Math.abs(tVal))
        unMinusWidth = testObj.node().getComputedTextLength()
        // Difference between absolute and minus val, if any
        minusAdj = (tWidth - unMinusWidth) / 2
        // But, inferentially:
        minusAdj -= 0.28
      }
    }
    // NOTE: assumption that xaxis strings are centre-aligned
    // (minusAdj is always zero for split labels)
    tWidth /= 2
    tWidth += minusAdj
    labelWidth = Math.max(labelWidth, tWidth)
  }
  return labelWidth
}
// GET AXIS LABEL WIDTH

// GET LINEAR AXIS TICK FORMAT
// Conditional tick label formatter forces zeros to "0"
export function getLinearAxisTickFormat(val, fStr) {
  if (val.toString() === '0') {
    fStr = 'f'
  }
  const myFormatter = d3.format(fStr)
  return myFormatter(val)
}
// GET LINEAR AXIS TICK FORMAT ends
