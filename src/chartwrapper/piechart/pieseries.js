import * as d3 from 'd3';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Utilities modules
import * as ChartUtils from '../chart-utilities';
import * as TextWrapping from '../chartside-utilities/text-wrapping';

class SilverPieSeries extends Component {
  constructor(props) {
    super(props);
    // ARC FCN to draw trace
    this.arcFcn = d3.svg
      .arc()
      // .outerRadius(props.config.outerRad)
      // .innerRadius(props.config.innerRad);
      .outerRadius(40)
      .innerRadius(0);
    // KEY -- used???
    this.keyFcn = ddd => ddd.data.label;
    // PIE: position of each wedge
    this.pie = d3.layout
      .pie()
      .sort(null)
      .value(ddd => ddd.val);
    // HALF PIE
    this.halfpie = d3.layout
      .pie()
      .startAngle(-90 * (Math.PI / 180))
      .endAngle(90 * (Math.PI / 180))
      .sort(null)
      .value(ddd => ddd.val);
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    this.updatePies();
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    this.updatePies();
  }

  // AFTER PIE HEADER WRAP
  // Callback after header wraps. Adjusts position to
  // align vertically on centre of pie.
  afterPieHeaderWrap(globalThis, lineCountArray, textWrapConfig) {
    const config = globalThis.props.config;
    const hPrefs = config.piePrefs.header;
    const hSize = hPrefs.size;
    const hLeading = hPrefs.leading;
    const emVal = config.emVal;
    const hCount = textWrapConfig.index;
    const head = d3.select(`.pie-header-${hCount}`);
    // Initially, the header baseline is aligned to pie centre
    // Half pie will simply move down by leading
    let tweak = hLeading;
    if (!textWrapConfig.isHalfPie) {
      // Full pie is more complicated. Initial tweak moves down, so mid of top line is aligned to pie centre
      tweak = (hSize * emVal) / 2;
      // ...then up, to align centre of block
      const lineCount = lineCountArray[0];
      tweak -= ((lineCount - 1) * hLeading) / 2;
    }
    // First move the overall text element
    let yPos = +head.attr('y') + tweak;
    head.attr('y', yPos);
    // Now each tSpan
    const tSpans = head.selectAll('tspan');
    tSpans.each(function() {
      const tSpan = d3.select(this);
      yPos = tSpan.attr('y');
      if (yPos !== null) {
        // Only adjust if tSpan has a 'y' value,
        // indicating a new line. tSpans with no
        // explicit position are italics or bold,
        // continuing same line as prev tSpan
        yPos = +yPos + tweak;
        tSpan.attr('y', yPos);
      }
    });
  }
  // AFTER PIE HEADER WRAP ends

  // BIND PIE GROUPS
  // Called from updatePies. Binds data for individual pies
  // to a series of appended groups, which are
  // translated to the centre position for each pie
  bindPieGroups(config) {
    // Parent group, named in parent component
    const parentGrp = d3.select(`.${config.className}`);
    // Get the data in D3-friendly shape (see note in function
    // on array structure)
    const mappedData = ChartUtils.mapSeriesData(config, true);
    // Array of bounds and positions for each pie
    const pbArray = config.pieBoundsArray;

    const pieGrps = parentGrp
      .selectAll('g')
      .data(mappedData)
      .enter()
      .append('g')
      .attr({
        class: (ddd, iii) => `single-pie-group-${iii}`,
        transform: (ddd, iii) => {
          const cx = pbArray[iii].cx;
          const cy = pbArray[iii].cy;
          return `translate(${cx},${cy})`;
        },
      });
    return pieGrps;
  }
  // BIND PIE GROUPS ends

  // DRAW PIE WEDGES
  // Called from updatePies to draw pies
  drawPieWedges(pieGrps, wedgeProps) {
    const config = this.props.config;
    let pieFcn = this.pie;
    if (config.chartType === 'halfpie') {
      pieFcn = this.halfpie;
    }
    // Default prefs:
    // (wedgeProps are specific; pwPrefs are default style preferences)
    const pwPrefs = config.piePrefs.wedges;
    pieGrps
      .selectAll('path')
      .data(pieFcn)
      .enter()
      .append('path')
      .attr({
        d: d3.svg
          .arc()
          .innerRadius(wedgeProps.innerRad)
          .outerRadius(wedgeProps.outerRad),
        id: ddd => `pie-wedge~~~fill:${ddd.data.fillName}`,
      })
      .style({
        fill: ddd => ddd.data.fill,
        stroke: config.colourLookup[pwPrefs.stroke],
        'stroke-width': pwPrefs.strokeWidth,
      });
  }
  // DRAW PIE WEDGES ends

  // ADD HEADER WIDTH TO ID
  // Called from appendPieHeaders. Timeout gives elements
  // time to draw before width is calculated and appended to ID
  addHeaderWidthToID(pieGrps) {
    pieGrps.each(function() {
      const thisGrp = d3.select(this);
      const thisHead = thisGrp.select('text');
      let hID = thisHead.attr('id');
      const hWidth = thisHead.node().getBBox().width;
      hID = `${hID}, width:${hWidth}`;
      thisHead.attr('id', hID);
    });
  }
  // ADD HEADER WIDTH TO ID ends

  // APPEND PIE HEADERS
  appendPieHeaders(pieGrps) {
    const globalThis = this;
    const config = this.props.config;
    const hPrefs = config.piePrefs.header;
    const isHalfPie = config.chartType.includes('half');
    pieGrps.each(function(ddd, iii) {
      const thisPieGrp = d3.select(this);
      // Binding is to wedges, so just use first:
      const hString = ddd[0].header;
      const pieHeadText = thisPieGrp
        .append('text')
        // 'y' is provisional and will change with text-wrapping
        .attr({
          x: 0,
          y: 0,
          leading: hPrefs.leading,
          class: `pie-header-${iii}`,
          id: () => {
            const id = `pie-header-${iii}`;
            const fill = hPrefs.fill;
            const leading = hPrefs.leading;
            const justification = hPrefs.anchor;
            const hID = ChartUtils.getTextID(id, fill, justification, leading);
            return hID;
          },
        })
        .style({
          'font-family': hPrefs.font,
          'font-size': `${hPrefs.size}px`,
          'text-anchor': hPrefs.anchor,
          fill: config.colourLookup[hPrefs.fill],
        })
        .text(hString);
      // Wrapping
      const wtConfig = {
        wWidth: config.bounds.width,
        forceTurn: config.forceTurn,
        index: iii,
        isHalfPie,
      };
      pieHeadText.call(
        TextWrapping.wrapAllTextElements,
        wtConfig,
        globalThis,
        globalThis.afterPieHeaderWrap,
      );
    });
    // Give text strings a moment to draw, then append width to id metadata
    // setTimeout(() => {
    //   this.addHeaderWidthToID(pieGrps);
    // }, 100);
  }
  // APPEND PIE HEADERS ends

  // MAKE WEDGE PROPS
  // Called from updatePies to set case-specific wedge properties,
  // specifically arc inner/outer radii
  makeWedgeProps(config) {
    // All 'panels' have same height and width, so just
    // use the first 'panel' definition
    const width = config.pieBoundsArray[0].width;
    const height = config.pieBoundsArray[0].height;
    // By default, for full pies, outer radius is lesser of width/height, minus margin
    let outerRad = Math.min(width, height) / 2;
    // But for half pies:
    // (this is a bit crude, btw)
    if (config.chartType.includes('half')) {
      outerRad = Math.min(width / 2, height);
    }
    // Radius props from DPs
    const wedges = config.piePrefs.wedges;
    outerRad -= wedges.outerMargin;
    const innerRad = outerRad * wedges.innerRadius;
    return {
      height,
      innerRad,
      outerRad,
      width,
    };
  }
  // MAKE WEDGE PROPS ends

  // UPDATE PIES
  // The data for each pie-group is an array of objects,
  // each representing a point:
  //    category: <Category string>
  //    fill: "#00919e"
  //    fillName: "green1"
  //    header: <Header string>
  //    seriesNo: 4
  //    stroke: "#00919e"
  //    strokeName: "green1"
  //    val: 5
  // We pass that to
  // d3.layout.pie to compute the angles for each arc.
  // These start and end angles are passed to d3.svg.arc
  // to draw arcs.
  // Both functions are constructed as props
  updatePies() {
    const config = this.props.config;
    // Append pie groups, each translated to pie centre
    // One 'row' of data is bound to each
    const pieGrps = this.bindPieGroups(config);
    // Wedges
    // Each pie group has a central origin; but now
    // I need height and width, and inner and outer
    // radii. Note that wedgeProps are the specific-case values,
    // while piePrefs (passim) are default definitions of pie prefs from DPs
    const wedgeProps = this.makeWedgeProps(config);
    this.drawPieWedges(pieGrps, wedgeProps);
    // Append central (series) header to each pie group
    this.appendPieHeaders(pieGrps);
  }

  // RENDER all-series parent group:
  render() {
    return <g className={this.props.config.className} id="series-group:pie" />;
  }
}

SilverPieSeries.propTypes = {
  config: PropTypes.object,
  // onPassWedgeClick: PropTypes.func,
};

export default SilverPieSeries;
