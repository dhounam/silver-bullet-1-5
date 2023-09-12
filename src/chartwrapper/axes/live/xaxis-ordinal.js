// Disable prefer-reflect, for D3 axis.call()
/* eslint-disable prefer-reflect, no-invalid-this, func-names */

import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities modules
import * as AxisUtils from '../axis-utilities'
import * as TextWrapping from '../../chartside-utilities/text-wrapping'
import * as XaxisHeader from '../xaxis-header'

class SilverXaxisOrdinal extends Component {
  // DEFAULT PROPS
  // I think the same as linear.
  static get defaultProps() {
    return {
      primaryAxis: d3.svg.axis(),
      secondaryAxis: d3.svg.axis(),
      grpNames: {
        outerClass: 'axis-group',
        outerId: 'xaxis-group-',
        ticksId: 'xaxis-ticks-group-',
        labelsId: 'xaxis-labels-group-',
        secondaryId: 'xaxis-secondary-group-',
        headerId: 'xaxis-header-group-',
      },
    }
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    const config = this.props.config
    const primaryXaxis = this.setPrimaryXaxisConfig()
    this.updatePrimaryXaxis(primaryXaxis)
    // Now check for any secondary axis:
    if (config.hasSecondaryAxis) {
      const secondaryXaxis = this.setSecondaryXaxisConfig()
      this.updateSecondaryXaxis(secondaryXaxis)
    }
    // 'Special' baseline for un-indexed, un-inverted, broken scales
    const breaks = this.checkBreakScale(config)
    if (breaks) {
      this.appendBrokenScaleBaseline()
    }
    if (config.header.length > 0) {
      XaxisHeader.updateXaxisHeader(this, config)
    }
  }

  // COMPONENT DID UPDATE
  // Never gets called, in fact
  componentDidUpdate() {
    const config = this.props.config
    const primaryXaxis = this.setPrimaryXaxisConfig()
    this.updatePrimaryXaxis(primaryXaxis)
    if (config.hasSecondaryAxis) {
      const secondaryXaxis = this.setSecondaryXaxisConfig()
      this.updateSecondaryXaxis(secondaryXaxis)
    }
    const breaks = this.checkBreakScale(config)
    if (breaks) {
      this.appendBrokenScaleBaseline()
    }
    if (config.header.length > 0) {
      XaxisHeader.updateXaxisHeader(this, config)
    }
  }

  // CHECK BREAK SCALE
  // Called from componentDidMount/Update
  // Checks whether broken scale baseline is required
  checkBreakScale(config) {
    let breaks = false
    if (config.breakScale.left || config.breakScale.right) {
      if (!config.isIndexed && !config.invert) {
        breaks = true
      }
    }
    return breaks
  }
  // CHECK BREAK SCALE ends

  // APPEND BROKEN SCALE BASE LINE
  // Called from componentDidMount/Update
  // to draw broken scale baseline along the x-axis
  appendBrokenScaleBaseline() {
    const config = this.props.config
    const chartIndex = config.chartIndex
    const bounds = config.bounds
    const originalBounds = config.originalBounds
    let breakLeft = config.breakScale.left
    let breakRight = config.breakScale.right
    // Double scale: if either breaks, both do
    // But cf xaxis-ordinal-config.getBreakScaleObj
    // These lines should, I think, be redundant; but inconsistencies
    // in my handling of 'sides' seem to make them necessary...
    if (config.isDouble) {
      if (breakLeft || breakRight) {
        breakLeft = true
        breakRight = true
      }
    }
    // Half tickwidth tweak
    const halfTick = config.tickPrefs.width / 2
    // Default: chart bounds
    let startPoint = 0
    if (breakLeft) {
      startPoint -= halfTick
    } else {
      startPoint -= bounds.x - originalBounds.x
    }
    // Align right to last tick (including tick-width), unless inverted
    let endPoint = bounds.width
    if (breakRight) {
      endPoint += halfTick
    } else {
      endPoint = originalBounds.width
    }
    if (!config.granularity.ticksOn) {
      // 'Between': extend ends to ticks
      startPoint -= config.xShift
      endPoint += config.xShift
    }
    const lineData = [
      { x: startPoint, y: 0 },
      { x: endPoint, y: 0 },
    ]
    // NOTE: duplicates code in yaxis-linear.drawBreakSymbol
    const lineFunction = d3.svg
      .line()
      .x((ddd) => ddd.x)
      .y((ddd) => ddd.y)
      .interpolate('linear')
    const grpId = `${this.props.grpNames.ticksId}${chartIndex}`
    const blGroup = d3.select(`#${grpId}`)
    blGroup
      .append('path')
      .attr({
        d: lineFunction(lineData),
        className: 'broken-scale-baseline',
        id: `broken-scale-baseline~~~stroke:${config.tickPrefs.baseline.stroke}`,
      })
      .style({
        'stroke-width': config.tickPrefs.baseline.width,
        stroke: config.tickPrefs.baseline.strokeValue,
      })
  }
  // APPEND BROKEN SCALE BASE LINE ends

  // GET TICK FORMAT
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

  // SET PRIMARY X-AXIS CONFIG
  setPrimaryXaxisConfig() {
    const xAxis = this.props.primaryAxis
    const config = this.props.config
    // Scale function:
    const xScale = Object.assign({}, config.scale)
    // Number of ticks
    const tickCount = config.tickPrefs.tickCount
    // Padding between labels and IB is rowheight minus
    // the calculated height of the text
    let tickPadding = config.textPrefs.rowheight
    let size = config.textPrefs.size.primaryOnly
    if (config.hasSecondaryAxis) {
      size = config.textPrefs.size.primaryIfSecondary
    }
    tickPadding -= size * config.textPrefs.emVal
    // But I have also to allow for tickLength...
    // Top or bottom:
    const orient = config.orient
    // Tick length settings. Default zero:
    // FIXME: no -- ticklengths are in the filter
    // (except for string cats)
    let tickLength = 0
    // Across?
    if (config.tickPrefs.across) {
      // Because, by default, 'across' ticklengths go up from the bottom,
      // negative val...
      tickLength = -config.bounds.height
    } else {
      // FIXME: I'll have to revisit tick padding
      const tlPrefs = config.tickPrefs.lengths
      // Use default here. Gets overwritten by values in filterArray.
      // I'm setting just length. If start !== 0, that'll
      // (hopefully) get fixed post-render
      tickLength = tlPrefs.default.end
      // And adjust tickPadding (between tick ends and labels)
      tickPadding -= tickLength
      tickLength -= tlPrefs.default.start
    }
    if (orient === 'top') {
      tickLength = -tickLength
    }
    // Label format
    const tickFormat = this.getTickFormat(config, true)
    xAxis
      .scale(xScale)
      .orient(orient)
      // Gap between labels and ticks
      .tickPadding(tickPadding)
      // Number of ticks
      .ticks(tickCount)
      // Tick length
      .tickSize(tickLength)
      // Number format
      .tickFormat(tickFormat)
    return xAxis
  }
  // SET PRIMARY X-AXIS CONFIG ends

  // SET SECONDARY X-AXIS CONFIG
  setSecondaryXaxisConfig() {
    const xAxis = this.props.secondaryAxis
    const config = this.props.config
    // Scale function:
    const xScale = Object.assign({}, config.scale)
    // Number of ticks
    const tickCount = config.tickPrefs.tickCount
    // Padding between labels and IB is rowheight minus
    // the calculated height of the text
    let tickPadding = 0
    if (config.granularity.primary.showLabel) {
      tickPadding = config.textPrefs.rowheight
    }
    // Top or bottom:
    const orient = config.orient
    // Secondary axis has zero tickLength (actually not drawn, anyway)
    const tickLength = 0
    // Label format
    const tickFormat = this.getTickFormat(config, false)
    //
    xAxis
      .scale(xScale)
      .orient(orient)
      // Gap between labels and ticks
      .tickPadding(tickPadding)
      // Number of ticks
      .ticks(tickCount)
      // Tick length
      .tickSize(tickLength)
      // Number format
      .tickFormat(tickFormat)
    return xAxis
  }
  // SET SECONDARY X-AXIS CONFIG ends

  // GET AXIS GROUP TRANSFORM STRING
  // Called from updateXAxis. Returns string that determines
  // whether axis is drawn top/bottom
  getAxisGroupTransformString() {
    let height = 0
    if (this.props.config.orient === 'bottom') {
      height = this.props.config.bounds.height
    }
    return `translate(0,${height})`
  }
  // GET AXIS GROUP TRANSFORM STRING ends

  // UPDATE PRIMARY X-AXIS
  updatePrimaryXaxis(xAxis) {
    const globalThis = this
    const config = this.props.config
    const chartIndex = config.chartIndex
    const filterArray = config.primaryAxisFilter
    // Context: primary ticks group
    const grpId = `${this.props.grpNames.ticksId}${chartIndex}`
    const axisGroup = d3.select(`#${grpId}`)
    // Setting duration locally
    const duration = 0
    // Top or bottom?
    const transform = this.getAxisGroupTransformString()
    const anchor = config.textPrefs.anchor[config.chartType]
    // NOTE: this has to be wrong, surely -- must be 2ndary axis...
    // NOTE: how does this get here, anyway...?
    const textShift = config.xShift
    let tickShift = 0
    if (!config.tickPrefs.ticksOn) {
      tickShift -= config.xShift
    }
    if (config.chartType.includes('thermo')) {
      tickShift = 0
    }
    // Non-default tick lengths
    // Call axis function on the group
    axisGroup
      // Transition to scale top/bottom
      .attr('transform', transform)
      // Transition on scale values
      .transition()
      .duration(duration)
      .call(xAxis)
      .selectAll('line')
      .style({
        'stroke-width': config.tickPrefs.width,
        stroke: config.tickPrefs.strokeValue,
      })
      // Ideally I'd separate attributes, but that
      // fails for some reason
      .attr({
        class: 'xaxis-line',
        y1: 0,
        y2: (ddd, iii) => {
          // Default tick length
          let tick = config.tickPrefs.lengths.default.end
          // For time series, tick length is calc'd for each point
          // unless scale is 'across':
          if (config.tickPrefs.across) {
            tick = xAxis.tickSize()
          } else if (typeof filterArray !== 'undefined') {
            tick = filterArray[iii].tick
          }
          return tick
        },
        transform: `translate(${tickShift}, 0)`,
        id: (ddd, iii) => {
          let tickID = `xaxis-tick-${iii}`
          // And stroke name:
          const strokeName = config.tickPrefs.stroke
          tickID = `${tickID}~~~stroke:${strokeName}`
          return tickID
        },
      })
    // TEXT
    axisGroup
      .selectAll('text')
      // Set a 'shift' boolean on ALL labels. With unfiltered
      // 'string' categories, shift is just always on since
      // no filterArray exists
      .attr('shift', (ddd, iii) => {
        let shift = false
        if (typeof filterArray !== 'undefined') {
          shift = filterArray[iii].shift
        }
        return shift
      })
      .attr('duplicate', (ddd) => ddd.duplicate)
      // And set style:
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
        'text-anchor': anchor,
      })
      .attr('class', 'xaxis-label')

    // Remove domain path
    axisGroup.selectAll('path').remove()
    // Set ID + metadata
    axisGroup
      .selectAll('text')
      // NOTE: again, I need 'function' for D3...
      // Linting errors disable at top
      .each(function(ddd, iii) {
        const thisLabel = d3.select(this)
        // If labels display first letter only,
        // do it now, before before getting width:
        if (config.firstLetterOnly) {
          const lText = thisLabel.text()[0]
          thisLabel.text(lText)
        }
        // Add ID attribute, with element name and metadata
        thisLabel
          .attr('id', () => {
            // NOTE: I need to derive all element base ids from... somewhere
            let labID = `xaxis-primary-label-${iii}`
            // fill
            const fillName = config.textPrefs.fill
            labID = `${labID}~~~fill:${fillName}`
            labID = `${labID},justification:${anchor}`
            labID = `${labID},leading:${config.textPrefs.leading}`
            return labID
          })
          .attr('x', 0)
          .attr('leading', config.textPrefs.leading)
      })
    const tickCount = axisGroup.selectAll('line')[0].length

    // 'Between' ticks have a duplicate to complete the set
    if (!config.tickPrefs.ticksOn) {
      const lastTick = axisGroup.selectAll('line').filter((d, iii) => {
        return iii === tickCount - 1
      })
      if (typeof filterArray !== 'undefined') {
        let tickLen = filterArray[filterArray.length - 1].duplicate
        if (typeof tickLen === 'undefined') {
          tickLen = filterArray[tickCount - 1].tick
        }
        // Time to complete; then duplicate tick (if any)
        if (tickLen > 0) {
          setTimeout(() => {
            this.duplicateTick(lastTick, config, tickLen)
          }, 50)
        }
      }
    }

    // Attempts to filter labels never worked for me
    // So I loop through and delete unwanted labels
    // (SVG conversion kills undisplayed labels; but
    // transfers their ID to the tick, with hilarious
    // consequences)
    // Surviving labels may need to 'shift' a half-slot left
    const labels = axisGroup.selectAll('text')
    labels
      // NOTE: again, I need 'function' for D3...
      // Linting errors disable at top
      .each(function(ddd, iii) {
        const thisLabel = d3.select(this)
        if (typeof filterArray !== 'undefined') {
          const filterProps = filterArray[iii]
          if (filterProps.label) {
            // If label required, check shift
            let labShift = 0
            if (filterProps.shift) {
              labShift = textShift
            }
            thisLabel.attr('transform', `translate(${0 - labShift}, 0)`)
          } else {
            // Delete unwanted labels
            thisLabel.remove()
          }
        }
      })

    // Sep'20: I realise that I forgot to allow for
    // text-wrapping on ordinal x-axes.
    // I think I can fork on whether filterArray is defined...
    if (typeof filterArray === 'undefined') {
      // So not dates or numbers
      const wtConfig = {
        // Arbitrary width
        wWidth: 1000,
        forceTurn: config.forceTurn,
      }
      labels.call(
        TextWrapping.wrapAllTextElements,
        wtConfig,
        globalThis,
        globalThis.xAxisOrdinalLabelTweak
      )
    } else {
      // Negative labels have to be re-aligned to centre of
      // number (ignore '-')
      setTimeout(() => {
        AxisUtils.fixNegativeLabels(axisGroup)
      }, 50)
    }
  }
  // UPDATE PRIMARY X-AXIS ends

  // XAXIS ORDINAL LABEL TWEAK
  // Called from updatePrimaryXaxis
  xAxisOrdinalLabelTweak(globalThis) {
    const config = globalThis.props.config
    const chartIndex = config.chartIndex
    const grpId = `${globalThis.props.grpNames.ticksId}${chartIndex}`
    const axisGroup = d3.select(`#${grpId}`)
    const labels = axisGroup.selectAll('text')
    labels.each(function() {
      const thisLabel = d3.select(this)
      const lNode = thisLabel.node()
      const childCount = lNode.childElementCount
      if (childCount > 1) {
        const textY = +thisLabel.attr('y')
        for (let cNo = 1; cNo < childCount; cNo++) {
          const span = lNode.children[cNo]
          const newY = +span.getAttribute('y') + textY
          span.setAttribute('y', newY)
        }
      }
    })
  }
  // XAXIS ORDINAL LABEL TWEAK ends

  // DUPLICATE TICK
  // Called from updatePrimaryXaxis
  duplicateTick(theTick, config, tickLen) {
    const myNode = theTick.node()
    const lastNode = d3.select(
      myNode.parentNode.insertBefore(myNode.cloneNode(true), myNode.nextSibling)
    )
    // Get ID, incrementing tick no. by 1, if possible
    let idStr = `xaxis-tick-000~~~stroke:${config.tickPrefs.stroke}`
    const id = theTick.attr('id')
    if (typeof id === 'string') {
      const arrayA = theTick.attr('id').split('~~~')
      const arrayB = arrayA[0].split('-')
      const tickNo = +arrayB[2] + 1
      idStr = idStr.replace('000', tickNo)
    }
    lastNode
      .attr({
        transform: `translate(${config.xShift}, 0)`,
        y2: tickLen,
        id: idStr,
      })
      .style({
        'stroke-width': config.tickPrefs.width,
        stroke: config.tickPrefs.strokeValue,
      })
  }
  // DUPLICATE TICK ends

  /*
  // This was Bostock's f'rinstance, which I cannibalised above
  function clone(selector) {
     var node = d3.select(selector).node();
     return d3.select(node.parentNode.insertBefore(node.cloneNode(true),
  node.nextSibling));
   }

  Then you can say clone("#blah") to select a clone of #blah. You could
  made a cloneAll, too
  */

  // UPDATE SECONDARY X-AXIS
  // Draws labels for 2ry axis only; lengthening of any 'boundary'
  // ticks is done in updatePrimaryXaxis
  updateSecondaryXaxis(secondXaxis) {
    const config = this.props.config
    const chartIndex = config.chartIndex
    const filterArray = config.secondaryAxisFilter
    // Context: secondary axis group
    const grpId = `${this.props.grpNames.secondaryId}${chartIndex}`
    const axisGroup = d3.select(`#${grpId}`)
    const duration = config.duration
    const transform = this.getAxisGroupTransformString()
    const anchor = config.textPrefs.anchor[config.chartType]
    const yShift = config.textPrefs.rowheight
    const xShift = config.xShift
    axisGroup
      // Transition to scale top/bottom
      .attr('transform', transform)
      // One transition on scale values
      .transition()
      // .delay(duration)
      .duration(duration)
      .call(secondXaxis)
      // Tick projection
      .selectAll('text')
      // Set the x-shift on ALL elements before filter, since
      // that resets the element index ('iii') to count filtered
      // elements only. Remember, though: this is relative to
      // translated tick-group position
      .attr('x', (ddd, iii) => {
        let val = 0
        if (filterArray[iii].shift) {
          val -= xShift
        }
        return val
      })
      // Filter to draw only flagged labels
      .filter((ddd, iii) => filterArray[iii].label)
      .style({
        'font-family': config.textPrefs.font,
        'font-size': `${config.textPrefs.size.secondary}px`,
        fill: config.textPrefs.fillValue,
        'text-anchor': anchor,
      })
      .attr({
        dy: yShift,
      })
    // Remove domain path and ticks from 2ry axis
    axisGroup.selectAll('path').remove()
    axisGroup.selectAll('line').remove()
    // (Remember: tick 'emphasis' [i.e. length] is handled by 1ry axis)

    // I can move labels to the primary axis group, but
    // they lose position. For now, at least, defer to Illy
    // ID and metadata
    // NOTE: duplicates code in updatePrimaryXaxis...
    axisGroup.selectAll('text').each(function(ddd, iii) {
      const thisLabel = d3.select(this)
      // Add ID attribute, with element name and metadata
      thisLabel.attr('id', () => {
        // NOTE: I need to derive all element base ids from... somewhere
        let labID = `xaxis-secondary-label-${iii}`
        // fill
        const fillName = config.textPrefs.fill
        labID = `${labID}~~~fill:${fillName}`
        labID = `${labID},justification:${anchor}`
        // NOTE: *****
        // I tried to get width here, but D3 hasn't rendered 2ry
        // labels yet, so this fails
        return labID
      })
    })
  }
  // UPDATE SECONDARY X-AXIS ends

  // RENDER axis group
  // Just draw the axis group
  render() {
    const config = this.props.config
    const grpNames = this.props.grpNames
    const cIndex = config.chartIndex
    const gClass = grpNames.outerClass
    const grpId = `${grpNames.outerId}${cIndex}`
    const tickId = `${grpNames.ticksId}${cIndex}`
    const labId = `${grpNames.labelsId}${cIndex}`
    const secId = `${grpNames.secondaryId}${cIndex}`
    const headerId = `${grpNames.headerId}${cIndex}`
    // Setting no fill prevents the SVG convertor from generating a path
    // outlining the group
    const gStyle = { fill: 'none' }
    // Inner groups. I think I have to create three groups
    // since 2ry axis has a separate binding...
    // But after 2ry labels have moved, that group is deleted
    let groupJSX = (
      <g className={gClass} id={grpId} style={gStyle}>
        <g id={tickId} style={gStyle} />
        <g id={labId} style={gStyle} />
        <g id={headerId} style={gStyle} />
      </g>
    )
    // 2ry axis has the additional group
    if (config.hasSecondaryAxis) {
      groupJSX = (
        <g className={gClass} id={grpId} style={gStyle}>
          <g id={tickId} style={gStyle} />
          <g id={labId} style={gStyle} />
          <g id={headerId} style={gStyle} />
          <g id={secId} style={gStyle} />
        </g>
      )
    }
    return groupJSX
  }
}

SilverXaxisOrdinal.propTypes = {
  config: PropTypes.object,
  primaryAxis: PropTypes.func,
  secondaryAxis: PropTypes.func,
  grpNames: PropTypes.object,
}

export default SilverXaxisOrdinal
