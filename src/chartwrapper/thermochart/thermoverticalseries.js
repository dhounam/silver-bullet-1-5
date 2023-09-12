import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities modules
import * as ThermoUtilities from './thermo-utilities'
import * as ChartUtilities from '../chart-utilities'

class SilverThermoVerticalSeries extends Component {
  // COMPONENT DID MOUNT
  componentDidMount() {
    // To guarantee that we only update on 2nd render:
    if (!this.props.config.firstRender) {
      this.updateThermos()
      // const context = this.props.config.className.split(' ')[1]
      // const context = 'zeroline-group';
      // ChartUtilities.updateAnyZeroLine(this.props.config, context, true);
      // this.updateZeroLine()
    }
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    // To guarantee that we only update on 2nd render:
    if (!this.props.config.firstRender) {
      this.updateThermos()
      // const context = this.props.config.className.split(' ')[1]
      // const context = 'zeroline-group';
      // ChartUtilities.updateAnyZeroLine(this.props.config, context, true);
      // this.updateZeroLine()
    }
  }

  // ======= Event handler ======

  // THERMO CLICK
  // Handles thermo click event. Params are data (cat and value)
  // and index in overall data.
  // NOTE: This event currently gets passed back up to
  // ThermoChart, where I do a console.log. Long-term, I might
  // use this to set 'emphasis'...
  thermoClick(colData, index) {
    const clickObj = { colData, index }
    this.props.onPassThermoClick(clickObj)
  }
  // BAR CLICK ends

  // ======= Spindles ======

  // ENTER SPINDLES
  // Called from updateThermos
  enterSpindles(spindleBinding, config) {
    const styles = config.styles.spindle
    spindleBinding
      .enter()
      .append('line')
      .attr({
        class: 'thermo-spindle',
        id: (ddd, iii) => {
          let idStr = `thermo-spindle-${iii}`
          idStr = `${idStr}~~~stroke:${styles.stroke}`
          return idStr
        },
      })
      .style({
        stroke: config.colourLookup[styles.stroke],
        'stroke-width': styles.width,
      })
  }
  // ENTER SPINDLES ends

  // UPDATE SPINDLES
  // Called from updateThermos
  updateSpindles(spindleBinding, config) {
    spindleBinding.attr({
      class: 'thermo-spindle',
      x1: (ddd) => config.xMainScale(ddd.category),
      x2: (ddd) => config.xMainScale(ddd.category),
      width: (ddd) => ddd.strokewidth,
      y1: (ddd) => config.yScale(ddd.max),
      y2: (ddd) => {
        let y2 = config.yScale(ddd.min)
        if (config.isLog) {
          y2 = config.yScale(config.minVal)
        } else if (config.seriesCount === 1 && config.breakScale) {
          y2 = config.yScale(config.minVal) + config.brokenScalePadding
        }
        return y2
      },
    })
  }
  // UPDATE SPINDLES ends

  // EXIT SPINDLES
  // Called from updateThermos
  exitSpindles(spindleBinding, duration) {
    spindleBinding
      .exit()
      .transition()
      .duration(duration)
      .attr('opacity', 0)
    spindleBinding
      .exit()
      .transition()
      .delay(duration * 2)
      .remove()
  }
  // EXIT SPINDLES ends

  // ======= Line Markers ======

  // ENTER LINE MARKERS
  // Called from updateThermos
  enterLineMarkers(markerBinding, config) {
    const styles = config.styles.line
    // Enter appends line in place, with zero width
    markerBinding
      .enter()
      .append('line')
      .attr({
        class: 'd3-thermo-marker',
        x1: (ddd) => {
          let xPos = config.xMainScale(ddd.category)
          xPos -= styles.length / 2
          return xPos
        },
        x2: (ddd) => {
          let xPos = config.xMainScale(ddd.category)
          xPos += styles.length / 2
          return xPos
        },
        'stroke-width': 0,
        y1: config.bounds.height,
        y2: config.bounds.height,
        id: (ddd, iii) => {
          let idStr = `thermo-vertical-series-${iii}`
          idStr = `${idStr}~~~stroke:${ddd.strokeName}`
          return idStr
        },
      })
      // Set click event on rect
      .on('click', (ddd, iii) => this.thermoClick(ddd, iii))
      // Crude tooltip (populated in update)
      // NOTE: can't use '=>' because D3 needs to select 'this'
      /* eslint-disable func-names, no-invalid-this */
      .each(function() {
        d3.select(this)
          .append('svg:title')
          .attr('class', 'd3-tooltip')
      })
    return markerBinding
  }
  // ENTER LINE MARKERS ends

  // UPDATE LINE MARKERS
  // Called from updateThermos
  updateLineMarkers(markerBinding, config) {
    markerBinding
      .transition(config.duration)
      .attr({
        'stroke-width': config.styles.line.width,
        y1: (ddd) => config.yScale(ddd.val),
        y2: (ddd) => config.yScale(ddd.val),
      })
      .style('stroke', (ddd) => ddd.stroke)
  }
  // UPDATE LINE MARKERS ends

  // EXIT LINE MARKERS
  exitLineMarkers(markerBinding, duration) {
    markerBinding
      .exit()
      .transition()
      .duration(duration)
      .attr('opacity', 0)
    markerBinding
      .exit()
      .transition()
      .delay(duration * 2)
      .remove()
  }
  // EXIT LINE MARKERS ends

  // ======= Dot Markers ======

  // ENTER DOT MARKERS
  // Called from updateThermos
  enterDotMarkers(markerBinding, config) {
    // Enter appends line in place, with zero width
    markerBinding
      .enter()
      .append('circle')
      .attr({
        class: 'd3-thermo-marker',
        cx: (ddd) => config.xMainScale(ddd.category),
        cy: config.yScale(0),
        r: 0,
        'stroke-width': 0,
        id: (ddd, iii) => {
          let idStr = `thermo-vertical-series-${iii}`
          idStr = `${idStr}~~~fill:${ddd.fillName}`
          return idStr
        },
      })
      // Set click event on rect
      .on('click', (ddd, iii) => this.thermoClick(ddd, iii))
      // Crude tooltip (populated in update)
      // NOTE: can't use '=>' because D3 needs to select 'this'
      /* eslint-disable func-names, no-invalid-this */
      .each(function() {
        d3.select(this)
          .append('svg:title')
          .attr('class', 'd3-tooltip')
      })
    return markerBinding
  }
  // ENTER DOT MARKERS ends

  // UPDATE DOT MARKERS
  // Called from updateThermos
  updateDotMarkers(markerBinding, config) {
    const styles = config.styles.dot
    markerBinding
      .transition(config.duration)
      .attr({
        'stroke-width': styles.strokeWidth,
        cy: (ddd) => config.yScale(ddd.val),
        r: styles.radius,
      })
      .style('fill', (ddd) => ddd.fill)
  }
  // UPDATE DOT MARKERS ends

  // EXIT DOT MARKERS
  exitDotMarkers(markerBinding, duration) {
    markerBinding
      .exit()
      .transition()
      .duration(duration)
      .attr('opacity', 0)
    markerBinding
      .exit()
      .transition()
      .delay(duration * 2)
      .remove()
  }
  // EXIT DOT MARKERS ends

  // ========== MAIN UPDATE FUNCTION ============

  // UPDATE THERMOS
  updateThermos() {
    const config = this.props.config
    // Context (parent group created in render) and duration
    // (NOTE: In the long term, we'd need more than one group...)
    const className = config.className.split(' ')[1]
    const mainSeriesGroup = d3.select(`.${className}`)
    // SPINDLE
    // Values for the 'spindle'
    const spindleData = ThermoUtilities.mapSpindleData(config)
    // Group
    // Originally nested spindles with series. As of Jul'20,
    // in separate group, rendered in parent
    // const spindleGroup = mainSeriesGroup.append('g').attr({
    //   class: 'thermo-spindle-group',
    //   id: 'thermo-spindle-group',
    // });
    // Bind
    const spindleGroupClass = `.${this.props.spindlesId}`
    const spindleGroup = d3.select(spindleGroupClass)
    const spindleBinding = spindleGroup
      .selectAll('.thermo-spindle')
      .data(spindleData)
    // Enter
    this.enterSpindles(spindleBinding, config)
    // Update
    this.updateSpindles(spindleBinding, config)
    // Exit
    this.exitSpindles(spindleBinding, config.duration)

    // SERIES
    // Map the actual series data:
    // As far as I can see, the data is in the right format:
    // an array of objects with header:value properties
    const mappedData = ChartUtilities.mapSeriesData(config, false)
    // mappedData is an array of arrays, each of which represents a series
    // Each series sub-array consists of <pointCount> objects
    // defining one data point and with properties...
    //    category: the category string
    //    fill: fill colour
    //    val: the 'internal', *unscaled* value of THIS point

    // Outer binding
    const groupBinding = ChartUtilities.makeBarColSeriesGroupBinding(
      mainSeriesGroup,
      mappedData,
      config.duration,
      'thermo'
    )
    // Bind inner (points) data
    const markerBinding = groupBinding
      .selectAll('.d3-thermo-marker')
      .data((ddd) => ddd)
    if (config.dotFlag) {
      this.enterDotMarkers(markerBinding, config)
      this.updateDotMarkers(markerBinding, config)
      this.exitDotMarkers(markerBinding, config.duration)
    } else {
      this.enterLineMarkers(markerBinding, config)
      this.updateLineMarkers(markerBinding, config)
      this.exitLineMarkers(markerBinding, config.duration)
    }
  }
  // UPDATE THERMOS ends

  // RENDER all-series parent group:
  render() {
    return (
      <g
        className={this.props.config.className}
        id="series-group:thermo-vertical"
      />
    )
  }
}

SilverThermoVerticalSeries.propTypes = {
  spindlesId: PropTypes.string,
  config: PropTypes.object,
  onPassThermoClick: PropTypes.func,
}
export default SilverThermoVerticalSeries
