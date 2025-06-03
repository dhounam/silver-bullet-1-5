// Disable prefer-reflect, for D3 axis.call()
/* eslint-disable prefer-reflect,  no-invalid-this,  func-names */

import * as d3 from 'd3';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as TextWrapping from '../../chartside-utilities/text-wrapping';
import * as ChartUtils from '../../chart-utilities';

class SilverYaxisOrdinal extends Component {
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
    };
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    const yAxis = this.setYaxisConfig();
    this.updateYaxis(yAxis);
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    const yAxis = this.setYaxisConfig();
    this.updateYaxis(yAxis);
  }

  // SET Y-AXIS CONFIG
  setYaxisConfig() {
    const yAxis = this.props.axis;
    const config = this.props.config;
    const tPrefs = config.tickPrefs;
    // Scale function:
    const yScale = config.scale;
    const tickDensity = 10;
    // Padding between labels and tick-ends:
    const tickPadding = tPrefs.tickPadding;
    // Axis left or right:
    const orient = config.orient;
    // Tick length
    const tlPrefs = tPrefs.lengths;
    // NOTE: this is inferential to bar charts and
    // no doubt needs reworking. I have a start and end,
    // why not use them?
    let tickLength = tlPrefs.default.end - tlPrefs.default.start;
    if (config.tickPrefs.across) {
      tickLength = -config.bounds.width;
    } else if (orient === 'right') {
      // If axis at right, tickLength is neg value:
      tickLength = -tickLength;
    }
    yAxis
      .scale(yScale)
      .orient(orient)
      // Gap between labels and ticks
      .tickPadding(tickPadding)
      // Number of ticks
      .ticks(tickDensity)
      // Tick length
      .tickSize(tickLength);
    return yAxis;
  }
  // SET Y-AXIS CONFIG ends

  // GET AXIS GROUP TRANSFORM STRING
  // Called from updateYAxis. Returns string that determines
  // whether axis is drawn left/right
  getAxisGroupTransformString() {
    let transform = 0;
    if (this.props.config.orient === 'right') {
      transform = this.props.config.bounds.width;
    }
    return `translate( ${transform}, 0 )`;
  }
  // GET AXIS GROUP TRANSFORM STRING ends

  // UPDATE Y-AXIS
  updateYaxis(yAxis) {
    const globalThis = this;
    const config = this.props.config;
    const chartIndex = config.chartIndex;
    // Context: ticks group
    let grpId = `${this.props.grpNames.ticksId}${chartIndex}`;
    // Left or right?
    grpId = `${grpId}-${config.orient}`;
    const axisGroup = d3.select(`#${grpId}`);
    const transform = this.getAxisGroupTransformString();
    const anchor = config.textPrefs.anchor[config.chartType];
    const leading = config.textPrefs.leading;
    // Override D3 style and draw labels
    // left-aligned on left-oriented axis
    let labX = config.tickPrefs.padding;
    const orient = config.orient;
    if (orient === 'left' && anchor === 'start') {
      labX = 0 - config.bounds.x + config.originalX;
    }
    const fFam = config.textPrefs.font;
    const fFill = config.textPrefs.fillValue;
    const fSize = config.textPrefs.size;
    // Align TOP of text to bar/thermo centre
    const labY = config.emVal * fSize;
    const boundAxis = axisGroup.attr('transform', transform).call(yAxis);
    const axisText = boundAxis.selectAll('text');
    const axisTicks = boundAxis.selectAll('line');
    axisText
      .attr({
        y: labY,
        x: labX,
        dy: 0,
        id: (ddd, iii) => {
          // NOTE: I should all element base ids from... somewhere
          const id = `yaxis-label-${iii}`;
          const fill = config.textPrefs.fill;
          const justification = anchor;
          const tID = ChartUtils.getTextID(id, fill, justification, leading);
          return tID;
        },
        leading,
      })
      .style({
        'font-family': fFam,
        'font-size': `${fSize}px`,
        fill: fFill,
        'text-anchor': anchor,
      });

    // NOTE: ticks not styled since not visible. but
    // I can't necessarily rely on that...

    // Remove domain path
    axisGroup.selectAll('path').remove();

    // NOTE: this seems likely to duplicate yaxis-linear
    // to a spooky degree...

    // Tick IDs with metadata
    axisTicks
      // NOTE: again, 'function' for D3...
      // Linting errors disable at top
      .each(function(ddd, iii) {
        const thisTick = d3.select(this);
        thisTick
          .attr({
            id: () => {
              let tickID = `yaxis-tick-${iii}`;
              // And stroke name:
              const strokeName = config.tickPrefs.stroke;
              tickID = `${tickID}~~~stroke:${strokeName}`;
              return tickID;
            },
            x1: () => {
              let xPos = 0;
              // Inferentially for brokenscale h-thermos
              if (config.chartType.includes('thermoh') && config.breakScale) {
                xPos -= config.brokenScalePadding;
              }
              return xPos;
            },
          })
          .style({
            'stroke-width': config.tickPrefs.width,
            stroke: config.tickPrefs.strokeValue,
          });
      });

    // Object to pass to wrapText
    const wtConfig = {
      wWidth: config.bounds.catMargin,
      forceTurn: config.forceTurn,
    };
    // Live call
    axisText.call(
      TextWrapping.wrapAllTextElements,
      wtConfig,
      globalThis,
      globalThis.afterYaxisOrdinalStringWrap,
    );
  }
  // UPDATE Y-AXIS ends

  // FIX EMPTY TSPANS
  // Called from afterYaxisOrdinalStringWrap.
  // NOTE: this is a KLUDGE to get round the
  // problem whereby ordinal y-axis categories
  // can break the margin, creating an empty
  // tspan
  fixEmptyTspans(text) {
    const spanCount = text[0][0].childElementCount;
    // If there's more than one tspan...
    if (spanCount > 1) {
      const span0 = text[0][0].children[0];
      const span1 = text[0][0].children[1];
      const textY = text[0][0].getAttribute('y');
      // ...if the first tspan is empty, FIX it
      // and set consequent first tspan to the
      // text-element's vertical position
      if (span0.innerHTML.length === 0) {
        span1.setAttribute('y', textY);
        span0.remove();
      }
    }
  }
  // KILL EMPTY TSPANS ends

  // GET LABEL LINE COUNT
  // Counts tSpans in a text element that represent a new
  // line (i.e. ignores italics on/off)
  getLabelLineCount(label) {
    let lineCount = 0;
    const parent = label[0][0];
    const pLen = parent.childElementCount;
    for (let cNo = 0; cNo < pLen; cNo++) {
      if (parent.children[cNo].getAttribute('y') !== null) {
        lineCount++;
      }
    }
    return lineCount - 1;
  }
  // GET LABEL LINE COUNT ends

  // GET LABEL MOVE
  // Called from afterYaxisOrdinalStringWrap. Since getBBox
  // is returning an unreliable height, calculate how far
  // labels move from fontsize, leading and linecount
  getLabelMove(lab, emVal) {
    const fontSize = parseFloat(lab.style('font-size'));
    const leading = +lab.attr('leading');
    const lineCount = this.getLabelLineCount(lab);
    // Current position is that top of first line of text
    // is aligned to centre point of bar/thermo
    // Allow for actual text height of first line
    let labMove = fontSize * emVal;
    // Leading of additional lines
    labMove += lineCount * leading;
    // Return half, as neg value (to move text up)
    return -labMove / 2;
  }
  // GET LABEL MOVE ends

  // AFTER Y-AXIS ORDINAL STRING WRAP
  afterYaxisOrdinalStringWrap(originalThis) {
    const config = originalThis.props.config;
    // Start with the main axis group
    const chartIndex = originalThis.props.config.chartIndex;
    let axisGrpName = `#yaxis-ticks-group-${chartIndex}`;
    axisGrpName = `${axisGrpName}-${config.orient}`;
    const parentAxisGrp = d3.select(axisGrpName);
    parentAxisGrp.selectAll('text').each(function() {
      const thisLabel = d3.select(this);
      originalThis.fixEmptyTspans(thisLabel);
      // Text is top-aligned to bar-centre/hthermo-spindle
      // So just move up by half height
      const labMove = originalThis.getLabelMove(thisLabel, config.emVal);
      TextWrapping.moveTextAndTspans(thisLabel, labMove);
    });
  }
  // AFTER Y-AXIS ORDINAL STRING WRAP ends

  // SET AXIS WIDTH ATTRIBUTE
  // Called from updateSecondaryXaxis after a timeout, so that
  // there's time to render 2ry axis labels before we get a width,
  // which is appended to ID metadata...
  // NOTE: this is another probable duplicate of a function in xaxis-ordinal
  setAxisWidthAttribute(axisGroup) {
    axisGroup.selectAll('text').each(function() {
      const thisLabel = d3.select(this);
      const width = thisLabel.node().getBBox().width;
      if (width > 0) {
        let labID = thisLabel.attr('id');
        labID = `${labID},width:${width}`;
        thisLabel.attr('id', labID);
      }
    });
  }
  // SET AXIS WIDTH ATTRIBUTE ends

  // RENDER axis group only
  render() {
    const config = this.props.config;
    const grpNames = this.props.grpNames;
    const cIndex = config.chartIndex;
    const gClass = grpNames.outerClass;
    const grpId = `${grpNames.outerId}${cIndex}-${config.orient}`;
    const tickId = `${grpNames.ticksId}${cIndex}-${config.orient}`;
    const labId = `${grpNames.labelsId}${cIndex}-${config.orient}`;
    // Setting no fill prevents the SVG convertor from generating a path
    // outlining the group
    const gStyle = { fill: 'none' };
    return (
      <g className={gClass} id={grpId} style={gStyle}>
        <g id={tickId} style={gStyle} />
        <g id={labId} style={gStyle} />
      </g>
    );
  }
}

SilverYaxisOrdinal.propTypes = {
  config: PropTypes.object,
  // Not passed in; declared here as default prop
  axis: PropTypes.func,
  grpNames: PropTypes.object,
};

export default SilverYaxisOrdinal;
