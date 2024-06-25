import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities modules
import * as ChartUtilities from '../chart-utilities'

class SilverSeriesColumn extends Component {
  // COMPONENT DID MOUNT
  componentDidMount() {
    // To guarantee that we only update on 2nd render:
    if (!this.props.config.firstRender) {
      this.updateColumns()
    }
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    // To guarantee that we only update on 2nd render:
    if (!this.props.config.firstRender) {
      this.updateColumns()
    }
  }

  // ======= Event handler ======

  // COLUMN CLICK
  // Handles column click event. Params are data (cat and value)
  // and index in overall data.
  // NOTE: This event currently gets passed back up to
  // ColumnChart, where I do a console.log. Long-term, I might
  // use this to set 'emphasis' on the column...
  // NOTE: I set up this and other click events during
  // development, but they were at least partly dismantled along the way...
  columnClick(colData, index) {
    const clickObj = { colData, index }
    // Double-scale passes a line-click, so this is a crude trap
    if (typeof this.props.onPassColumnClick !== 'undefined') {
      this.props.onPassColumnClick(clickObj)
    }
  }
  // BAR CLICK ends

  // ENTER COL BINDING
  enterColBinding(groupBinding, config) {
    // Bind inner (points) data
    const rectBinding = groupBinding
      .selectAll('.d3-column-rect')
      .data((ddd) => ddd)
    // Enter appends rect on zero, at zero height
    // Default col width
    rectBinding
      .enter()
      .append('rect')
      .attr({
        class: 'd3-column-rect',
        x: (ddd) => config.xMainScale(ddd.category),
        // 'width': colWidth,
        // 'width': Math.max(xMainScale.rangeBand(), 0),
        width: 0,
        y: config.yScale(0),
        height: 0,
        id: (ddd, iii) => {
          let idStr = `column-series-${iii}`
          idStr = `${idStr}~~~fill:${ddd.fillName}`
          return idStr
        },
      })
      // Set click event on rect
      .on('click', (ddd, iii) => this.columnClick(ddd, iii))
      // Crude tooltip (populated in update)
      // NOTE: can't use '=>' because D3 needs to select 'this'
      /* eslint-disable func-names, no-invalid-this */
      .each(function() {
        d3.select(this)
          .append('svg:title')
          .attr('class', 'd3-tooltip')
      })
    return rectBinding
  }
  // ENTER COL BINDING ends

  // UPDATE COL BINDING
  // Called from updateColumns to handle the D3 update. Params are the
  // inner binding (by series), the config object, and an array for
  // keeping track of stacking
  updateColBinding(rectBinding, config, baseVals) {
    // Are both 'sides', if mixed, columns?
    let bothCols = false
    if (config.isMixed) {
      bothCols = config.bothCols
    }
    // Cluster and column widths...
    // I need widths for clusters and for individual columns
    // (if stacked, these are, of course, the same)
    let clusterWidth = config.xMainScale.rangeBand() - config.padding
    let colWidth = config.xClusterScale.rangeBand()
    if (config.accum) {
      colWidth = clusterWidth
    }
    // Don't be 0
    clusterWidth = Math.max(clusterWidth, 0.1)
    colWidth = Math.max(colWidth, 0.1)
    // Remember:
    // If stacked, colWidth = clusterWidth = entire stack width
    // If unstacked, colWidth = clusterWidth / no. of cols
    //
    rectBinding
      .transition()
      .duration(config.duration)
      .attr({
        // Vert ('y') origin
        y: (ddd, iii) => {
          // iii is point-counter here
          // By default, since SVG draws from top, set y to val:
          // (assumes val is positive; overwrites negative below)
          let yPos = Number(ddd.val)
          if (config.accum) {
            // Stacked bars
            const val = yPos
            if (val < 0) {
              // If val is negative, subtract it from previous loop's
              // baseline. Baseline increments negatively for next
              // neg value
              const baseVal = baseVals[iii].negBase
              yPos = baseVal
              baseVals[iii].negBase += val
            } else {
              // + val. Use prev baseline, then increment for next +
              const baseVal = baseVals[iii].posBase
              yPos += baseVal
              baseVals[iii].posBase += val
            }
          } else if (yPos <= 0) {
            // But non-accum draw neg vals *from* zero
            yPos = 0
          }
          return config.yScale(yPos)
        },
        // Height: force to positive value, subtracting from
        // scaled zero...
        height: (ddd) => {
          let hgt = config.yScale(0) - config.yScale(Math.abs(Number(ddd.val)))
          // But if scale breaks...
          if (config.breakScale) {
            hgt =
              config.yScale(config.minVal) -
              config.yScale(Math.abs(Number(ddd.val)))
            hgt += config.brokenScalePadding
          }
          // Don't allow neg height!
          return Math.max(hgt, 0)
        },
        // X position
        x: (ddd) => {
          // Default cluster position
          let xPos = config.xMainScale(ddd.category)
          // Mixed series, shift r/h series
          if (bothCols && !config.isLeft) {
            xPos += clusterWidth / 2
          }
          // Stacked cols don't shift within the cluster, but...
          if (!config.accum) {
            // Unstacked are in clusters, add internal cluster scaling
            // And for mixed, /2
            if (bothCols) {
              xPos += config.xClusterScale(ddd.header) / 2
            } else {
              xPos += config.xClusterScale(ddd.header)
            }
          }
          return xPos
        },
        width: () => {
          let wid = colWidth
          if (bothCols) {
            wid /= 2
          }
          // Don't be less than zero!
          return Math.max(wid, 0)
        },
      })
      .style('fill', (ddd) => ddd.fill)
      // Populate tooltip (set up by 'enter')
      .each(function(ddd) {
        const myBar = d3.select(this)
        myBar
          .select('title')
          .text(
            `Header: ${ddd.header}; category: ${ddd.category}; value: ${ddd.val}`
          )
      })
    // Deleted columns-too-narrow error callback
  }
  // UPDATE COL BINDING ends

  // EXIT COL BINDING
  exitColBinding(colBinding, duration) {
    colBinding
      .exit()
      .transition()
      .duration(duration)
      .attr('height', 0)
    colBinding
      .exit()
      .transition()
      .delay(duration * 2)
      .remove()
  }
  // EXIT COL BINDING ends

  // UPDATE COLUMNS
  updateColumns() {
    const config = this.props.config
    // Context (parent group created in render) and duration
    // (NOTE: In the long term, we'd need more than one group...)
    const className = config.className.split(' ')[1]
    const mainSeriesGroup = d3.select(`.${className}`)
    //

    // Map the actual series data:
    // As far as I can see, the data is in the right format:
    // an array of objects with header:value properties
    const mappedData = ChartUtilities.mapSeriesData(config, false)
    // Array of +/– base vals for 'opposing' charts
    const baseVals = ChartUtilities.getSeriesBaseVals(config.pointCount)
    // mappedData is an array of arrays, each of which represents a series
    // Each series sub-array consists of <pointCount> objects
    // defining one data point and with properties...
    //    category: the category string
    //    fill: fill colour
    //    val: the 'internal', *unscaled* value of THIS point

    // Columns
    // Outer binding
    const groupBinding = ChartUtilities.makeBarColSeriesGroupBinding(
      mainSeriesGroup,
      mappedData,
      config.duration,
      'column'
    )
    const rectBinding = this.enterColBinding(groupBinding, config)
    this.updateColBinding(rectBinding, config, baseVals)
    this.exitColBinding(rectBinding, config.duration)
  }
  // UPDATE COLUMNS ends

  // RENDER all-series parent group:
  render() {
    return (
      <g className={this.props.config.className} id="series-group:column" />
    )
  }
}

SilverSeriesColumn.propTypes = {
  config: PropTypes.object,
  onPassColumnClick: PropTypes.func,
}

export default SilverSeriesColumn
