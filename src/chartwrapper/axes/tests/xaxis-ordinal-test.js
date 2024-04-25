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
  // Called from getFirstAndLastLabelHalfWidths and, in due course,
  // I think, calcMarginsForLabelsBetweenTicks, to return the
  // tweak for any index dot
  // NOTE: as of Jul'19, this doesn't get called. See
  // getFirstAndLastLabelHalfWidths
  getIndexDotTweak(config) {
    let idRad = 0
    // First, are series indexed?
    if (config.chartType === 'line' && config.isIndexed) {
      idRad = config.indexed.radius * config.indexed.idFactor
    }
    return idRad
  }

  // GET FIRST AND LAST LABEL HALFWIDTHS
  // Puts 1ry/2ry formatted axis strings into an on-page text object and
  // measures their width.
  getFirstAndLastLabelHalfWidths(
    config,
    testText,
    hasSecondaryAxis,
    primaryGaps,
    secondaryGaps,
  ) {
    const forceTurn = config.forceTurn
    let elementA = primaryGaps.firstLabelIndex;
    let elementB = primaryGaps.lastLabelIndex;
    const result = {
      primary: {
        left: 0,
        right: 0,
        leftTickFirstElement: false,
        rightTickLastElement: false,
      },
      secondary: {
        left: 0,
        right: 0,
        leftTickFirstElement: false,
        rightTickLastElement: false,
      },
    }
    // let leftTweak = 0
    // let rightTweak = 0
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
    // NO: GET THE RIGHT VALUE
    let valA = domain[elementA]
    let valZ = domain[elementB]
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
      result.primary.left= AxisUtils.getAxisLabelWidth(
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
      result.primary.right = AxisUtils.getAxisLabelWidth(
        testText,
        formattedPrimaryValZ,
        forceTurn,
        false,
      )
    }
    // Secondary axis
    if (hasSecondaryAxis) {
      // Update size of testText
      testText.style({
        'font-size': config.textPrefs.size.secondary,
      })
      elementA = secondaryGaps.firstLabelIndex;
      elementB = secondaryGaps.lastLabelIndex;
      valA = domain[elementA]
      valZ = domain[elementB]
      const timeFormat = this.getTickFormat(config, false)
      const formattedSecValA = timeFormat(valA)
      const formattedSecValZ = timeFormat(valZ)
      // If 2ry axis has a label on the first point:
      const fArray = config.secondaryAxisFilter
      if (fArray[elementA].label) {
        result.secondary.left = AxisUtils.getAxisLabelWidth(
          testText,
          formattedSecValA,
          forceTurn,
          true,
        )
      }
      // Label on last point?
      if (fArray[elementB].label) {
        result.secondary.right = AxisUtils.getAxisLabelWidth(
          testText,
          formattedSecValZ,
          forceTurn,
          false,
        )
      }
    }
    // Now primary left check against projection of thermometer marker, if any
    // (Do I need to check secondary?)
    if (config.thermometer) {
      result.primary.left = Math.max(result.primary.left, config.thermoMargin)
    }
    return result;
  }
  // GET FIRST AND LAST LABEL HALF0WIDTHS ends

  // GET FIRST AND LAST LABEL MARGINS
  // Called from adjustBoundsWidth. Returns an object with
  // indices of the first and last drawn labels in primary and
  // secondary series filter, and the provisional distances
  // that those points would be from the existing IB left and right
  // (calc'd from number of tick-intervals)
  getFirstAndLastLabelMargins(myFilter, granularity) {
    const margins = {
      firstLabelIndex: 0,
      firstLabelMargin: 0,
      lastLabelIndex: 0,
      lastLabelMargin: 0,
    }
    // 1ry or 2ry axis doesn't exist:
    if (typeof myFilter === 'undefined') {
      return margins;
    }
    for (let iii = 0; iii < myFilter.length; iii++) {
      if (myFilter[iii].label) {
        margins.firstLabelIndex = iii
        margins.firstLabelMargin = iii * granularity.dataPointWidth
        // I did a lot of fidding about here, Apr'24. I think the
        // above is correct; but I've left a few fails below, for
        // (hopefully) subsequent deletion
        // margins.firstLabelMargin = (iii + 1) * granularity.dataPointWidth
        // margins.firstLabelMargin = iii * granularity.dataPointWidth
        // margins.firstLabelMargin += granularity.dataPointWidth/2
        // margins.firstLabelMargin -= granularity.dataPointWidth
        break
      }
    }
    for (let iii = myFilter.length - 1; iii >= 0; iii--) {
      if (myFilter[iii].label) {
        // Get putative margin at right
        margins.lastLabelIndex = iii
        margins.lastLabelMargin =
          (myFilter.length - iii) * granularity.dataPointWidth;
        break
      }
    }
    return margins
  }
  // GET FIRST AND LAST LABEL MARGINS ends

  // CALC MARGINS FOR LABELS 'BETWEEN' TICKS
  // Called from adjustBoundsWidth
  calcMarginsForLabelsBetweenTicks(
    config,
    granularity,
    hasSecondaryAxis,
    halfLabelWidths,
    primaryMargins,
    secondaryMargins
  ) {
    // Assuming that the granularity fcn has done its stuff,
    // Distance that first/last datapoints are inside axis
    // This is default if tick 'slot' is wider than label
    const halfDPWidth = granularity.dataPointWidth / 2
    // Default flag: ticks are left/rightmost objects on axis
    // (i.e. labels don't project)
    let primaryLeftTickFirstElement = true
    let primaryRightTickLastElement = true
    let secondaryLeftTickFirstElement = true
    let secondaryRightTickLastElement = true

    // We know the indices of the first and last labels
    // and their respective default margins from the sides of
    // the inner box (primary/secondaryMargins)
    // We have half string-widths, left and right (halfLabelWidths)

    let primaryLeftTweak = 0
    let primaryRightTweak = 0;
    let secondaryLeftTweak = 0
    let secondaryRightTweak = 0;

    // If there's no secondary axis, margin needs a final adjustment
    // to align year label to the correct slot
    // WRONG PLACE, OR JUST WRONG?????????????????/
    // if (!hasSecondaryAxis) {
    //   primaryMargins.firstLabelMargin -= granularity.dataPointWidth;
    // }

    // I need to find out why I'm not getting the correct result...
    // debugger

    // if (halfLabelWidths.primary.left > primaryMargins.firstLabelMargin / 2) {
    // if (halfLabelWidths.primary.left > (primaryMargins.firstLabelMargin - halfDPWidth)) {
    if (halfLabelWidths.primary.left > primaryMargins.firstLabelMargin) {
      // I think that's right: I'm comparing half the width of the label with the
      // distance from the edge
      // I adjust by the difference between half label width and label origin margin
      // primaryLeftTweak = halfLabelWidths.primary.left - primaryMargins.firstLabelMargin / 2
      // PREVIOUSLY
      // primaryLeftTweak = halfLabelWidths.primary.left - primaryMargins.firstLabelMargin // - halfDPWidth
      // primaryLeftTweak += halfDPWidth 
      primaryLeftTweak = halfLabelWidths.primary.left;
      primaryLeftTweak -= primaryMargins.firstLabelMargin
      // primaryLeftTweak -= (primaryMargins.firstLabelIndex * granularity.dataPointWidth);
              // primaryLeftTweak -= primaryMargins.firstLabelMargin;
              // primaryLeftTweak += halfDPWidth
              // primaryLeftTweak *= 0.95
      primaryLeftTickFirstElement = false
    } else {
      primaryLeftTweak = halfDPWidth;
    }
    if (halfLabelWidths.primary.right > primaryMargins.lastLabelMargin / 2) {
      primaryRightTweak = halfLabelWidths.primary.right - primaryMargins.lastLabelMargin / 2
      primaryRightTweak += halfDPWidth
      primaryRightTickLastElement = false
    } else {
      primaryRightTweak = halfDPWidth;
    }
    // PREVIOUSLY:      
    // if (halfLabelWidths.secondary.left > secondaryMargins.firstLabelMargin / 2) {
    //   // I adjust by the difference between string and slot widths, plus half the
    //   // distance from the first tick to the first data point
    //   // Seems to work...
    //   secondaryLeftTweak = halfLabelWidths.secondary.left - (secondaryMargins.firstLabelMargin / 2) + (granularity.dataPointWidth / 2)
    //   secondaryLeftTickFirstElement = false
    // }

    // Secondary axis:
    // if (halfLabelWidths.secondary.left > secondaryMargins.firstLabelMargin / 2) {
    // if (halfLabelWidths.secondary.left > (secondaryMargins.firstLabelMargin - halfDPWidth)) {
    if (halfLabelWidths.secondary.left > secondaryMargins.firstLabelMargin) {
      // secondaryLeftTweak = halfLabelWidths.secondary.left - secondaryMargins.firstLabelMargin / 2
      secondaryLeftTweak = halfLabelWidths.secondary.left - secondaryMargins.firstLabelMargin // - halfDPWidth
      secondaryLeftTweak += halfDPWidth
      secondaryLeftTickFirstElement = false
    } else {
      secondaryLeftTweak = halfDPWidth;
    }

    if (halfLabelWidths.secondary.right > secondaryMargins.lastLabelMargin / 2) {
      secondaryRightTweak = halfLabelWidths.secondary.right - secondaryMargins.lastLabelMargin / 2
      secondaryRightTweak += halfDPWidth
      secondaryRightTickLastElement = false
    } else {
      secondaryRightTweak = halfDPWidth;
    }

    // But I need an override: if 1st 2ry label is 'between', but
    // 1ry is 'on', force flag for 2ry tick off. Mind you: I'm not
    // 100% convinced by this...
    if (secondaryLeftTickFirstElement & !primaryLeftTickFirstElement) {
      secondaryLeftTickFirstElement = false;
    }

    return {
      primary: {
        left: primaryLeftTweak,
        right: primaryRightTweak,
        leftTickFirstElement: primaryLeftTickFirstElement,
        rightTickFirstElement: primaryRightTickLastElement,
      },
      secondary: {
        left: secondaryLeftTweak,
        right: secondaryRightTweak,
        leftTickFirstElement: secondaryLeftTickFirstElement,
        rightTickFirstElement: secondaryRightTickLastElement,
      },
    }
  }
  // CALC MARGINS FOR LABELS 'BETWEEN' TICKS ends

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
    let primaryMargins;
    let secondaryMargins;
    // Get indices and margins for first and last labels
    if (granularity.primary.showLabel || granularity.secondary.showLabel) {
      primaryMargins = this.getFirstAndLastLabelMargins(
        config.primaryAxisFilter,
        granularity,
      )
      secondaryMargins = this.getFirstAndLastLabelMargins(
        config.secondaryAxisFilter,
        granularity,
      )
    }
    // Is there a secondary axis?
    const hasSecondaryAxis = typeof granularity.secondary !== 'undefined'
    // Half widths of first and last labels, axes 1&2
    let halfLabelWidths = this.getFirstAndLastLabelHalfWidths(
      config,
      testText,
      hasSecondaryAxis,
      primaryMargins,
      secondaryMargins,
    );
    // If labels are 'on' ticks, first and last labels MUST project;
    // so I know enough for the adjustment
    // But if 'between', I need to compare label and 'slot' widths
    if (!granularity.ticksOn) {
      // 'BETWEEN' ticks (passing in halfLabelWidths calc'd just above)
      halfLabelWidths = this.calcMarginsForLabelsBetweenTicks(
        config,
        granularity,
        hasSecondaryAxis,
        halfLabelWidths,
        primaryMargins,
        secondaryMargins
      )
    }
    // On/between ticks rejoin here...

    // Max halfLabelWidths for 1ry/2ry axes
    let leftTweak = Math.max(halfLabelWidths.primary.left, halfLabelWidths.secondary.left)
    let rightTweak = Math.max(halfLabelWidths.primary.right, halfLabelWidths.secondary.right)

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
    // Index dot?
    const indexDotHalfRad = this.getIndexDotTweak(config)
    if (indexDotHalfRad > leftTweak) {
      leftTweak = indexDotHalfRad
    }

    // Update bounds
    bounds.x += leftTweak
    bounds.width -= leftTweak + rightTweak

    // There's another tweak, of half tick strokewidth,
    // if 1st or last tick lies exactly on the chart edge
    const halfTickW = config.tickPrefs.width / 2
    bounds.leftTickFirstElement = false;
    if (
      halfLabelWidths.primary.leftTickFirstElement ||
      halfLabelWidths.secondary.leftTickFirstElement
    ) {
      bounds.x += halfTickW
      bounds.width -= halfTickW
      bounds.leftTickFirstElement = true;
    }
    if (halfLabelWidths.primary.rightTickLastElement) {
      bounds.width -= halfTickW
    }
    // I need to remember half the width of a data-slot, before the bounds change
    // for the x-axis. This will allow me to move ticks
    // into the correct position, between labels
    // (Is this too early?)
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
