// Disable prefer-reflect, for D3 axis.call()
/* eslint-disable prefer-reflect, no-invalid-this,
    no-unused-vars, func-names */

import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities module
import * as AxisUtilities from '../axis-utilities'

class SilverYaxisLinearTest extends Component {
  // DEFAULT PROPS
  static get defaultProps() {
    return {}
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    const config = this.props.config
    if (config.enabled) {
      this.doStringTests()
    } else {
      this.doNothing()
    }
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    const config = this.props.config
    if (config.enabled) {
      this.doStringTests()
    } else {
      this.doNothing()
    }
  }

  // DO NOTHING
  // If 'side' doesn't exist, simply returns
  // existing IB
  doNothing() {
    this.props.onReturnRevisedInnerBox(this.props.config.bounds)
  }

  // DO STRING TESTS
  // Drop text on the wrapper to see
  // what extra margins we have to allow for.
  // Yaxis tests--
  //  Width of last axis label
  //    NOTE: assumes that axis will be labelled right...
  //    This will have to change eventually and allow for l/r axes... or both!
  // NOTE: modded Feb'18 for double scale header margin
  doStringTests() {
    const config = this.props.config
    const bounds = config.bounds
    const side = config.side
    // Context: just use the existing background group
    const axisGroup = d3.select('#background-group')
    // Text object
    const testText = axisGroup
      .append('text')
      .attr('id', 'testText')
      .style({
        'font-family': config.textPrefs.font,
        'font-size': `${config.textPrefs.size}px`,
        fill: config.textPrefs.fillValue,
      })
    // I want width of longest string on the scale...
    // ...which should, in theory, be min- or maxValue...
    // Format:
    const maxStr = AxisUtilities.getLinearAxisTickFormat(
      config.maxVal,
      config.textPrefs.textFormat
    )
    const minStr = AxisUtilities.getLinearAxisTickFormat(
      config.minVal,
      config.textPrefs.tickFormat
    )
    // Slap'em both down and get the longest
    testText.text(maxStr)
    const maxWidth = testText.node().getComputedTextLength()
    testText.text(minStr)
    const minWidth = testText.node().getComputedTextLength()
    // Use longer string-width, and append inner margin:
    const tWidth = Math.max(maxWidth, minWidth) + config.innerMargin
    // Reduce width and, if left-aligned, move over:
    bounds.width -= tWidth
    if (config.orient === 'left') {
      bounds.x += tWidth
    }

    // apply the margin defined in property 'noScaleInnerMargin'.
    // It's 0 by default in default_preferences but it can be overriden by any specific preset.
    // This margin is applied on the left side of the chart, so it modifies two values:
    // 1. the starting position of the inner box
    // 2. the final width of the inner box, which is shrinked due to this margin
    if (config.noScaleInnerMargin > 0) {
      bounds.x += config.noScaleInnerMargin
      bounds.width -= config.noScaleInnerMargin
    }

    // All done: clear the text object...
    testText.remove()
    // Adjust for double scale...
    // As of March'19, also checking for hard '<br>' returns...
    let tweak = config.textPrefs.headerMargin
    if (config.isDouble || config.isScatter) {
      const extraTweak = this.getDsHeadLeadingFromHardReturns(config)
      tweak += extraTweak
      if (config.isDouble) {
        // Divide by 2 because this is done twice, once for each side!
        tweak /= 2
      }
      bounds.y += tweak
      bounds.height -= tweak
    }
    // And fire off the callback
    this.props.onReturnRevisedInnerBox(bounds)
  }

  // GET DS HEAD LEADING FROM HARD RETURNS
  // Called from doStringTests to count lines (from '<br>'')
  // Returns adjustment to top and height of IB
  getDsHeadLeadingFromHardReturns(config) {
    const leading = config.textPrefs.leading
    const forceTurn = config.forceTurn
    let extra = 0
    const headArray = Object.values(config.headers)
    for (let hNo = 0; hNo < headArray.length; hNo++) {
      const thisHead = headArray[hNo].split(forceTurn)
      const thisLeading = (thisHead.length - 1) * leading
      extra = Math.max(extra, thisLeading)
    }
    return extra
  }
  // GET DS HEAD LEADING FROM HARD RETURNS ends

  // RENDER nothing
  render() {
    return null
  }
}

SilverYaxisLinearTest.propTypes = {
  config: PropTypes.object,
  // Callback after test on stringwidth(s)
  onReturnRevisedInnerBox: PropTypes.func,
}

export default SilverYaxisLinearTest
