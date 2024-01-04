// Disable prefer-reflect, for D3 axis.call()
/* eslint-disable prefer-reflect,  no-invalid-this,  func-names */

import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities module
import * as AxisUtilities from '../axis-utilities'
import * as BrokenScale from '../broken-scale'
import * as TextWrapping from '../../chartside-utilities/text-wrapping'

class SilverYaxisLinear extends Component {
  // DEFAULT PROPS
  static get defaultProps() {
    return {
      axis: d3.svg.axis(),
      grpNames: {
        outerClass: 'axis-group',
        outerId: 'yaxis-group-',
        ticksId: 'yaxis-ticks-group-',
        labelsId: 'yaxis-labels-group-',
      },
    }
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    const config = this.props.config
    if (config.enabled) {
      const yAxis = this.setYaxisConfig()
      if (config.isDouble || config.chartType.includes('scatter')) {
        this.updateYaxisHeader()
      }
      this.updateYaxis(yAxis)
      this.drawBreakSymbol()
    }
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    const config = this.props.config
    if (config.enabled) {
      const yAxis = this.setYaxisConfig()
      if (config.isDouble || config.chartType.includes('scatter')) {
        this.updateYaxisHeader()
      }
      this.updateYaxis(yAxis)
      this.drawBreakSymbol()
    }
  }

  // GET ACTUAL DOUBLE SCALE HEADERS EXTRA LEADING
  // Called from afterLinearYaxisHeaderWrap to count actual lines
  // (allows for auto-wrap)
  // Returns adjustment to top and height of IB
  getActualDoubleScaleHeadersExtraLeading(config, headArray) {
    const leading = config.textPrefs.leading
    let extra = 0
    for (let hNo = 0; hNo < headArray.length; hNo++) {
      const head = headArray[hNo]
      const tweak = TextWrapping.getTextAndTspansMove(head, leading)
      extra = Math.max(extra, tweak)
    }
    return extra
  }
  // GET ACTUAL DOUBLE SCALE HEADERS EXTRA LEADING ends

  // SET Y-AXIS CONFIG
  setYaxisConfig() {
    const yAxis = this.props.axis
    const config = this.props.config
    const tPrefs = config.tickPrefs
    // Scale function:
    const yScale = config.scale
    // 'Hard'tick values:
    const tickValues = tPrefs.tickValues
    // Left or right?
    const orient = config.orient
    // NOTE: there are a lot of inferential style assumptions here,
    // based on the current Revamp spec for positioning labels and ticks
    // Padding between labels and tick-ends: hard-set
    let tickPadding = 0
    // Tick length
    const tlPrefs = tPrefs.lengths
    let tickLength = 0
    if (tPrefs.across) {
      // NOTE: I'm not quite sure why, but it works... for now:
      tickLength = config.originalBounds.width
    } else {
      // Use default here. May be overwritten in post-render
      // I'm setting just length. If start !== 0, that'll
      // (hopefully) get fixed post-render
      // NOTE: I don't understand this. And, btw, if style !== 'bar'
      // tlPrefs are undefined
      // NOTE: check this again with bars... which should yield zero...
      tickLength = tlPrefs.default.end
      // And adjust tickPadding (between tick ends and labels)
      tickPadding -= tickLength
      tickLength -= tlPrefs.default.start
    }
    // NOTE: why does this have to be negative?
    // Anyway, apparently it does...
    tickLength = -tickLength
    // Number format
    const textFormat = config.textPrefs.textFormat
    yAxis
      .scale(yScale)
      .orient(orient)
      // Position of labels above tick ends, at top
      .tickPadding(tickPadding)
      .tickValues(tickValues)
      // Tick length
      .tickSize(tickLength)
      // Number format
      .tickFormat((ddd) =>
        AxisUtilities.getLinearAxisTickFormat(ddd, textFormat)
      )
    return yAxis
  }
  // SET Y-AXIS CONFIG ends

  // GET AXIS GROUP TRANSFORMATION
  // Called from updateYAxis. Returns string to move the axis to left
  // or right side of chart.
  // OK: this is a bit of a fucker. This axis is drawn after the
  // chart-type component's mainDthreeGroupTransition moved everything
  // to a coordinate space whose limits are those of the chart and its scales.
  // But this actual axis lies outside those bounds, so I have to 'revert'
  // to the original coordinate space where 0,0 is outerbox top left.
  getAxisGroupTransformation() {
    // NOTE: is there a quicker or better route back to
    // the original bounds?
    // Default for left-aligned...
    let axisMove = this.props.config.originalBounds.x
    axisMove -= this.props.config.bounds.x
    if (this.props.config.orient === 'right') {
      axisMove += this.props.config.originalBounds.width
    }
    return axisMove
  }
  // GET AXIS GROUP TRANSFORMATION ends

  // DRAW BREAK SYMBOL
  // NOTE: broken scale baseline is drawn by XaxisOrdinal.appendBrokenScaleBaseline
  drawBreakSymbol() {
    const config = this.props.config
    const chartIndex = config.chartIndex
    const side = config.side
    const breakObj = config.breakScaleObj
    if (!breakObj.break) {
      return
    }
    // Scale breaks. But do we draw a symbol?
    const drawSymbol = BrokenScale.checkForBrokenScaleSymbol(
      config.chartType,
      breakObj
    )
    if (!drawSymbol) {
      return
    }
    // Symbol is drawn halfway down the area of padding
    // and aligned l/r to scale...
    // Context: ticks group
    const grpId = `${this.props.grpNames.outerId}${chartIndex}-${side}`
    const bsGroup = d3.select(`#${grpId}`)
    //
    // R/h symbol moves across
    const axisMove = this.getAxisGroupTransformation()
    let xPos = config.textPrefs.x + axisMove
    // Allow for width of symbol
    if (side === 'right') {
      xPos -= breakObj.origin
    }
    const yPos = config.bounds.height - breakObj.padding / 2
    // Create array of coordinates
    const lineData = breakObj.points.map((onePt) => {
      const ptObj = {
        x: xPos + onePt.x,
        y: yPos + onePt.y,
      }
      return ptObj
    })
    // NOTE: this is all a straight cannibalisation
    // and dup'd elsewhere
    const lineFunction = d3.svg
      .line()
      .x((ddd) => ddd.x)
      .y((ddd) => ddd.y)
      .interpolate('linear')
    bsGroup
      .append('path')
      .attr({
        d: lineFunction(lineData),
        id: `broken-scale-symbol~~~stroke:${breakObj.strokeName}`,
      })
      .style({
        stroke: breakObj.strokeValue,
        'stroke-width': breakObj.width,
        'stroke-linejoin': breakObj.linejoin,
        // 'stroke-linejoin': 'round',
        fill: 'none',
      })
  }
  // DRAW BREAK SYMBOL ends

  // UPDATE Y-AXIS HEADER
  updateYaxisHeader() {
    const yaxisComponentThis = this
    const config = this.props.config
    const chartIndex = config.chartIndex
    const side = config.side
    // Context: ticks group
    const headId = `${this.props.grpNames.outerId}${chartIndex}-${side}`
    const headGroup = d3.select(`#${headId}`)
    const headString = config.headers[side]
    const hPrefs = config.textPrefs.header
    // Object to pass to wrapText
    // I'm setting wWidth -- the width to which the strings will autowrap --
    // to an implausibly huge value, to ensure that no autowrapping occurs.
    const wtConfig = {
      wWidth: 1000,
      forceTurn: config.forceTurn,
    }
    let anchor = 'start'
    let xPos = config.originalBounds.x - config.bounds.x
    if (side === 'right') {
      anchor = 'end'
      xPos += config.originalBounds.width
    }

    // Headers move up by the same amount that the IB-top
    // was moved down...
    const yPos = 0 - config.textPrefs.headerMargin
    const headArray = [{ content: headString }]
    const boundHead = headGroup.selectAll('text').data(headArray)
    boundHead.enter().append('text')
    boundHead
      .attr({
        class: () => {
          // Double or single scale header?
          let name = 'yaxis-header'
          if (config.isDouble) {
            name = 'doublescale-header'
          }
          return `${name}-${chartIndex}-${side}`
        },
        x: xPos,
        y: yPos,
        id: (ddd, iii) => {
          let tID = `doublescale-header-${iii}`
          tID = `${tID}~~~fill:${config.textPrefs.fill}`
          tID = `${tID}, justification:${anchor}`
          tID = `${tID}, leading:${hPrefs.leading}`
          return tID
        },
        leading: hPrefs.leading,
      })
      .style({
        fill: config.textPrefs.fillValue,
        'font-family': hPrefs.font,
        'font-size': `${hPrefs.size}px`,
        'text-anchor': anchor,
      })
      .text((ddd) => ddd.content)

    // Text wrapping
    // (to debug text wrapping, add a 5th param)
    boundHead.call(
      TextWrapping.wrapAllTextElements,
      wtConfig,
      yaxisComponentThis,
      yaxisComponentThis.afterLinearYaxisHeaderWrap
    )

    boundHead.exit().remove()
  }
  // UPDATE Y-AXIS HEADER ends

  // MOVE AXIS HEADER
  // Called from tweakScatterYaxisHeader and tweakDoubleScaleYaxisHeaders
  // Moves axis header up to allow for wrapping. Args are
  // the header object (with any tspan children); and

  moveAxisHead(header, move) {
    // First move the text element:
    const myHead = header
    const hPos = +myHead.getAttribute('y') - move
    myHead.setAttribute('y', hPos)
    // Then all the child tspans
    const childCount = myHead.children.length
    for (let cNo = 0; cNo < childCount; cNo++) {
      const child = myHead.children[cNo]
      const yPos = child.getAttribute('y')
      // 'y' is null if tspan isn't on a new line
      if (yPos !== null) {
        const cPos = +yPos - move
        child.setAttribute('y', cPos)
      }
    }
  }
  // MOVE AXIS HEADER ends

  // TWEAK SCATTER Y-AXIS HEADER
  // Called from afterLinearYaxisHeaderWrap to tweak
  // position of single y-axis header
  tweakScatterYaxisHeader(originalThis) {
    const config = originalThis.props.config
    const leading = config.textPrefs.leading
    const headName = `.yaxis-header-${config.chartIndex}-${config.side}`
    const head = d3.select(headName)
    // First I need to know how for to move the header
    const tweak = -TextWrapping.getTextAndTspansMove(head, leading)
    // Then move it
    setTimeout(() => {
      TextWrapping.moveTextAndTspans(head, tweak)
    }, 50)
  }
  // TWEAK SCATTER Y-AXIS HEADER ends

  // TWEAK DOUBLE SCALE AXIS HEADERS
  // Called from afterLinearYaxisHeaderWrap
  // Finds both double-scale headers, counts lines,
  // and adjusts position of both to align
  tweakDoubleScaleYaxisHeaders(originalThis) {
    const config = originalThis.props.config
    // This only proceeds when BOTH sides have been drawn
    if (config.side === 'right') {
      const allHeaders = []
      const leftName = `.doublescale-header-${config.chartIndex}-left`
      allHeaders.push(d3.select(leftName))
      const rightName = `.doublescale-header-${config.chartIndex}-right`
      allHeaders.push(d3.select(rightName))
      const tweak = -originalThis.getActualDoubleScaleHeadersExtraLeading(
        config,
        allHeaders
      )
      // Move the headers up when we've had time to breathe
      // NOTE: this may change if I introduce autowrapping for axis headers
      for (let iii = 0; iii < allHeaders.length; iii++) {
        const thisHead = allHeaders[iii]
        setTimeout(() => {
          TextWrapping.moveTextAndTspans(thisHead, tweak)
        }, 50)
      }
    }
  }
  // TWEAK DOUBLE SCALE AXIS HEADERS ends

  // AFTER LINEAR Y-AXIS HEADER WRAP
  // Callback from wrapText (ignores 2nd param).
  // When axis headers have been drawn, calls separate
  // sub-handlers to tweak double-scale and scatter axis headers
  afterLinearYaxisHeaderWrap(originalThis) {
    const config = originalThis.props.config
    // I could be dealing with 2 double-scale headers,
    // or a single axis header for a scatter chart
    if (config.isDouble) {
      originalThis.tweakDoubleScaleYaxisHeaders(originalThis)
    } else {
      originalThis.tweakScatterYaxisHeader(originalThis)
    }
  }
  // AFTER LINEAR Y-AXIS HEADER WRAP ends

  // UPDATE Y-AXIS
  updateYaxis(yAxis) {
    const config = this.props.config
    const chartIndex = config.chartIndex
    const duration = config.duration
    const side = config.side
    const drawTicks = config.drawTicks
    // Context: ticks group
    const grpId = `${this.props.grpNames.ticksId}${chartIndex}-${side}`
    const axisGroup = d3.select(`#${grpId}`)
    const axisMove = this.getAxisGroupTransformation()
    const transform = `translate(${axisMove}, 0)`
    // Highlight zero flag
    const highlightZero = config.mixedVals
    // If scale inverts, last tick is baseline
    let baseNumber = 0
    if (config.invert) {
      baseNumber = config.tickPrefs.tickValues.length - 1
    }
    axisGroup
      // And another transition on scale top/bottom
      // .transition().duration(duration)
      .attr('transform', transform)
      // One transition on scale values
      .transition()
      .duration(duration)
      .call(yAxis)
      .selectAll('line')
      // Allow separate baseline style
      .style({
        'stroke-width': (ddd, iii) => {
          let sWid = config.tickPrefs.width
          if (iii === baseNumber) {
            sWid = config.tickPrefs.baseline.width
          }
          // But...
          if (ddd === 0 && highlightZero) {
            sWid = config.tickPrefs.zero.width
          }
          return sWid
        },
        stroke: (ddd, iii) => {
          let sCol = config.tickPrefs.strokeValue
          // Baseline unless broken scale
          if (iii === baseNumber) {
            if (!config.breakScaleObj.break) {
              sCol = config.tickPrefs.baseline.strokeValue
            }
          }
          // If scale is indexed, tick behaves like mixed zero
          if (config.indexed.indexFlag) {
            if (ddd === config.indexed.value) {
              sCol = config.tickPrefs.zero.mixedValue
            }
          }
          // But...
          if (ddd === 0 && highlightZero) {
            // I think I can go to mixedValue (there's also
            // a zero.simpleValue, but I think that's redundant...)
            sCol = config.tickPrefs.zero.mixedValue
          }
          return sCol
        },
      })
    // Reselect the labels to apply text-anchor
    // Anchor by chart type and axis orientation:
    const anchor = config.textPrefs.anchor[config.chartType][config.orient]
    axisGroup
      .selectAll('text')
      .transition()
      .delay(0)
      .duration(duration)
      .attr({
        x: config.textPrefs.x,
        y: () => {
          // Default y-position centre-aligns text on tick
          // So I need (text-height / 2) + value set in DPs.
          // NOTE: because D3 doesn't center *exactly* vertically,
          // this calculation is out by about 0.25pts,
          // compensated for in DPs.
          let yPos = 0
          yPos -= config.textPrefs.size * (config.textPrefs.emVal / 2)
          yPos -= config.textPrefs.y
          return yPos
        },
      })
      .style({
        'font-family': config.textPrefs.font,
        'font-size': `${config.textPrefs.size}px`,
        fill: config.textPrefs.fillValue,
        'text-anchor': anchor,
      })

    // Remove domain path
    axisGroup.selectAll('path').remove()

    // Label IDs with metadata
    axisGroup
      .selectAll('text')
      // NOTE: again, 'function' for D3...
      // Linting errors disable at top
      .each(function(ddd, iii) {
        const thisLabel = d3.select(this)
        // ID: name and metadata
        thisLabel.attr('id', () => {
          // NOTE: I need to derive all element base ids from... somewhere
          let labID = `yaxis-label-${iii}`
          // fill
          const fillName = config.textPrefs.fill
          labID = `${labID}~~~fill:${fillName}`
          labID = `${labID},justification:${anchor}`
          labID = `${labID},leading:${config.textPrefs.leading}`
          // Width after a timeout, below
          return labID
        })
      })

    const allTicks = axisGroup.selectAll('line')
    if (drawTicks) {
      // Tick IDs with metadata
      // axisGroup.selectAll('line')
      allTicks
        // NOTE: again, 'function' for D3...
        // Linting errors disable at top
        .each(function(ddd, iii) {
          const thisTick = d3.select(this)
          thisTick.attr('id', () => {
            let tickID = `yaxis-tick-${iii}`
            // And stroke name
            // (check baseline / broken scale, tho):
            let strokeName = config.tickPrefs.stroke
            if (iii === baseNumber && !config.breakScaleObj.break) {
              // Baseline stroke -- unless scale breaks
              strokeName = config.tickPrefs.baseline.stroke
            }
            // But...
            if (ddd === 0 && highlightZero) {
              strokeName = config.tickPrefs.zero.mixed
            }
            if (config.indexed.indexFlag) {
              if (ddd === config.indexed.value) {
                strokeName = config.tickPrefs.zero.mixed
              }
            }
            tickID = `${tickID}~~~stroke:${strokeName}`
            return tickID
          })
        })
    } else {
      // But if it's a double scale, we delete the ticks anyway
      allTicks.remove()
    }

    // If it's a column or stacked-line chart I want an additional 'in-front' baseline
    if (config.additionalBaseline) {
      const start = axisMove
      // NOTE: because I'm moving from D3s axis-orientation space
      // to a 'higher' space, I need to reset...
      let end = start - yAxis.tickSize()
      if (config.orient === 'right') {
        end = start + yAxis.tickSize()
      }
      const points = {
        start,
        end,
        scaleVal: config.scale(0),
      }
      AxisUtilities.appendInFrontTick(config, true, points)
    }
  }
  // UPDATE Y-AXIS ends

  // RENDER axis group
  render() {
    const config = this.props.config
    const side = config.side
    const grpNames = this.props.grpNames
    const cIndex = config.chartIndex
    const gClass = grpNames.outerClass
    const grpId = `${grpNames.outerId}${cIndex}-${side}`
    const tickId = `${grpNames.ticksId}${cIndex}-${side}`
    const labId = `${grpNames.labelsId}${cIndex}-${side}`
    // Setting no fill prevents the SVG convertor from generating a path
    // outlineing the group
    const gStyle = { fill: 'none' }
    return (
      <g className={gClass} id={grpId} style={gStyle}>
        <g id={tickId} style={gStyle} />
        <g id={labId} style={gStyle} />
      </g>
    )
  }
}

SilverYaxisLinear.propTypes = {
  config: PropTypes.object,
  // Not passed in; declared here as default prop
  axis: PropTypes.func,
  grpNames: PropTypes.object,
}

export default SilverYaxisLinear
