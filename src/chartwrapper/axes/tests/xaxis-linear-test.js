/* eslint-disable */

import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities module
import * as AxisUtils from '../axis-utilities'
import * as XaxisHeader from '../xaxis-header'

class SilverXaxisLinearTest extends Component {
  // DEFAULT PROPS
  static get defaultProps() {
    return {
      groupNames: {
        groupId: 'xaxis-group-',
        groupClass: 'axis-group-',
      },
    }
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    this.doStringTests()
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    this.doStringTests()
  }

  // GET DOT PROJECTION
  // Called from adjustBoundsWidth to work out how
  // much leftmost scatter dot projects
  getDotProjection() {
    const config = this.props.config
    let dotProj = 0
    // Only proceed if scatter:
    if (config.chartType.includes('scatter')) {
      const dotProps = config.scatterDotProps
      const minVal = dotProps.minVal
      const dotRad = dotProps.dotRad
      // Find center, then left of (factored) lowest actual x-value
      let val = config.scale(minVal / config.factor)
      // There's an extreme-edge case where someone is drawing a 'dummy' chart
      // to fill in (in Illustrator). If they aren't thinking carefully, the minimum x value
      // may be significantly less than the scale minimum, so that chart width is a
      // negative value and the scale inverts. This counters that:
      val = Math.max(val, 0)
      // Subtract radius and return any projection
      val -= dotRad
      if (val < 0) {
        dotProj = Math.abs(val)
      }
    }
    return dotProj
  }
  // GET DOT PROJECTION

  getBarProjection() {
    const config = this.props.config
    let barProj = 0
    if (config.chartType.includes('bar')) {
      // NOTE: inferentially 'left'
      const scaleMin = config.minVal
      const scaleMax = config.maxVal
      const actualMax = config.actualMaxVal
      const bWidth = config.bounds.width
      if (actualMax > scaleMax) {
        const scaleRange = scaleMax - scaleMin
        const dataRange = actualMax - scaleMin
        const squeezedRange = (bWidth / dataRange) * scaleRange
        barProj = bWidth - squeezedRange
      }
    }
    return barProj
  }

  // ADJUST BOUNDS WIDTH
  // Called from doStringTests. Adjusts bounds
  // for width of first and last axis labels
  adjustBoundsWidth(bounds, testObj, isFirst) {
    const config = this.props.config
    const forceTurn = config.forceTurn
    let tVal = +config.maxVal
    if (isFirst) {
      tVal = +config.minVal
    }
    // Format and inject text:
    const testStr = AxisUtils.getLinearAxisTickFormat(
      tVal,
      config.textPrefs.textFormat
    )
    // Returns half width of text element
    // (i.e. assumes centred text)
    let tWidth = AxisUtils.getAxisLabelWidth(
      testObj,
      testStr,
      forceTurn,
      isFirst
    )
    // But there's a special case. If it's a scatter chart,
    // does the leftmost dot project more than the label?
    if (isFirst) {
      const dotProjection = this.getDotProjection()
      tWidth = Math.max(tWidth, dotProjection)
    } else {
      // Check for bar chart breaking scale at right:
      const barProjection = this.getBarProjection()
      tWidth = Math.max(tWidth, barProjection)
    }
    if (isFirst) {
      bounds.x += tWidth
    }
    bounds.width -= tWidth
    // NOTE: for bar charts with blobs, I need to align blobs
    // to the r/h edge of the IB, PLUS the distance the label projects
    // So add a new property to the bounds
    // I *think* this is only linear xaxes...
    bounds.labelProjection = tWidth
  }
  // ADJUST BOUNDS WIDTH ends

  // ADJUST BOUNDS HEIGHT ends
  // Called from doStrings
  // For height, I have to allow for label height, padding and tick
  // projection. Since I can't get an accurate measurement
  // of the height of SVG text (getBBox returns glyph cell height,
  // or whatever you want to call it), I have to 2nd-guess D3 and
  // use an em-height.
  // If axis is at the top, I don't allow for label height, since padding
  // above chart is measured to x-axis label baselines
  adjustBoundsHeight(bounds) {
    const config = this.props.config
    const isTop = config.orient === 'top'
    let tHeight = 0
    // NOTE: up to Jan'20 I played by D3 rules, which use a
    // padding val between tick-end ('projection') and (if axis is
    // at bottom of chart) top-of-label. This is stupid, so I'm
    // moving over to absolute distances: axis-line to text baseline.
    if (isTop) {
      tHeight = config.textPrefs.padding.axisAtTop.bar
      // But
      if (config.chartType.includes('thermo')) {
        tHeight = config.textPrefs.padding.axisAtTop.thermo
      }
    } else {
      tHeight = config.textPrefs.padding.axisAtBottom.default
      // But padding is different for broken scatters
      if (
        config.chartType.includes('scatter') &&
        config.breakScaleObj.scatterYaxisBreaks
      ) {
        tHeight = config.textPrefs.padding.axisAtBottom.brokenScatter
      }
    }
    // Axis at top pushes top of IB downwards
    if (isTop) {
      bounds.y += tHeight
    }
    // Either way, reduce height of IB
    bounds.height -= tHeight
    // Allow for any axis header
    let headerMargin = 0
    if (config.header.length > 0) {
      headerMargin = XaxisHeader.getXaxisHeaderMargin(config)
    }
    if (isTop) {
      bounds.y += headerMargin
    }
    bounds.height -= headerMargin
  }
  // ADJUST BOUNDS HEIGHT ends

  // DO STRING TESTS
  // Called if testFlag=true, to drop text on the wrapper
  // and see what extra margins we have to allow for.
  // Xaxis tests--
  //  - Barchart: width of last axis label
  //    NOTE: currently assumes number, but could be data...
  //    NOTE: also currently assumes that categories will be drawn
  //    left, so no need to check projection of first axis label
  doStringTests() {
    const config = this.props.config
    const grpNames = this.props.groupNames
    // Append a text object to the main axis group
    const grpId = `${grpNames.groupId}${config.chartIndex}`
    const testObj = AxisUtils.appendTestText(config, grpId)
    const bounds = config.bounds
    // WIDTH
    // Adjust bounds for first and last strings
    // Params are bounds, testObj, isFirst
    this.adjustBoundsWidth(bounds, testObj, true)
    this.adjustBoundsWidth(bounds, testObj, false)
    // HEIGHT
    this.adjustBoundsHeight(bounds)
    // All done: clear the text object...
    testObj.remove()
    // And fire off the callback
    this.props.onReturnRevisedInnerBox(bounds)
  }

  // RENDER axis group as context for test strings
  render() {
    const cIndex = this.props.config.chartIndex
    const grpNames = this.props.groupNames
    const grpId = `${grpNames.groupId}${cIndex}`
    const gClass = grpNames.groupClass
    // Setting no fill prevents the SVG convertor from generating a path
    // outlining the group
    const gStyle = { fill: 'none' }
    return <g className={gClass} id={grpId} style={gStyle} />
  }
}

SilverXaxisLinearTest.propTypes = {
  config: PropTypes.object,
  groupNames: PropTypes.object,
  // Callback after stringwidth test
  onReturnRevisedInnerBox: PropTypes.func,
}

export default SilverXaxisLinearTest
