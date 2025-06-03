import * as d3 from 'd3';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as ChartUtilities from '../chart-utilities';
import * as ScatterTrendline from './scattertrendline';
import * as ScatterZKey from './scatterzkey';

class SilverScatterSeries extends Component {
  componentDidMount() {
    // To guarantee that we only update on 2nd render:
    if (!this.props.config.firstRender) {
      this.updateScatter();
    }
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    // To guarantee that we only update on 2nd render:
    if (!this.props.config.firstRender) {
      this.updateScatter();
    }
  }

  // DOT CLICK
  // Handles bar click event. Params are data (cat and value)
  // and index in overall data.
  // NOTE: This event currently gets passed back up to
  // ScatterChart, where I do a console.log. Long-term, I might
  // use this to set 'emphasis'...
  dotClick(dotData, index) {
    const clickObj = { dotData, index };
    this.props.onPassDotClick(clickObj);
  }
  // DOT CLICK ends

  // GET OUTER GROUP
  // Called from updateScatter
  getOuterGroup(config) {
    const className = config.className.split(' ')[1];
    const grp = d3.select(`.${className}`);
    return grp;
  }
  // GET OUTER GROUP ends

  // MAKE OUTER BINDING
  // Called from updateScatter. Binds data to outer group
  makeOuterBinding(outerGroup, mappedData) {
    const outerBinding = outerGroup
      .attr({ class: 'outer-group' })
      .selectAll('circle')
      .data(mappedData)
      .enter();
    return outerBinding;
  }
  // MAKE OUTER BINDING ends

  // BIND SERIES GROUPS
  // Called from updateScatter. Binds data to series groups
  bindSeriesGroups(outerBinding) {
    const seriesGroup = outerBinding
      .append('g')
      .attr({ class: (ddd, iii) => `series-group-${iii}` })
      .selectAll('circle')
      .data(function(d) {
        return d;
      })
      .enter();
    return seriesGroup;
  }
  // BIND SERIES GROUPS ends

  // BIND POINT GROUPS
  // Called from updateScatter. Binds data to point groups
  bindPointGroups(seriesGroups) {
    const pointGroups = seriesGroups
      .append('g')
      .attr('class', 'point-group')
      .selectAll('.dot')
      .data(ddd => ddd)
      .enter();
    return pointGroups;
  }
  // BIND POINT GROUPS ends

  // LABEL FILTER
  // Called from appendLine and appendText to determine
  // whether point is labelled. If forceLabel is true, all
  // points are labelled, otherwise checks the category string
  labelFilter(ddd, forceLabel, labelMarker) {
    let label = false;
    const cat = ddd.category;
    if (typeof cat !== 'undefined') {
      if (forceLabel || cat.endsWith(labelMarker)) {
        label = true;
      }
    }
    return label;
  }
  // LABEL FILTER

  // APPEND LINE
  // Called from populatePoints to draw link-line
  appendLine(config, pointGroups) {
    const lPrefs = config.seriesPrefs.links;
    const forceLabel = config.labels;
    const labelMarker = config.seriesPrefs.labelMarker;
    pointGroups
      .append('line')
      .filter(ddd => this.labelFilter(ddd, forceLabel, labelMarker))
      .attr({
        class: 'scatter-link',
        x1: ddd => config.xScale(ddd.valX),
        x2: ddd => config.xScale(ddd.valX),
        y1: ddd => config.yScale(ddd.valY),
        y2: ddd => config.yScale(ddd.valY) - lPrefs.length,
        id: () => {
          let idStr = `scatter-link`;
          idStr = `${idStr}~~~stroke:${lPrefs.stroke}`;
          return idStr;
        },
      })
      .style({
        'stroke-width': lPrefs.width,
        stroke: config.colourLookup[lPrefs.stroke],
      });
  }
  // APPEND LINE ends

  // APPEND TEXT
  // Called from populatePoints
  appendText(config, pointGroups) {
    const tPrefs = config.seriesPrefs.text;
    const textY = config.seriesPrefs.links.length - tPrefs.y;
    const forceLabel = config.labels;
    const labelMarker = config.seriesPrefs.labelMarker;
    pointGroups
      .append('text')
      .filter(ddd => this.labelFilter(ddd, forceLabel, labelMarker))
      .attr({
        class: 'scatter-label',
        x: ddd => config.xScale(ddd.valX) + tPrefs.x,
        y: ddd => config.yScale(ddd.valY) - textY,
        fill: config.colourLookup[tPrefs.fill],
        id: () => {
          // Note that I never revisit id to set width, since text remains left-aligned
          let tID = `scatter-label`;
          tID = `${tID}~~~fill:${tPrefs.fill}`;
          tID = `${tID}, justification:${tPrefs.anchor}`;
          return tID;
        },
      })
      .style({
        'font-size': `${tPrefs.size}px`,
        'font-family': tPrefs.font,
        // Not currently set
        // leading: tPrefs.leading,
      })
      .text(ddd => {
        let cat = ddd.category;
        if (cat.endsWith(labelMarker)) {
          cat = cat.slice(0, -1);
        }
        return cat;
      });
  }
  // APPEND TEXT ends

  // APPEND DOT
  // Called from populatePoints
  appendDot(config, pointGroups) {
    const dPrefs = config.seriesPrefs.dots;
    const dotCircleScale = ScatterZKey.getSizedDotScale(config);
    pointGroups
      .append('circle')
      .attr({
        class: 'scatter-dot',
        cx: ddd => config.xScale(ddd.valX),
        cy: ddd => config.yScale(ddd.valY),
        r: ddd => {
          let rad = dPrefs.fixedRadius;
          if (config.isSized) {
            rad = dotCircleScale(ddd.valZ) / 2;
            rad = Math.max(rad, 0.5);
          }
          return rad;
        },
        id: ddd => {
          let idStr = `scatter-dot`;
          idStr = `${idStr}~~~fill:${ddd.fillName}`;
          idStr = `${idStr},name:${ddd.category.replace(/,/g, '')}`;
          return idStr;
        },
      })
      .style({
        fill: ddd => config.colourLookup[ddd.fillName],
        opacity: () => {
          let opac = dPrefs.fixedOpacity;
          if (config.isSized) {
            opac = dPrefs.sizedOpacity;
          }
          return opac;
        },
      })
      // Set click event on dot
      .on('click', (ddd, iii) => this.dotClick(ddd, iii));
  }
  // APPEND DOT ends

  // POPULATE POINTS
  // Called from updateScatter. Calls sub-handlers to append
  // elements to datapoint group
  // FIXME: appending line and text will be optional
  populatePoints(config, pointGroups) {
    // if (config.labels) {
    this.appendLine(config, pointGroups);
    this.appendText(config, pointGroups);
    // }
    this.appendDot(config, pointGroups);
  }
  // POPULATE POINTS ends

  // UPDATE SCATTER
  // Called from componentDidMount/Update, to do the main business
  updateScatter() {
    const config = this.props.config;
    // Context: outer group, created in render, contains all series
    const outerGroup = this.getOuterGroup(config);
    // Get the data in D3-friendly shape (see note in function
    // on array structure)
    const mappedData = ChartUtilities.mapScatterSeriesData(config);
    // Outer binding
    const outerBinding = this.makeOuterBinding(outerGroup, mappedData);
    // Series groups
    const seriesGroups = this.bindSeriesGroups(outerBinding);
    // Groups for individual data points
    const pointGroups = this.bindPointGroups(seriesGroups);
    // Each point group contains a dotmarker and (optional)
    // linking-line and text
    this.populatePoints(config, pointGroups);
    // Trend line?
    if (config.trendline) {
      ScatterTrendline.controlTrendlines(config, outerGroup);
    }
    // And if there's a z-axis, we need a header:
    if (config.isSized) {
      ScatterZKey.addZKey(config, outerGroup);
    }
  }

  // RENDER all-series parent group:
  render() {
    return (
      <g className={this.props.config.className} id="series-group:scatter" />
    );
  }
}

SilverScatterSeries.propTypes = {
  config: PropTypes.object.isRequired,
  onPassDotClick: PropTypes.func,
};

export default SilverScatterSeries;
