// Disable prefer-reflect, for D3 axis.call()
/* eslint-disable prefer-reflect,  no-invalid-this,  func-names */

import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

import * as TextWrapping from '../../chartside-utilities/text-wrapping'

class SilverYaxisOrdinalTest extends Component {
  // DEFAULT PROPS
  static get defaultProps() {
    return {
      groupNames: {
        groupClass: 'axis-group',
        groupId: 'yaxis-group-',
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

  findTestTextContext() {
    const config = this.props.config
    // Context: just use the general, existing (indexed) axis group
    let grpId = `${this.props.groupNames.groupId}${config.chartIndex}`
    grpId = `${grpId}-${config.orient}`
    const testContext = d3.select(`#${grpId}`)
    return testContext
  }

  mapTestCats(catStrings) {
    const config = this.props.config
    const cdArray = catStrings.map((cat, iii) => {
      const oneCat = {
        content: cat,
        id: `category-${iii}`,
        x: 0,
        y: 0,
        'font-family': config.textPrefs.font,
        'font-size': `${config.textPrefs.size}px`,
        fill: config.textPrefs.fillValue,
        leading: config.textPrefs.size,
        'text-anchor': 'start',
      }
      return oneCat
    })
    return cdArray
  }

  // DO STRING TESTS
  doStringTests() {
    const globalThis = this
    const config = this.props.config
    // Add D3-friendly properties to the data array
    const catArray = this.mapTestCats(config.categories)
    // ...and decide where to put it (arbitrary)
    const context = this.findTestTextContext()
    const boundCats = context.selectAll('text').data(catArray)
    boundCats.exit().remove()
    boundCats.enter().append('text')
    boundCats
      .text((ddd) => ddd.content)
      .attr({
        class: 'category-test-text',
        id: (ddd, iii) => {
          // Test-specific id string ends in comma.
          // See getCategoryWidths, below
          return `testText-${iii},`
        },
        leading: config.textPrefs.size,
        x: 50,
        y: 50,
      })
      .style({
        'font-family': config.textPrefs.font,
        'font-size': `${config.textPrefs.size}px`,
        // fill: config.textPrefs.fillValue,
        fill: 'none',
      })
    // Config object to pass
    const wtConfig = {
      wWidth: config.bounds.width,
      forceTurn: config.forceTurn,
    }
    // Test call to text wrapping
    boundCats.call(
      TextWrapping.wrapAllTextElements,
      wtConfig,
      globalThis,
      globalThis.waitForCategoryWidths
    )
  }
  // DO STRING TESTS ends

  // WAIT FOR CATEGORY WIDTHS
  // Callback after wrapping test strings. Sets a timeout
  // before calling function to measure string widths
  // for left-margin setting
  waitForCategoryWidths(globalThis) {
    setTimeout(() => {
      globalThis.getCategoryWidths(globalThis)
    }, 20)
  }
  // WAIT FOR CATEGORY WIDTHS ends

  // GET CATEGORY WIDTHS
  // Called from waitForCategoryWidths
  // Until I reworked widths, Apr'21, this read string
  // widths from element ids. Now that Sibyl no longer
  // records width with element ID, this does the actual
  // measurement. Then sets category margin width on
  // bounds and returns callback to chart-specific component
  getCategoryWidths(globalThis) {
    const config = globalThis.props.config
    const context = globalThis.findTestTextContext()
    const cats = context.selectAll('text')
    let tWidth = 0
    cats.each(function() {
      const oneCat = d3.select(this)
      const thisWidth = oneCat.node().getBBox().width
      // const id = oneCat.attr('id');
      // const idProps = id.split(',');
      // const thisWidth = Number(idProps[idProps.length - 1].split(':')[1]);
      if (thisWidth > tWidth) {
        tWidth = thisWidth
      }
    })
    // Set text width in bounds, with padding
    const bounds = config.bounds
    tWidth += config.tickPrefs.padding
    // Limit area allowed for cat strings to half chart-width...
    const halfWidth = bounds.width / 2
    if (tWidth > halfWidth) {
      tWidth = halfWidth
    }
    bounds.catMargin = tWidth
    bounds.x += tWidth
    bounds.width -= tWidth
    // All done: clear the test text elements...
    cats.remove()
    // And fire off the callback
    globalThis.props.onReturnRevisedInnerBox(bounds)
  }
  // GET CATEGORY WIDTHS

  render() {
    const config = this.props.config
    const grpNames = this.props.groupNames
    const cIndex = config.chartIndex
    const grpClass = grpNames.groupClass
    const grpId = `${grpNames.groupId}${cIndex}-${config.orient}`
    // Setting no fill prevents the SVG convertor from generating a path
    // outlining the group
    const gStyle = { fill: 'none' }
    return <g className={grpClass} id={grpId} style={gStyle} />
  }
}

SilverYaxisOrdinalTest.propTypes = {
  config: PropTypes.object,
  groupNames: PropTypes.object,
  // onReturnRevisedInnerBox: PropTypes.func,
}

export default SilverYaxisOrdinalTest
