import * as d3 from 'd3';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Utilities modules
import * as ChartUtilities from '../chart-utilities';

class SilverSeriesBar extends Component {
  // COMPONENT DID MOUNT
  componentDidMount() {
    // To guarantee that we only update on 2nd render:
    if (!this.props.config.firstRender) {
      this.updateBars();
    }
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    // To guarantee that we only update on 2nd render:
    if (!this.props.config.firstRender) {
      this.updateBars();
    }
  }

  // ======= Event handler ======

  // BAR CLICK
  // Handles bar click event. Params are data (cat and value)
  // and index in overall data.
  // NOTE: This event currently gets passed back up to
  // BarChart, where I do a console.log. Long-term, I might
  // use this to set 'emphasis' on the bar...
  barClick(barData, index) {
    const clickObj = { barData, index };
    this.props.onPassBarClick(clickObj);
  }
  // BAR CLICK ends

  // GET COLOURS
  // Called from updateBars to map colours by series
  /*
  NOTE: moved to chart-utilities, Sep 2016
  NOTE: delete eventually (along with call from updateColumns)...
  getColours(seriesNames, colourSet) {
    // Colours from config file
    // const colourSet = [ '#004D64', '#6995A8', '#009FD8', '#ACADB0' ];
    const colourScale = d3.scale.ordinal()
      .domain(seriesNames)
      .range(colourSet);
    return colourScale;
  }
  */
  // GET COLOURS ends

  // UPDATE BARS
  updateBars() {
    const config = this.props.config;
    // Context (parent group created in render) and duration
    // (NOTE: In the long term, we'd need more than one group...)
    const className = config.className.split(' ')[1];
    const mainSeriesGroup = d3.select(`.${className}`);
    // NOTE: duration is still up in the air...
    const duration = config.duration;
    // Passed scales:
    const xScale = config.xScale;
    const yMainScale = config.yMainScale;
    const yClusterScale = config.yClusterScale;
    const accum = config.accum;
    // Broken scale flag:
    const breakScale = config.breakScale;
    // Map data:
    // As far as I can see, the data is in the right format:
    // an array of objects with header:value properties
    const mappedData = ChartUtilities.mapSeriesData(config, false);
    // Array of +/– base vals for 'opposing' charts
    const baseVals = ChartUtilities.getSeriesBaseVals(config.pointCount);
    // mappedData is an array of arrays, each of which represents a series
    // Each series sub-array consists of <pointCount> objects
    // defining one data point and with properties...
    //    category: the category string
    //    fill: fill colour
    //    y: the 'internal' value of THIS point
    // At this stage, these are unscaled vals

    // Outer binding
    const groupBinding = ChartUtilities.makeBarColSeriesGroupBinding(
      mainSeriesGroup,
      mappedData,
      duration,
      'bar',
    );

    // Bind inner (points) data
    const rectBinding = groupBinding.selectAll('.d3-bar-rect').data(ddd => ddd);
    // Enter appends rect on zero, at zero width
    rectBinding
      .enter()
      .append('rect')
      .attr({
        class: 'd3-bar-rect',
        y: ddd => yMainScale(ddd.category),
        height: Math.max(yMainScale.rangeBand(), 0.1),
        x: xScale(0),
        width: 0,
        id: (ddd, iii) => {
          let idStr = `bar-series-${iii}`;
          idStr = `${idStr}~~~fill:${ddd.fillName}`;
          return idStr;
        },
      })
      // Set click event on rect
      .on('click', (ddd, iii) => this.barClick(ddd, iii))
      // Crude tooltip (populated in update)
      // NOTE: can't use '=>' because D3 needs to select 'this'
      /* eslint-disable func-names, no-invalid-this */
      .each(function() {
        d3.select(this)
          .append('svg:title')
          .attr('class', 'd3-tooltip');
      });

    // Update.
    // NOTE: this can handle +/– values, but (for now) insists upon a 'default'
    // anchorage to zero (ie, it can't handle broken scales...)
    rectBinding
      .transition()
      .duration(duration)
      .attr({
        // Left ('x') position
        x: (ddd, iii) => {
          // iii is point-counter here
          // We're drawing from rect left. Default origin = value
          // (assumes val is neg; positive overwrites below)
          let xPos = Number(ddd.val);
          // Set any padding for a broken scale to default zero
          let breakPadding = 0;
          if (accum) {
            // Stacked bars
            // ddd.y is value
            const val = Number(ddd.val);
            if (val < 0) {
              // If val is negative, subtract it from previous loop's
              // baseline. Baseline increments negatively for next
              // neg value
              const baseVal = baseVals[iii].negBase;
              xPos = baseVal + val;
              baseVals[iii].negBase += val;
            } else {
              // + val. Use prev baseline, then increment for next +
              const baseVal = baseVals[iii].posBase;
              xPos = baseVal;
              baseVals[iii].posBase += val;
            }
          } else if (xPos >= 0) {
            if (breakScale) {
              xPos = config.minVal;
              // And, for this case only, set BS padding:
              breakPadding = config.brokenScalePadding;
            } else {
              // Non-accum draw positive vals *from* zero
              xPos = 0;
            }
          }
          // xPos += breakPadding;
          // Return scaled xPos with any breakPadding
          return xScale(xPos) - breakPadding;
        },
        // Width: force to positive value, subtracting
        // scaled zero...
        width: ddd => {
          let wid = xScale(Math.abs(Number(ddd.val))) - xScale(0);
          // But if scale breaks...
          if (breakScale && !accum) {
            wid = xScale(Math.abs(Number(ddd.val))) - xScale(config.minVal);
            wid += config.brokenScalePadding;
          }
          // Don't allow neg width!
          return Math.max(wid, 0);
        },
        // Y position
        y: ddd => {
          let yPos = 0;
          if (accum) {
            // Stacked bars...
            yPos = yMainScale(ddd.category);
          } else {
            // Unstacked are in clusters. Get the overall cluster position:
            yPos = yMainScale(ddd.category);
            // ...then append internal cluster scaling:
            yPos += yClusterScale(ddd.header);
          }
          return yPos;
        },
        // Bar height
        height: () => {
          // Default is non-accum height...
          let hgt = yClusterScale.rangeBand();
          if (accum) {
            hgt = yMainScale.rangeBand() - config.padding;
          }
          // Don't be less than zero!
          return Math.max(hgt, 0);
        },
      })
      .style('fill', ddd => ddd.fill)
      // Populate tooltip (set up by 'enter')
      .each(function(ddd) {
        const myBar = d3.select(this);
        myBar
          .select('title')
          .text(
            `Header: ${ddd.header}; category: ${ddd.category}; value: ${ddd.val}`,
          );
      });

    // NOTE: EXIT isn't right yet...
    rectBinding
      .exit()
      .transition()
      .duration(duration)
      .attr('width', 0);
    rectBinding
      .exit()
      .transition()
      .delay(duration * 2)
      .remove();
  }
  // UPDATE BARS ends

  // UPDATE ZERO LINE
  // Handles any zero line
  updateZeroLine() {
    const config = this.props.config;
    const zPrefs = config.zeroPrefs;
    const className = config.className.split(' ')[1];
    const barGroup = d3.select(`.${className}`);
    const duration = config.duration;
    // Scale:
    const xScale = config.xScale;
    // How will the zero line appear?
    let zColour = zPrefs.simple;
    if (config.mixedVals) {
      zColour = zPrefs.mixed;
    }
    const zWidth = zPrefs.width;
    const zClass = 'd3-col-zero';
    // Bind data (needs *some* value)
    const zBinding = barGroup.selectAll('line').data([0]);
    const height = config.bounds.height;
    // NOTE: next makes assumptions:
    const proj = 0 - config.tickProjection;
    //
    // ENTER
    zBinding.enter().append('line');
    // NOTE. This can handle +/– values, but insists upon a 'default'
    // anchorage to zero (ie, it can't handle broken scales... yet)
    // (Although if scale breaks, the zero line will vanish somewhere off-chart...)
    zBinding
      .transition()
      .duration(duration)
      .attr({
        class: zClass,
        x1: xScale(0),
        y1: proj,
        x2: xScale(0),
        y2: height,
      })
      .style({
        'stroke-width': zWidth,
        stroke: zColour,
      });

    zBinding.exit().remove();
  }
  // UPDATE ZERO LINE ends

  // RENDER all-series parent group:
  render() {
    return <g className={this.props.config.className} id="series-group:bar" />;
  }
}

SilverSeriesBar.propTypes = {
  config: PropTypes.object,
  onPassBarClick: PropTypes.func,
};

export default SilverSeriesBar;
