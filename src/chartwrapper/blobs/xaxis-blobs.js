// Linting disabled for D3
/* eslint-disable no-invalid-this, func-names, max-statements */

import * as d3 from 'd3';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Utilities module
import * as BlobUtils from './blob-utilities';

class SilverXaxisBlobs extends Component {
  // COMPONENT DID MOUNT
  componentDidMount() {
    if (this.props.config.testFlag) {
      // margin tests, at the end of which we return updated innerbox bounds...
      this.doBlobTests();
    } else {
      this.updateBlobs();
      BlobUtils.updateBlobHeader(this.props.config);
    }
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    if (this.props.config.testFlag) {
      // margin tests, at the end of which we return updated innerbox bounds...
      this.doBlobTests();
    } else {
      this.updateBlobs();
      BlobUtils.updateBlobHeader(this.props.config);
    }
  }

  // DO BLOB TESTS
  // For xaxis (horizontal) blobs, I need to get a height, which can
  // be calculated without dropping anything on to the wrapper from
  // fontsize, padding and margin...
  // ...and I need a blobWidth, based upon
  doBlobTests() {
    const config = this.props.config;
    const bounds = config.bounds;
    // By default (see c.10 lines down)
    bounds.blobWidth = 0;
    // NOTE: but if no blobs, return IB unchanged
    if (config.blobs.blobState.column > 0) {
      // Line charts need a horizontal adjustment, which is messy...
      if (
        config.chartType.includes('line') ||
        config.chartType.includes('thermo')
      ) {
        const hBlobVals = this.hBlobTweaks(config);
        // hBlobVals is an object with bounds and blobWidth properties
        // which are appended to the bounds object:
        bounds.x = hBlobVals.x;
        bounds.width = hBlobVals.width;
        // Just pack blobWidth in, too...
        bounds.blobWidth = hBlobVals.blobWidth;
        // Max size:
        bounds.blobWidth = Math.min(
          bounds.blobWidth,
          config.blobs.blobMeta.maxCircleSize,
        );
      }
      // The vertical adjustment is relatively simple...
      // NOTE: Line charts with circular blobs need the
      // blobWidth to calculate the vertical margin
      let vMargin = this.getVblobMargin(bounds.blobWidth);
      // Adjust and return the IB
      bounds.y += vMargin;
      bounds.height -= vMargin;
    }
    // And I need to check for a projecting index-blob
    const iTweak = this.getIndexBlobTweak(config);
    bounds.x += iTweak;
    bounds.width -= iTweak;
    this.props.onReturnRevisedInnerBox(bounds);
  }
  // DO BLOB TESTS ends

  // GET INDEX BLOB TWEAK
  // Called from doBlobTests. Returns adjustment for left margin
  // if there's an index blob...
  getIndexBlobTweak(config) {
    const iProps = config.indexed;
    let iTweak = 0;
    if (iProps.indexFlag && iProps.indexPoint === 1) {
      // How far has IB moved in from original left edge?
      const margin = config.bounds.x - config.originalBounds.x;
      const iRadius = config.indexed.radius;
      if (margin < iRadius) {
        iTweak = iRadius - margin;
      }
    }
    return iTweak;
  }
  // GET INDEX BLOB TWEAK ends

  hBlobTweaks(config) {
    // So config contains several bounds objects
    // Let's check them!
    // originalBounds (original innerBox, excluding either axis)
    // postYaxisBounds (chart area after y-axes have reduced width)
    // bounds (current bounds -- adjusted for x-axis, as well as y-axes)
    //
    // Clone current bounds; this is what we'll return, amended or not...
    const myBounds = config.bounds;
    const postYBounds = config.postYaxisBounds;
    // First, get 3 values...
    // Bugfix Mar'18: use post-yaxis bounds, not original chart bounds:
    // const blobWidth = this.getBlobWidth(config, config.originalBounds.width);
    // const blobWidth = this.getBlobWidth(config, myBounds.width);
    const blobWidth = this.getBlobWidth(config, postYBounds.width);
    const halfBlobWidth = blobWidth / 2;
    // existing projections of left and right x-axis cat strings (!)
    const leftCatProjection = config.bounds.x - postYBounds.x;
    const postYRight = postYBounds.x + postYBounds.width;
    const currentRight = config.bounds.x + config.bounds.width;
    const rightCatProjection = postYRight - currentRight;
    //
    if (halfBlobWidth > Math.max(leftCatProjection, rightCatProjection)) {
      // Half-blobWidth > both string projections, so set final bounds to
      // use half-blobWidth
      myBounds.x = postYBounds.x + halfBlobWidth;
      myBounds.width = postYBounds.width - blobWidth;
    } else if (
      halfBlobWidth < Math.min(leftCatProjection, rightCatProjection)
    ) {
      // Half-blobWidth < both category projections, so use current bounds, which
      // x-axis test set to category projections.
      // So actually, nothing changes! NOTE: really??
    } else {
      // Here's the beast! One category projection exceeds half-blobWidth!!
    }
    // What do I want to return?
    // Chart x and width; and a blobWidth value...
    return {
      x: myBounds.x,
      width: myBounds.width,
      blobWidth,
    };
  }

  // GET BLOB WIDTH
  // Passed any bounds.width, this should return the width of each blob
  // to fit into it, allowing for gaps between blobs
  // Calculate blob width to fit into given width
  getBlobWidth(config, width) {
    // First, subtract all the inter-blob gaps I'll want from the total width
    const gaplessWidth = width - (config.pointCount - 1) * config.gap;
    // Width of one half-blob
    const minBlobWidth = config.blobs.blobMeta.minRectWidth;
    const maxBlobWidth = config.blobs.blobMeta.maxRectWidth;
    let blobWidth = Math.max(gaplessWidth / config.pointCount, minBlobWidth);
    blobWidth = Math.min(blobWidth, maxBlobWidth);
    return blobWidth;
  }
  // GET BLOB WIDTH ends

  // GET BLOB MARGIN
  // Called from doBlobTests and updateBlobs, returns
  // the vertical distance allowed for blobs (including margin below)
  getVblobMargin(blobWidth) {
    const blobs = this.props.config.blobs;
    const circleMax = blobs.blobMeta.maxCircleSize;
    let bMargin = 0;
    if (blobs.blobState.isRect) {
      // Use font and internal padding:
      const textHeight = blobs.blobMeta.text.size * blobs.blobMeta.text.emVal;
      bMargin += textHeight;
      bMargin += blobs.blobMeta.background.padding.vertical * 2;
    } else if (
      this.props.config.chartType.includes('line') ||
      this.props.config.chartType.includes('thermo')
    ) {
      // Circles: line and thermo charts use passed-in blobWidth or set max
      bMargin += Math.min(blobWidth, circleMax);
    } else {
      // Circles: columns use rangeBand, or set max
      const rBand = this.props.config.xMainScale.rangeBand();
      bMargin += Math.min(rBand, circleMax);
    }
    // Add margin below and return
    bMargin += blobs.blobMeta.belowBlobs;
    return bMargin;
  }

  // UPDATE BLOBS
  updateBlobs() {
    const config = this.props.config;
    if (config.blobs.blobState.column === 0) {
      return;
    }
    // Chart type flag. Mainly determines whether blobs
    // expect rangePoints (line/thermo) or rangeBands (column)
    const rpFlag =
      config.chartType.includes('line') || config.chartType.includes('thermo');
    const isRect = config.blobs.blobState.isRect;
    // Context (series parent group created in render)
    const className = `blob-series-group-${config.chartIndex}`;
    const contextGroup = d3.select(`.${className}`);
    // Passed scales:
    const xMainScale = config.xMainScale;
    // const xClusterScale = config.xClusterScale;
    // NOTE: although nothing actually stacks, accum is
    // a flag that we aren't 'clustering'
    // const accum = config.accum;
    // Blob width defaults to that set for lines by doBlobTests
    let blobWidth = config.bounds.blobWidth;
    // if (!lineFlag) {
    if (!rpFlag) {
      //   // Column charts use rangeBands
      //   blobWidth = xClusterScale.rangeBand();
      //   if (accum) {
      //     // Explicitly subtract gap from col width
      //     // (non-accum: handled in columnchart when rangeBand set)
      blobWidth = xMainScale.rangeBand() - config.padding;
      //   }
    }
    // NOTE: there's some duplication back there, on circles, certainly...
    // Don't be < 0!
    blobWidth = Math.max(blobWidth, 0);
    // Vertical position
    const transBy = this.getVblobMargin(blobWidth);
    // Height
    // NOTE: all provisional -- in particular, what about circles???
    const blobHeight = transBy - config.blobs.blobMeta.belowBlobs;
    contextGroup.attr('transform', `translate(0,-${transBy})`);
    // Text vert pos:
    let textYpos = blobWidth / 2;
    textYpos +=
      (config.blobs.blobMeta.text.size * config.blobs.blobMeta.text.emVal) / 2;
    if (isRect) {
      textYpos = blobHeight - config.blobs.blobMeta.background.padding.vertical;
    }
    // Data is a simple array of objects with 2 props:
    // category & val
    const mappedData = [];
    for (let iii = 0; iii < config.xMainScale.domain().length; iii++) {
      const tempO = {
        category: config.xMainScale.domain()[iii],
        val: config.blobs.blobState.valsArray[iii],
      };
      // Omitting blanks, append to array
      if (tempO.val.length > 0) {
        mappedData.push(tempO);
      }
    }

    // Scale for proportional circles
    // Range
    // const rangeMin = config.blobmeta.minCircleSize;
    // NOTE: I can't use minCircleSize literally: scale must
    // be from zero, surely. But if r < minCircleSize I should
    // move the value string up... or something.
    const rangeMin = 0;
    // Range max mustn't be less than clusterwidth!
    const rangeMax = Math.max(rangeMin, blobWidth);
    // Domain
    // const domainMin = config.blobmeta.min;
    const domainMin = 0;
    // NOTE: prev'y looked for config.blobs.max, which
    // is undefined. I need to trackk down these rogue
    // blobs.min and .max properties: whoever's appending them...
    // stop it!
    const domainMax = config.blobs.blobState.max;
    const blobDomain = [domainMin, domainMax];
    const blobCircleScale = d3.scale
      .sqrt()
      .range([rangeMin, rangeMax])
      .domain(blobDomain);

    const blobGroupBinding = contextGroup
      .selectAll('.blob-series-group')
      .data(mappedData);
    // ENTER appends group for one rect/text blob
    const oneBlobGroupEnter = blobGroupBinding
      .enter()
      .append('g')
      .attr({
        class: 'blob-pair-group',
        id: 'blob-pair-group',
      });
    // Append rect/circle and text
    if (isRect) {
      oneBlobGroupEnter.append('rect').attr({
        class: 'blob-shape',
        x: ddd => xMainScale(ddd.category) - blobWidth / 2,
        y: 0,
        height: 0,
        width: 0,
        fill: '#fff',
        'stroke-width': 0,
      });
    } else {
      oneBlobGroupEnter.append('circle').attr({
        class: 'blob-shape',
        cx: ddd => {
          let cxVal = xMainScale(ddd.category);
          // if (!lineFlag) {
          if (!rpFlag) {
            cxVal += blobWidth / 2;
          }
          return cxVal;
        },
        cy: blobWidth / 2,
        r: 0,
        fill: '#fff',
        'stroke-width': 0,
      });
    }
    oneBlobGroupEnter
      .append('text')
      .style({
        'font-family': config.blobs.blobMeta.text.font,
        'font-size': `${config.blobs.blobMeta.text.size}px`,
        'text-anchor': config.blobs.blobMeta.text.anchor,
        fill: () => {
          const fillName = config.blobs.blobMeta.text.fill;
          return config.colourLookup[fillName];
        },
      })
      .attr({
        id: () => {
          // Text needs just'n and fill (width, see below)
          let bId = 'blob-text~~~justification:center,';
          bId = `${bId} fill:${config.blobs.blobMeta.text.fill}`;
          return bId;
        },
      });

    // UPDATE
    if (isRect) {
      blobGroupBinding
        .select('rect')
        .transition()
        .duration(config.duration)
        .attr({
          x: ddd => {
            let xPos = 0;
            // if (lineFlag) {
            if (rpFlag) {
              xPos = xMainScale(ddd.category) - blobWidth / 2;
            } else {
              // Cols (un/stacked)
              xPos = xMainScale(ddd.category);
            }
            return xPos;
          },
          y: 0,
          height: blobHeight,
          width: blobWidth,
          id: () => {
            let bID = 'blob-shape~~~';
            const bFill = config.blobs.blobMeta.background.fill;
            bID = `${bID}fill: ${bFill},`;
            const bStr = config.blobs.blobMeta.background.stroke;
            bID = `${bID}stroke: ${bStr},`;
            const bWid = config.blobs.blobMeta.background.strokewidth;
            bID = `${bID}strokewidth: ${bWid}`;
            return bID;
          },
        })
        .style({
          fill: () => {
            const fName = config.blobs.blobMeta.background.fill;
            return config.colourLookup[fName];
          },
          stroke: () => {
            const sName = config.blobs.blobMeta.background.stroke;
            let stroke = 'none';
            if (sName !== 'none') {
              stroke = config.colourLookup[sName];
            }
            return stroke;
          },
          'stroke-width': config.blobs.blobMeta.background.strokewidth,
          opacity: config.blobs.blobMeta.background.opacity,
        });
    } else {
      blobGroupBinding
        .select('circle')
        .transition()
        .duration(config.duration)
        .attr({
          r: ddd => {
            const rad = blobCircleScale(ddd.val) / 2;
            // Negative vals: zero radius
            return Math.max(rad, 0);
          },
          cy: () => {
            // NOTE: Matt suggests circular blobs centre-aligned:
            const centre = blobWidth / 2;
            // But for bottom-aligned blobs, do:
            // let centre = vPos + blobWidth;
            // centre -= (blobCircleScale(ddd.val) / 2);
            return centre;
          },
          id: () => {
            let bID = 'blob-shape~~~';
            const bFill = config.blobs.blobMeta.background.fill;
            bID = `${bID}fill: ${bFill},`;
            const bStr = config.blobs.blobMeta.background.stroke;
            bID = `${bID}stroke: ${bStr},`;
            const bWid = config.blobs.blobMeta.background.strokewidth;
            bID = `${bID}strokewidth: ${bWid}`;
            return bID;
          },
        })
        .style({
          fill: () => {
            const fName = config.blobs.blobMeta.background.fill;
            return config.colourLookup[fName];
          },
          stroke: () => {
            const sName = config.blobs.blobMeta.background.stroke;
            let stroke = 'none';
            if (sName !== 'none') {
              stroke = config.colourLookup[sName];
            }
            return stroke;
          },
          'stroke-width': config.blobs.blobMeta.background.strokewidth,
          opacity: config.blobs.blobMeta.background.opacity,
        });
    }

    blobGroupBinding
      .select('text')
      .text(ddd => {
        const format = BlobUtils.formatBlobVal(ddd.val);
        const myFormatter = d3.format(format);
        return myFormatter(ddd.val);
      })
      .transition()
      .duration(config.duration)
      .attr({
        y: () => {
          let yResult = textYpos;
          if (!isRect) {
            yResult = blobWidth / 2;
            // If blob-circles are bottom-aligned, see 'cy' for circles, above...
            // yResult -= (blobCircleScale(ddd.val) / 2);
            yResult +=
              (config.blobs.blobMeta.text.size *
                config.blobs.blobMeta.text.emVal) /
              2;
          }
          return yResult;
        },
        x: ddd => {
          // Line centre-aligns
          let xPos = xMainScale(ddd.category);
          // Column
          // if (!lineFlag) {
          if (!rpFlag) {
            // Stacked columns:
            xPos += blobWidth / 2;
          }
          return xPos;
        },
      })
      .each(function(ddd) {
        ddd.width = this.getBBox().width;
      });

    // NOTE: EXIT isn't right yet...
    blobGroupBinding
      .exit()
      .transition()
      .duration(config.duration)
      .attr('height', 0);
    blobGroupBinding
      .exit()
      .transition()
      .delay(config.duration * 2)
      .remove();
  }
  // UPDATE BLOBS ends

  // WRAP BLOB HEAD
  // Called from componentDidMount/Update
  // Stub for potentially wrapping blob heads. This
  // would call TextWrapping, with a callback that could
  // adjust the size of the rect to the dimensions of the text...
  // wrapBlobHead(blobHeadGroup) {
  //   const headRect = blobHeadGroup.select('rect');
  //   const headText = blobHeadGroup.select('text');
  // }
  // WRAP BLOB HEAD ends

  // RENDER blob group
  render() {
    // Setting no fill prevents the SVG convertor from generating a path
    // outlining the group
    const gStyle = { fill: 'none' };
    const nameA = `blob-series-group-${this.props.config.chartIndex}`;
    const nameB = `blob-header-group-${this.props.config.chartIndex}`;
    return (
      <g
        className={this.props.config.groupName}
        id={this.props.config.groupName}
        style={gStyle}
      >
        <g className={nameA} id={nameA} />
        <g className={nameB} id={nameB} />
      </g>
    );
  }
}

SilverXaxisBlobs.propTypes = {
  // Incoming config
  config: PropTypes.object,
  // Callback after tests
  onReturnRevisedInnerBox: PropTypes.func,
};

export default SilverXaxisBlobs;
