// Disable prefer-reflect, for D3 axis.call()
/* eslint-disable prefer-reflect,  no-invalid-this,  func-names */

import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities module
import * as AxisUtils from '../axis-utilities'
import * as XaxisHeader from '../xaxis-header'
import * as BrokenScale from '../broken-scale'

class SilverXaxisLinear extends Component {
  // DEFAULT PROPS
  static get defaultProps() {
    return {
      axis: d3.svg.axis(),
      grpNames: {
        outerClass: 'axis-group',
        outerId: 'xaxis-group-',
        ticksId: 'xaxis-ticks-group-',
        labelsId: 'xaxis-labels-group-',
        headerId: 'xaxis-header-group-',
      },
      // But headerId now set indep'y in xaxis-header.js
    }
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    const config = this.props.config
    const xAxis = this.setXaxisConfig()
    this.updateXaxis(xAxis)
    this.drawBreakSymbol()
    if (config.header.length > 0) {
      XaxisHeader.updateXaxisHeader(this, config)
    }
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    const config = this.props.config
    const xAxis = this.setXaxisConfig()
    this.updateXaxis(xAxis)
    this.drawBreakSymbol()
    if (config.header.length > 0) {
      XaxisHeader.updateXaxisHeader(this, config)
    }
  }

  // SET X-AXIS CONFIG
  setXaxisConfig() {
    const xAxis = this.props.axis
    const config = this.props.config
    const tPrefs = config.tickPrefs
    // Top or bottom:
    const orient = config.orient
    const isTop = orient === 'top'
    // Scale function:
    const xScale = config.scale
    // 'Hard'tick values:
    const tickValues = tPrefs.tickValues
    // Padding between labels and axis
    const projection = tPrefs.projection[config.chartType]
    const emVal = config.textPrefs.emVal
    let tickPadding = 0
    if (isTop) {
      tickPadding = config.textPrefs.padding.axisAtTop.bar
      // But
      if (config.chartType.includes('thermo')) {
        tickPadding = config.textPrefs.padding.axisAtTop.thermo
      }
    } else {
      tickPadding = config.textPrefs.padding.axisAtBottom.default
      // But padding is different for broken scatters
      if (
        config.chartType.includes('scatter') &&
        config.breakScaleObj.scatterYaxisBreaks
      ) {
        tickPadding = config.textPrefs.padding.axisAtBottom.brokenScatter
      }
      // Subtract tick projection
      tickPadding -= projection
      // And subtract text height, to get margin to top-of-text
      tickPadding -= config.textPrefs.size.primaryOnly * emVal
    }
    // Tick length
    const tlPrefs = tPrefs.lengths
    let tickLength = 0
    if (tPrefs.across) {
      tickLength -= config.bounds.height
    } else {
      // Use default here. May be overwritten in post-render
      // I'm setting just length. If start !== 0, that'll
      // (hopefully) get fixed post-render
      tickLength = tlPrefs.default.end
      // And adjust tickPadding (between tick ends and labels)
      // tickPadding -= tickLength;
      tickLength -= tlPrefs.default.start
    }
    // Number format
    const textFormat = config.textPrefs.textFormat
    xAxis
      .scale(xScale)
      .orient(orient)
      // Position of labels above/below tick ends
      .tickPadding(tickPadding)
      .tickValues(tickValues)
      // Tick length
      .tickSize(tickLength)
      // Number format
      .tickFormat((ddd) => AxisUtils.getLinearAxisTickFormat(ddd, textFormat))
    return xAxis
  }
  // SET X-AXIS CONFIG ends

  // GET AXIS GROUP TRANSFORMATION
  // Called from updateXAxis. Returns string that determines
  // whether axis is drawn top/bottom
  getAxisGroupTransformation() {
    let height = 0
    if (this.props.config.orient === 'bottom') {
      height = this.props.config.bounds.height
    }
    return height
  }
  // GET AXIS GROUP TRANSFORMATION ends

  // DRAW BREAK SYMBOL
  drawBreakSymbol() {
    const config = this.props.config
    const chartIndex = config.chartIndex
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
    // Still here? Symbol is drawn halfway down the area of padding
    // and aligned l/r to scale...
    // Context: ticks group
    const grpId = `${this.props.grpNames.outerId}${chartIndex}`
    const bsGroup = d3.select(`#${grpId}`)
    // Position relative to first label:
    const firstLabel = d3.select('.xaxis-label-0')
    const xPos = 0 - config.brokenScalePadding
    //
    // If we have a multipanel chart with a bar chart in the first panel,
    // *subsequent* panels put BS symbol above or below the midpoint.
    // I tried using the bBox and label's 'y' attribute, but both seem to mis-report
    // So I'm going back to basics:
    // Label height from font size
    const labelHeight =
      parseInt(firstLabel.style('font-size'), 10) * config.textPrefs.emVal
    // Label baseline from DPs
    const labelBase = config.tickPrefs.padding
    const yPos = 0 - labelBase - labelHeight / 2
    // // Create array of coordinates
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
      .attr('d', lineFunction(lineData))
      .attr('id', `broken-scale-symbol~~~stroke:${breakObj.strokeName}`)
      .style('stroke', breakObj.strokeValue)
      .style('stroke-width', breakObj.width)
      .style('stroke-linejoin', breakObj.linejoin)
      .style('fill', 'none')
  }
  // DRAW BREAK SYMBOL ends

  // UPDATE X-AXIS
  // Called directly on the DOM to update the axis
  updateXaxis(xAxis) {
    const config = this.props.config
    const chartIndex = config.chartIndex
    // Context: ticks group
    const grpId = `${this.props.grpNames.ticksId}${chartIndex}`
    const axisGroup = d3.select(`#${grpId}`)
    const duration = config.duration
    const axisMove = this.getAxisGroupTransformation()
    const transform = `translate(0,${axisMove})`
    const isScatter = config.chartType.includes('scatter')
    const isBar = config.chartType.includes('bar')
    // NOTE: handling of tick-lengths is inferential
    // for scatters v. bars. There is confusion in DPs xAxis
    // properties regarding 'projection' (used for linear x-axes)
    // and 'lengths' (used for ordinal x-axes)
    let tickProjection = 0
    if (isBar) {
      tickProjection -= config.tickPrefs.projection.bar
    }
    const anchor = config.textPrefs.anchor[config.chartType]
    // Highlight zero flag (see yaxis-linear.updateYAxis)
    let highlightZero = config.mixedVals
    // Baseline width. By default this can be different from other
    // ticks. But all scatters and mixed bars are same as other ticks.
    let differentBaselineWidth = true
    if (isScatter) {
      differentBaselineWidth = false
    } else if (isBar && config.mixedVals) {
      differentBaselineWidth = false
    }
    axisGroup
      // Transition to scale top/bottom
      // .transition().duration(duration)
      .attr('transform', transform)
      // One transition on scale values
      .transition()
      .duration(duration)
      .call(xAxis)
      // Tick projection
      .selectAll('line')
      .attr('y1', tickProjection)
      // Allow separate baseline style
      .style('stroke-width', (ddd, iii) => {
        let sWid = config.tickPrefs.width
        if (iii === 0 && differentBaselineWidth) {
          sWid = config.tickPrefs.baseline.width
        }
        // But...
        if (ddd === 0 && highlightZero) {
          sWid = config.tickPrefs.zero.width
        }
        return sWid
      })
      .style('stroke', (ddd, iii) => {
        let sCol = config.tickPrefs.strokeValue
        // Zero
        if (ddd === 0) {
          if (highlightZero) {
            sCol = config.tickPrefs.zero.mixedValue
          } else if (iii === 0 && !isScatter) {
            // Inferential: scatters leave zero on standard gridline
            sCol = config.tickPrefs.baseline.strokeValue
          }
        }
        return sCol
      })
    // And text:
    axisGroup
      .selectAll('text')
      .style('font-family', config.textPrefs.font)
      .style('font-size', `${config.textPrefs.size.primaryOnly}px`)
      .style('fill', config.textPrefs.fillValue)
      .style('text-anchor', anchor)

    // Remove domain path
    axisGroup.selectAll('path').remove()
    // Label IDs with metadata
    axisGroup.selectAll('text').each(function(ddd, iii) {
      const thisLabel = d3.select(this)
      // ID: name and metadata
      thisLabel
        .attr('id', () => {
          // NOTE: I need to derive all element base ids from... somewhere
          let labID = `xaxis-label-${iii}`
          // fill
          const fillName = config.textPrefs.fill
          labID = `${labID}~~~fill:${fillName}`
          labID = `${labID},justification:${anchor}`
          labID = `${labID},leading:${config.textPrefs.leading}`
          // Getting the anchor position is a nightmare. I'm getting
          // WIDTH from bBox, then working with justification and
          // whatever Illustrator sets origin to...
          const bBox = thisLabel.node().getBBox()
          labID = `${labID},width:${bBox.width}`
          return labID
        })
        .attr('class', () => `xaxis-label-${iii}`)
    })

    // Tick IDs with metadata
    axisGroup
      .selectAll('line')
      // NOTE: again, 'function' for D3...
      // Linting errors disable at top
      .each(function(ddd, iii) {
        const thisTick = d3.select(this)
        thisTick.attr('id', () => {
          let tickID = `xaxis-tick-${iii}`
          // Stroke name (but check zero/baseline):
          let strokeName = config.tickPrefs.stroke
          if (ddd === 0) {
            if (iii === 0 && !isScatter) {
              strokeName = config.tickPrefs.baseline.stroke
            } else if (highlightZero) {
              strokeName = config.tickPrefs.zero.mixed
            }
          }
          tickID = `${tickID}~~~stroke:${strokeName}`
          return tickID
        })
      })

    // Negative labels have to be re-aligned to centre of
    // number (ignore '-')
    setTimeout(() => {
      AxisUtils.fixNegativeLabels(axisGroup)
    }, 50)

    // FIXME: this is a kludge: I need to revisit zero-line
    // I want an 'in-front' baseline. But I set it
    // down here so that code above doesn't do a red zero line at base...
    // NOTE: mod Nov'19: overlaid zero line for bar or thermo
    // Note, too, that YaxisLinear uses
    // an 'additionalBaseline' flag set in AxisUtis.
    if (config.minVal <= 0 && !isScatter) {
      highlightZero = true
    }
    // Zero line...
    if (highlightZero) {
      let start = axisMove
      // There may be a projection to end of tick
      if (config.chartType.includes('bar')) {
        const barProj = config.tickPrefs.projection.bar
        start -= barProj
      }
      let end = -xAxis.tickSize()
      // FIXME: kludge Nov'19 for scatters
      if (start === end) {
        start = 0
        // Additional kludge to prevent the red zeroline appearing in front of
        // any back baseline (strictly speaking, this is a stacking issue; but
        // there's a limit to how many permutations we can deal with)
        // I think this is scatter-specific; watch and wait...
        end -= config.tickPrefs.baseline.width / 2
      }
      const points = {
        start,
        end,
        scaleVal: config.scale(0),
      }
      AxisUtils.appendInFrontTick(config, false, points)
      // }
    }
  }
  // UPDATE X-AXIS ends

  // RENDER axis group
  render() {
    const config = this.props.config
    const grpNames = this.props.grpNames
    const cIndex = config.chartIndex
    const gClass = grpNames.outerClass
    const grpId = `${grpNames.outerId}${cIndex}`
    const tickId = `${grpNames.ticksId}${cIndex}`
    const labId = `${grpNames.labelsId}${cIndex}`
    const headerId = `${grpNames.headerId}${cIndex}`
    // Setting no fill prevents the SVG convertor from generating a path
    // outlining the group
    const gStyle = { fill: 'none' }
    return (
      <g className={gClass} id={grpId} style={gStyle}>
        <g id={tickId} style={gStyle} />
        <g id={labId} style={gStyle} />
        <g id={headerId} style={gStyle} />
      </g>
    )
  }
}

SilverXaxisLinear.propTypes = {
  config: PropTypes.object,
  // Not passed in; declared here as default prop
  axis: PropTypes.func,
  grpNames: PropTypes.object,
}

export default SilverXaxisLinear
