// Disable prefer-reflect, for D3 axis.call()
/* eslint-disable prefer-reflect, no-invalid-this, func-names */

import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities modules
import * as AxisUtils from '../axis-utilities'
import * as XaxisHeader from '../xaxis-header'

class SilverXaxisOrdinal extends Component {
  static get defaultProps() {
    return {
      grpNames: {
        outerClass: 'axis-group',
        outerId: 'xaxis-group-',
      },
    }
  }

  componentDidMount() {
    this.doStringTests()
  }

  // Never gets called, in fact:
  componentDidUpdate() {
    this.doStringTests()
  }

  // GET TICK FORMAT
  // Returns
  getTickFormat(config, isPrimary) {
    // By default, use what you got (string, number)
    function defaultFormat(ddd) {
      return ddd
    }
    let tickFormat = defaultFormat
    // If we're non-time, just return that now:
    if (config.categoryType === 'string') {
      return tickFormat
    }
    // Still here? Time formats...
    const tFormats = config.timeFormats
    const interval = tFormats.interval
    const yearCount = config.yearCount
    // First year as 'yyyy';
    const firstYear = tFormats.firstYear
    // Format for mmm --> quarters
    function qFormat(ddd) {
      const mmm = ddd.getMonth()
      const qOne = 3
      const qTwo = 6
      const qThree = 9
      let result = 'Q4'
      if (mmm < qOne) {
        result = 'Q1'
      } else if (mmm < qTwo) {
        result = 'Q2'
      } else if (mmm < qThree) {
        result = 'Q3'
      }
      return result
    }
    // Format for years as 'yyyy' or 'yy'
    function yFormat(ddd) {
      let year = ddd.getFullYear()
      // First year stays yyyy
      // If less than set number of years, all stay yyyy
      if (yearCount > tFormats.yyyyThreshold) {
        // Otherwise, subsequent years go 'yy' --
        // unless it's a 'round' year...
        if (year !== firstYear) {
          if (!(year % tFormats.yyyyOn === 0)) {
            year = year.toString().substr(2, 2)
          }
        }
      }
      return year
    }
    // For 1000-adjusted dates/numbers:
    if (config.yearsAdjustedBy > 0) {
      return tickFormat
    }
    // ...unless it's a time axis,
    // when we impose D3 format from lookup, or qFormat
    if (config.categoryType === 'time') {
      // Primary axis (i.e. main row of ticks/labels)
      if (isPrimary) {
        if (tFormats.format === '%Y') {
          // Above a minimum number of years, we get format
          // if (config.)
          tickFormat = yFormat
        } else if (interval === 'quarters') {
          if (tFormats.format === '%b') {
            tickFormat = qFormat
          } else {
            tickFormat = d3.time.format(tFormats.format)
          }
        } else {
          tickFormat = d3.time.format(tFormats.format)
        }
        // There may be no 2ndary axis, so...
      } else if (typeof tFormats.secondFormat !== 'undefined') {
        if (tFormats.secondFormat === '%Y') {
          tickFormat = yFormat
        } else {
          tickFormat = d3.time.format(tFormats.secondFormat)
        }
      }
    }
    return tickFormat
  }
  // GET TICK FORMAT ends

  // GET INDEX DOT TWEAK
  // Called from calcTestForOnTicks and, in due course,
  // I think, calcTestForBetweenTicks, to return the
  // tweak for any index dot
  // NOTE: as of Jul'19, this doesn't get called. See
  // calcTestForOnTicks
  getIndexDotTweak(config) {
    let idTweak = 0
    // First, are series indexed?
    if (config.chartType === 'line' && config.isIndexed) {
      // Where is first point? For 'on' ticks this is, by
      // definition, zero. But for 'between', can it be
      // non-zero...? As of Jul'19, I'm not sure.
      const idPos = config.scale.range()[0]
      const idRad = config.indexed.radius
      idTweak = idRad - idPos
    }
    return idTweak
  }

  // CALC TEST FOR 'ON' TICKS
  // Puts 1ry/2ry formatted axis strings into an on-page text object and
  // measures their width.
  calcTestForOnTicks(config, testText, hasSecondaryAxis) {
    const forceTurn = config.forceTurn
    let leftTweak = 0
    let rightTweak = 0
    // NOTE: following comm'd-out section is just a stub, laid in, Jul'19,
    // for possible future use. Currently index dot tweaks are handled in
    // XaxisBlobs. That seems to work there, but it's
    // inconsistent and frankly daft. This needs an
    // eventual FIXME:
    // I need an array of tweaks for index dot; projecting line-end;
    // thermo markers; point-line dots; label -- if they exist!
    // I'll pack them all into this array, and use the max
    // const leftTweaksArray = [];
    // Index dot
    // leftTweaksArray.push(this.getIndexDotTweak(config));
    //
    const domain = config.scale.domain()
    const valA = domain[0]
    const valZ = domain[domain.length - 1]
    // Are there primary labels?
    const { showLabel } = config.granularity.primary
    if (showLabel) {
      // Format and plonk
      // Primary axis:
      const timeFormat = this.getTickFormat(config, true)
      let formattedPrimaryValA = timeFormat(valA)
      let formattedPrimaryValZ = timeFormat(valZ)
      if (config.firstLetterOnly) {
        formattedPrimaryValA = formattedPrimaryValA[0]
        formattedPrimaryValZ = formattedPrimaryValZ[0]
      }
      leftTweak = AxisUtils.getAxisLabelWidth(
        testText,
        formattedPrimaryValA,
        forceTurn,
        true
      )
      // I'm not overwhelmingly enthusiastic about next... but I need
      // some sort of test for the final value being in 'yy' format...
      if (config.timeFormats.interval === 'years') {
        if (+formattedPrimaryValZ - formattedPrimaryValA > 1) {
          // More than 2 years in the series...
          // So provided this isn't a forced yyyy (century, or whatever)
          if (+formattedPrimaryValZ % config.timeFormats.yyyyOn !== 0) {
            formattedPrimaryValZ = formattedPrimaryValZ.toString().substr(2, 2)
          }
        }
      }
      rightTweak = AxisUtils.getAxisLabelWidth(
        testText,
        formattedPrimaryValZ,
        forceTurn,
        false
      )
    }
    // Secondary axis
    let sWidthA = 0
    let sWidthZ = 0
    if (hasSecondaryAxis) {
      const timeFormat = this.getTickFormat(config, false)
      const formattedSecValA = timeFormat(valA)
      const formattedSecValZ = timeFormat(valZ)
      // If 2ry axis has a label on the first point:
      const fArray = config.secondaryAxisFilter
      if (fArray[0].label) {
        sWidthA = AxisUtils.getAxisLabelWidth(
          testText,
          formattedSecValA,
          forceTurn,
          true
        )
        if (sWidthA > leftTweak) {
          leftTweak = sWidthA
        }
      }
      // Label on last point?
      if (fArray[fArray.length - 1].label) {
        sWidthZ = AxisUtils.getAxisLabelWidth(
          testText,
          formattedSecValZ,
          forceTurn,
          false
        )
        if (sWidthZ > rightTweak) {
          rightTweak = sWidthZ
        }
      }
    }
    // Originally halved string width, but that's now
    // done by AxisUtils.getAxisLabelWidth
    // Now left checks against projection of thermometer marker, if any
    if (config.thermometer) {
      leftTweak = Math.max(leftTweak, config.thermoMargin)
    }
    return {
      left: leftTweak,
      right: rightTweak,
      leftTickFirstElement: false,
      rightTickLastElement: false,
    }
  }
  // CALC TEST FOR 'ON' TICKS ends

  // GET FIRST AND LAST TICK GAPS
  // Called from calcTestForBetweenTicks. Returns an object with
  // indices of the 2nd and last-but-one ticks in the primary or
  // secondary series filter
  getFirstAndLastTickGaps(myFilter, granularity) {
    const gaps = {}
    // Maybe there are cleverer ways of doing this... but I want the
    // indices of the 2nd and last-but-one ticks, to get the 'width'
    // of the first and last 'slots' between ticks
    for (let iii = 1; iii < myFilter.length; iii++) {
      if (myFilter[iii].tick) {
        gaps.leftPts = iii
        gaps.leftVal = iii * granularity.dataPointWidth
        break
      }
    }
    for (let iii = myFilter.length - 2; iii >= 0; iii--) {
      if (myFilter[iii].tick) {
        gaps.rightPts = myFilter.length - 1 - iii
        gaps.rightVal = gaps.rightPts * granularity.dataPointWidth
        break
      }
    }
    return gaps
  }
  // GET FIRST AND LAST TICK GAPS ends

  // CALC TEST FOR 'BETWEEN' TICKS
  // Called from doStringTests
  calcTestForBetweenTicks(
    config,
    granularity,
    tickWidth,
    testText,
    hasSecondaryAxis
  ) {
    // Assuming that the granularity fcn has done its stuff,
    // Distance that first/last datapoints are inside axis
    // This is default if first tick 'slot' is wider than first label
    let leftTweak = granularity.dataPointWidth / 2
    let rightTweak = granularity.dataPointWidth / 2
    // Flag if ticks are left/rightmost objects on axis
    // (i.e. labels don't project)
    let leftTickFirstElement = true
    let rightTickLastElement = true
    // May'21: trap 'unlabelled' intervals
    if (!granularity.interval.includes('unlabelled')) {
      // Get half string-widths, left and right:
      // NOTE: may need to revisit if/when calcTestForOnTicks changes...
      const strW = this.calcTestForOnTicks(config, testText, hasSecondaryAxis)
      // stringWidths is an obj with props left and right, each half a string's width
      const gaps = this.getFirstAndLastTickGaps(
        config.primaryAxisFilter,
        granularity
      )
      // gaps is an object with left and right gap point-counts and widths
      // NOTE: don't forget 2ry axis!!!
      // If the first label is wider than its tick-slot...
      if (strW.left > gaps.leftVal / 2) {
        // I adjust by the difference between string and slot widths, plus half the
        // distance from the first tick to the first data point
        // Seems to work...
        leftTweak =
          strW.left - gaps.leftVal / 2 + granularity.dataPointWidth / 2
        leftTickFirstElement = false
      }
      if (strW.right > gaps.rightVal / 2) {
        rightTweak =
          strW.right - gaps.rightVal / 2 + granularity.dataPointWidth / 2
        rightTickLastElement = false
      }
    }
    // But is there a better way of doing all this?
    return {
      left: leftTweak,
      right: rightTweak,
      leftTickFirstElement,
      rightTickLastElement,
    }
  }
  // CALC TEST FOR 'BETWEEN' TICKS ends

  // GET EXTRA LINE COUNT
  // Called from doStringTests. Returns the max number of forced lines
  // in category strings.
  // NOTE: this somewhat duplicates xaxis-ordinal.getLongestTurnedStringLength
  getExtraLineCount(config) {
    const strArray = config.categories
    const forceTurn = config.forceTurn
    let extra = 0
    for (let sNo = 0; sNo < strArray.length; sNo++) {
      const len = strArray[sNo].split(forceTurn).length - 1
      extra = Math.max(extra, len)
    }
    return extra
  }
  // GET EXTRA LINE COUNT ends

  // ADJUST BOUNDS WIDTH
  // Called from doStringTests
  adjustBoundsWidth(bounds, testText, config) {
    const granularity = Object.assign({}, config.granularity)
    // Is there a secondary axis?
    const hasSecondaryAxis = typeof granularity.secondary !== 'undefined'
    // Object returned
    let tweaks = {}
    // Are ticks 'on' or 'between'...?

    if (granularity.ticksOn) {
      // 'ON' ticks
      tweaks = this.calcTestForOnTicks(config, testText, hasSecondaryAxis)
    } else {
      // 'BETWEEN' ticks
      const tickW = config.tickPrefs.width
      tweaks = this.calcTestForBetweenTicks(
        config,
        granularity,
        tickW,
        testText,
        hasSecondaryAxis
      )
    }
    // On/between ticks rejoin here...
    let leftTweak = tweaks.left
    let rightTweak = tweaks.right

    // Consider clusterwidth, if this is a column chart...
    // OK, so this is headache-inducing. The 'tweak' is
    // a distance by which I have to move the inner box in,
    // left and right, to enclose the columns.
    // Axis points will come midway along a cluster.
    // For simplicity, I'll just talk about the left.
    // If halfclusterwidth > half the width of the first label,
    // I want to leave left edge of the IB where it is.
    // But if the first label is wider than a cluster, I need
    // to bring the IB in by the difference between them.
    //
    // I also need to adjust for width of v-thermo markers, so
    // I'll add the halfClusterWidth property there, too
    //
    // Get max of half label- and cluster-width
    const halfCluster = config.halfClusterWidth
    if (typeof halfCluster !== 'undefined') {
      leftTweak = Math.max(leftTweak, halfCluster)
      rightTweak = Math.max(rightTweak, halfCluster)
    }
    // Update bounds
    bounds.x += leftTweak
    bounds.width -= leftTweak + rightTweak

    // There's another tweak, of half tick strokewidth,
    // if 1st or last tick lies exactly on the chart edge
    if (tweaks.leftTickFirstElement) {
      bounds.x += config.tickPrefs.width / 2
      bounds.width -= config.tickPrefs.width
    }
    if (tweaks.rightTickLastElement) {
      bounds.width -= config.tickPrefs.width / 2
    }
    // I need half the width of a data-slot, before the bounds change
    // for the x-axis. This allows me to move ticks
    // into the correct position, between labels
    bounds.halfDataPointWidth = granularity.dataPointWidth / 2
  }
  // ADJUST BOUNDS WIDTH ends

  // ADJUST BOUNDS HEIGHT
  // Called from doStringTests
  adjustBoundsHeight(bounds, config) {
    const granularity = Object.assign({}, config.granularity)
    // Is there a secondary axis?
    const hasSecondaryAxis = typeof granularity.secondary !== 'undefined'
    // HEIGHT adjustment is based on number of 'lines' of labels.
    // FIXME: current assumption is that the scale is at bottom of chart
    // This'll need a fix... eventually
    let tHeight = 0
    if (config.categoryType === 'string') {
      // String axis: check for turned strings
      // Initially assume one line:
      tHeight = config.textPrefs.rowheight
      // Now adjust by leading
      const leading = config.textPrefs.leading
      const extraLines = this.getExtraLineCount(config)
      tHeight += extraLines * leading
    } else {
      // Time-series: check for primary and 2ry axes
      let labelLineCount = 0
      if (config.granularity.primary.showLabel) {
        labelLineCount = 1
      }
      if (hasSecondaryAxis) {
        labelLineCount++
      }
      tHeight = labelLineCount * config.textPrefs.rowheight
    }
    // Either way, adjust height. And a reminder, again, that I'm
    // assuming scale is at bottom...
    bounds.height -= tHeight
    // Allow for any axis header (initially just scatter charts)
    let headerMargin = 0
    if (config.header.length > 0) {
      headerMargin = XaxisHeader.getXaxisHeaderMargin(config)
    }
    const isTop = config.orient === 'top'
    if (isTop) {
      bounds.y += headerMargin
    }
    bounds.height -= headerMargin
  }
  // ADJUST BOUNDS HEIGHT ends

  // DO STRING TESTS
  // Drop text on the wrapper to determine what
  // extra margins we have to allow for.
  // Xaxis ordinal tests--
  //  - Width of first and last axis label
  //    But there are all sorts of issues regarding WHAT that last label is...
  //    Should I draw the entire axis with all labels and then see how far it
  //    projects left and right?
  //    NOTE: and what about any secondary axis...?
  //    NOTE: so far, I'm only testing primary axis...
  doStringTests() {
    const config = this.props.config
    // Append a text object to the main axis group
    const grpId = `${this.props.grpNames.outerId}${config.chartIndex}`
    const testText = AxisUtils.appendTestText(config, grpId)
    const bounds = config.bounds
    // WIDTH adjustments to bounds
    this.adjustBoundsWidth(bounds, testText, config)
    // HEIGHT
    this.adjustBoundsHeight(bounds, config)
    // Clear the text object...
    testText.remove()
    // And fire off the callback. Granularity has been a bit round the houses:
    //    Set in state as an empty object in a chart component. Populated in
    //    XaxisOrdinal.configXaxis. Passed here and used, then sent directly
    //    back up to chart component. A bit unsatisfactory...
    const result = {
      bounds,
      granularity: config.granularity,
    }
    this.props.onReturnRevisedInnerBox(result)
  }
  // DO STRING TESTS ends

  // RENDER axis group
  // Just draw the axis group
  render() {
    const config = this.props.config
    const grpNames = this.props.grpNames
    const cIndex = config.chartIndex
    const gClass = grpNames.outerClass
    const grpId = `${grpNames.outerId}${cIndex}`
    // Setting no fill prevents the SVG convertor from generating a path
    // outlining the group
    const gStyle = { fill: 'none' }
    return <g className={gClass} id={grpId} style={gStyle} />
  }
}

SilverXaxisOrdinal.propTypes = {
  config: PropTypes.object,
  grpNames: PropTypes.object,
  // Callback after test on stringwidth(s)
  onReturnRevisedInnerBox: PropTypes.func,
}

export default SilverXaxisOrdinal
