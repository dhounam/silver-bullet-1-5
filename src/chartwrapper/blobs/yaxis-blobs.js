// Linting disabled for D3
/* eslint-disable no-invalid-this,  func-names */
import * as d3 from 'd3';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Utilities module
import * as BlobUtils from './blob-utilities';

class SilverYaxisBlobs extends Component {
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
  // For yaxis (vertical) blobs, I'm so far interested only in
  // the width, which can be calculated without dropping anything
  // on to the wrapper from fontsize, padding and margin...
  doBlobTests() {
    const config = this.props.config;
    const bounds = config.bounds;
    // NOTE: but if no blobs, return IB unchanged
    if (config.blobs.blobState.column > 0) {
      const bMargin = this.getBlobMargin();
      // Adjust and return the IB
      bounds.width -= bMargin;
    }
    this.props.onReturnRevisedInnerBox(bounds);
  }
  // DO BLOB TESTS ends

  // GET BLOB MARGIN
  // Called from doBlobTests and updateBlobs, returns
  // the margin allowed for blobs (blob-widths + margin)
  getBlobMargin() {
    const config = this.props.config;
    const blobMeta = config.blobs.blobMeta;
    const blobState = config.blobs.blobState;
    let myWidth = 0;
    // Initialise margin which, for circles, defaults to cluster-height
    let myMargin = 0;
    if (config.chartType.includes('bar')) {
      myMargin = this.props.config.yMainScale.rangeBand();
    } else {
      // Thermometer
      myMargin = this.getBlobHeightFromChartHeight(config);
    }
    if (blobState.isRect) {
      // I want the longest string. That means plonking and
      // measuring...
      // Plonk 'em down and format, then measure width...
      // const className = `blobs-group-${ this.props.config.chartIndex }`;
      const className = config.groupName;
      const blobGroup = d3.select(`.${className}`);
      // Text object
      const testText = blobGroup
        .append('text')
        .attr('id', 'testText')
        .style({
          'font-family': config.blobs.blobMeta.text.font,
          'font-size': `${config.blobs.blobMeta.text.size}px`,
        });
      for (let iii = 0; iii < blobState.valsArray.length; iii++) {
        const thisVal = blobState.valsArray[iii];
        testText.text(thisVal);
        // NOTE::::::
        // getComputedTextLength seems to return a different width
        // from the eventually-displayed width of blob vals...
        const width = testText.node().getComputedTextLength();
        myWidth = Math.max(myWidth, width);
      }
      // So myMargin should be width of longest string...
      // Add padding, L+R
      myWidth += blobMeta.background.padding.horizontal * 2;
      // Set it on blobState, which should update by ref
      blobState.blobWidth = myWidth;
      myMargin = myWidth;
      // Clear the text object...
      testText.remove();
    }
    // Add margin to left of blobs, and return
    myMargin += blobMeta.margin.left;
    return myMargin;
  }
  // GET BLOB MARGIN ends

  // GET BLOB HEIGHT FROM CHART HEIGHT
  // Called variously. Returns a blob height based on
  // total chart height
  getBlobHeightFromChartHeight(config) {
    const height = config.bounds.height;
    // Subtract all the inter-blob gaps I'll want from the total height
    // NOTE: arbitrary 5pt gap. Set in DPs?
    // const gaps = (config.pointCount - 1) * 5;
    // const gaplessHeight = height - gaps;
    const gaplessHeight = height;
    return gaplessHeight / config.pointCount;
  }
  // GET BLOB HEIGHT FROM CHART HEIGHT ends

  // GET BLOB HEIGHT
  // Called from updateBlobs to calculate height of blobs
  getBlobHeight(config) {
    let blobHeight = 0;
    if (config.chartType.includes('bar')) {
      // Bars have a rangeband
      blobHeight = config.yMainScale.rangeBand();
      blobHeight -= config.padding;
    } else {
      // Thermos do it the hard way
      blobHeight = this.getBlobHeightFromChartHeight(config);
    }
    // Don't be < 0!
    blobHeight = Math.max(blobHeight, 0);
    return blobHeight;
  }
  // GET BLOB HEIGHT ends

  // UPDATE BLOBS
  updateBlobs() {
    const config = this.props.config;
    if (config.blobs.blobState.columns === 0) {
      return;
    }
    const isRect = config.blobs.blobState.isRect;
    // Context (series parent group created in render)
    const className = `blob-series-group-${config.chartIndex}`;
    const contextGroup = d3.select(`.${className}`);
    // Transpose group to RHS
    // NOTE:::::::::::::::::::
    // Here's the problem: I'm transforming relative to right of
    // innerbox, which is set to final xscale tick -- not string!
    const transBy =
      config.bounds.width +
      config.blobs.blobMeta.margin.left +
      config.bounds.labelProjection;
    contextGroup.attr('transform', `translate(${transBy},0)`);
    const yMainScale = config.yMainScale;
    // Blob width is margin allowed at right:
    // NOTE: why am I recalculating? Wasn't once enough?
    // const blobWidth = this.getBlobMargin() - config.blobs.blobMeta.margin.left;
    const blobWidth = config.blobs.blobState.blobWidth;
    // Height
    const blobHeight = this.getBlobHeight(config);
    const duration = config.duration;
    // Data
    // Text h-position
    // NOTE: check all this... NOTE:
    const leftPos = 0;
    let textXpos = leftPos + blobHeight / 2;
    if (isRect) {
      textXpos = leftPos + blobWidth / 2;
    }
    // Text v-position
    // I need a 'tweak' to blob-centre, then allow for fontsize...
    let textVtweak = blobHeight / 2;
    textVtweak +=
      (config.blobs.blobMeta.text.size * config.blobs.blobMeta.text.emVal) / 2;
    // As far as I can see, the data is in the right format:
    // an array of objects with header:value properties
    // NOTE: NEED TO DO FORMATTING
    // Data is a simple array of objects with 2 props:
    // category & val
    const mappedData = [];
    for (let iii = 0; iii < config.yMainScale.domain().length; iii++) {
      const tempO = {
        category: config.yMainScale.domain()[iii],
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
    const rangeMax = Math.max(rangeMin, blobHeight);
    // Domain
    // const domainMin = config.blobmeta.blobMinMaxVals.min;
    const domainMin = 0;
    const domainMax = config.blobs.blobState.max;
    const blobDomain = [domainMin, domainMax];
    const blobCircleScale = d3.scale
      .sqrt()
      .range([rangeMin, rangeMax])
      .domain(blobDomain);

    const isThermo = config.chartType.includes('thermo');
    // Exit
    // groupBinding.exit()
    //   .selectAll('.d3-blob-shape')
    //   .transition().duration(duration)
    //   .attr('width', 0)
    //   ;
    // // Exit
    // groupBinding.exit()
    //   .transition().delay(duration)
    //   .remove()
    //   ;

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
        x: leftPos,
        y: ddd => {
          let yVal = yMainScale(ddd.category);
          if (isThermo) {
            yVal -= blobHeight / 2;
          }
          return yVal;
        },
        height: 0,
        width: 0,
        fill: '#fff',
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
      });
    } else {
      oneBlobGroupEnter.append('circle').attr({
        class: 'd3-blob-shape',
        cy: ddd => {
          let yPos = yMainScale(ddd.category);
          if (!isThermo) {
            yPos += blobHeight / 2;
          }
          return yPos;
        },
        cx: leftPos + blobHeight / 2,
        r: 0,
        fill: '#fff',
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
      });
    }

    let rememberedID = '';
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
          bId = `${bId} fill:${config.blobs.blobMeta.text.fill},`;
          // For width:
          rememberedID = bId;
          return bId;
        },
      });

    // UPDATE
    if (isRect) {
      blobGroupBinding
        .select('rect')
        .transition()
        .duration(duration)
        .attr({
          // y: ddd => {
          //   let yPos = 0;
          //   yPos = yMainScale(ddd.category) - (blobHeight / 2);
          //   return yPos;
          // },
          // x: leftPos,
          height: blobHeight,
          width: blobWidth,
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
        .duration(duration)
        .attr({
          r: ddd => {
            const rad = blobCircleScale(ddd.val) / 2;
            // Negative vals: zero radius
            return Math.max(rad, 0);
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
      .duration(duration)
      .attr({
        x: textXpos,
        y: ddd => {
          // Vertical pos relative to top-of-blob
          let yPos = yMainScale(ddd.category) + textVtweak;
          if (isThermo) {
            yPos -= blobHeight / 2;
          }
          return yPos;
        },
      })
      .each(function(ddd) {
        ddd.width = this.getBBox().width;
      });

    // Text id-metadata needs width, too... after a timeout
    setTimeout(() => {
      this.setTextWidthAttribute(blobGroupBinding, rememberedID);
    }, duration * 2);

    // NOTE: EXIT isn't right yet...
    blobGroupBinding
      .exit()
      .transition()
      .duration(duration)
      .attr('height', 0);
    blobGroupBinding
      .exit()
      .transition()
      .delay(duration * 2)
      .remove();
  }
  // UPDATE BLOBS ends

  // SET TEXT WIDTH ATTRIBUTE
  // Called by updateLegend after a timeout to allow transition to finish
  // Args are the binding and a string containing 'remembered' element ID,
  // complete with metadata attributes to which I can now append width...
  setTextWidthAttribute(binding, tID) {
    binding.selectAll('text').attr('id', ddd => {
      const myID = `${tID} width:${ddd.width}`;
      return myID;
    });
  }
  // SET TEXT WIDTH ATTRIBUTE ends

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

SilverYaxisBlobs.propTypes = {
  // Incoming config
  config: PropTypes.object,
  // Callback after tests
  onReturnRevisedInnerBox: PropTypes.func,
};

export default SilverYaxisBlobs;
