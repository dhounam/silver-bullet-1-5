// For D3:
/* eslint-disable prefer-reflect, func-names, no-invalid-this,
  consistent-this */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
// import * as _ from 'lodash'

// Utilities modules
import * as ChartUtils from '../chart-utilities';
import * as TextWrapping from '../chartside-utilities/text-wrapping';
// Chart number box
import * as NumberBox from './numberbox';

// copied from lodash src (lodash causing build issues with Rollup)
function isNil(value) {
  return value == null;
}

class SilverBackground extends Component {
  // DEFAULT PROPS
  // This component maintains class names for the elements that it appends
  static get defaultProps() {
    return {
      stringClasses: {
        title: { class: 'silver-d3-title-string' },
        subtitle: { class: 'silver-d3-subtitle-string' },
        subsubtitle: { class: 'silver-d3-subsubtitle-string' },
        source: { class: 'silver-d3-source-string' },
        footnote: { class: 'silver-d3-footnote-string' },
      },
    };
  }

  // CONSTRUCTOR
  constructor(props) {
    super(props);
    // I think I have to track the IB as a global...
    // NOTE: but check...
    this.innerBoxBounds = [];
  }

  componentDidMount() {
    if (this.props.drawBackground) {
      this.updateBackground();
      this.updateBackgroundStrings();
      this.callNumberBox();
    }
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.drawBackground;
  }

  componentDidUpdate() {
    if (this.props.drawBackground) {
      this.updateBackground();
      this.updateBackgroundStrings();
      this.callNumberBox();
    }
  }

  // INSERT FOOTNOTE SPACES
  // Passed a line of text, inserts nbsp chars before
  // footnote symbols -- but not if it's a line turn
  insertFootnoteSpaces(line) {
    // NOTE: hard coding here -- better in DPs?
    const nbsp = String.fromCharCode(160);
    const sepCount = 3;
    // NOTE: this doesn't make sense...
    // There'll be 4 spaces, but only insert 3 because italiciseTspan
    // joins again with a space!
    const nbSpaces = nbsp.repeat(sepCount);
    // Allowed footnote symbols, preceded by breakable space
    // I can work with just single symbols
    const fSymbols = ['*', '†', '‡', '§', '**', '††', '‡‡', '§§'];
    for (let sNo = 0; sNo < fSymbols.length; sNo++) {
      const sym = fSymbols[sNo];
      const symPos = line.indexOf(sym);
      // Check for preceding line return
      // (Checking 4 and 5 back to cover space char that may not exist)
      const newLine =
        line.substring(symPos - 4, symPos) === '<br>' ||
        line.substring(symPos - 5, symPos - 1) === '<br>';
      // Nothing before first symbol, or after return
      if (symPos > 0) {
        if (newLine) {
          // Delete possible preceding space
          if (line[symPos - 1] === ' ' || line[symPos - 1] === nbsp) {
            line = `${line.slice(0, symPos - 1)}${line.slice(symPos)}`;
          }
        } else {
          const thisSep = nbSpaces + sym;
          line = line.replace(sym, thisSep);
        }
      }
    }
    return line;
  }
  // INSERT FOOTNOTE SPACES ends

  // RESTATE STRINGS
  // Appends classes (from internal prop) to strings.
  // Then returns strings object as D3-friendly array.
  restateStrings(strings) {
    // Append class names to string definitions
    const strList = Object.keys(strings);
    const stringClasses = this.props.stringClasses;
    for (const str in strList) {
      const sName = strList[str];
      // Append class to each string object
      strings[sName] = Object.assign(strings[sName], stringClasses[sName]);
      // Footnotes: four spaces before symbols
      if (sName === 'footnote') {
        const footer = strings[sName];
        footer.content = this.insertFootnoteSpaces(footer.content);
      }
    }
    // Filter out non-displaying source object, then convert to array (for D3)
    // Also filter out numberbox, which is handled separately
    const stringArray = Object.keys(strings)
      .filter(key => {
        const str = strings[key];
        let strOK = true;
        if (str.id.includes('source') && !str.display) {
          strOK = false;
        } else if (str.id.includes('number')) {
          strOK = false;
        }
        return strOK;
      })
      .map(key => strings[key]);
    return stringArray;
  }
  // RESTATE STRINGS ends

  // UPDATE BACKGROUND
  // Background shapes. (This doesn't affect the innerbox.)
  updateBackground() {
    const hundred = 100;
    const ten = 10;
    const config = this.props.config;
    // Populate an array of shapes to be drawn, checking 'display' prop
    const backArray = [];
    for (const shape of config.background.shapes) {
      if (shape.display) {
        backArray.push(shape);
      }
    }
    const chartHeight = config.background.outerbox.dimensions.height;
    const chartWidth = config.background.outerbox.dimensions.width;
    // Colours
    const colours = config.metadata.colours;
    // Context
    const marginsGroup = d3.select('.silver-chart-shapes-group');
    const boundShape = marginsGroup.selectAll('rect').data(backArray);
    // Enter
    boundShape
      .enter()
      .append('rect')
      .attr({
        class: ddd => ddd.class,
        // NOTE: default fill should probably be the same as the
        // chartwrapper background fill...
        fill: '#efefef',
      });
    // Update
    boundShape
      .transition()
      .duration(config.other.duration)
      .attr({
        id: ddd => {
          let idStr = ddd.id;
          const fill = ddd.fill;
          const stroke = ddd.stroke;
          const hasColours =
            typeof fill !== 'undefined' || typeof stroke !== 'undefined';
          if (hasColours) {
            // Separator for Illy
            idStr += '~~~';
            if (typeof fill !== 'undefined') {
              idStr += `fill:${fill},`;
            }
            if (typeof stroke !== 'undefined') {
              idStr += `stroke:${stroke},`;
            }
            // Delete final rogue comma:
            idStr = idStr.replace(/,$/, '');
          }
          return idStr;
        },
        x: ddd => ddd.x,
        y: ddd => ddd.y,
        // Height and width can be absolute px values, or a percent
        // of the containing outerbox...
        height: ddd => {
          // Default is value from context config
          let height = ddd.height;
          // But if element's size is adjustable, express as % of outerbox
          // (assumed to be percent val)
          if (ddd.adjustable.height) {
            const percent = parseFloat(ddd.height, ten);
            height = (chartHeight / hundred) * percent;
          }
          return height;
        },
        width: ddd => {
          let width = ddd.width;
          if (ddd.adjustable.width) {
            const percent = parseFloat(ddd.width, ten);
            width = (chartWidth / hundred) * percent;
          }
          return width;
        },
        fill: ddd => ChartUtils.getColour(ddd, colours, true),
      });
    // Exit
    boundShape.exit().remove();
  }
  // UPDATE BACKGROUND ends

  // GET TEXT ANCHOR
  getTextAnchor(anchor, x) {
    // if anchor is defined via config and it's a valid value,
    // just take the value, otherwise...
    if (!isNil(anchor) && ['start', 'middle', 'end'].includes(anchor))
      return anchor;
    // ...apply the following logic:
    // Strings positioned from right have negative x val
    return x < 0 ? 'end' : 'start';
  }
  // GET TEXT ANCHOR ends

  // UPDATE BACKGROUND STRINGS
  // Draws the various background strings to positions
  // determined by prefs. Then does D3.call to wrapText to
  // handle wrapping, with callback to do position tweaks,
  // based on wrapping...
  updateBackgroundStrings() {
    const globalThis = this;
    const config = this.props.config;
    const strings = config.background.strings;
    // Add value to strings and convert to D3-friendly array
    // excluding numberbox and non-displaying source
    const stringArray = this.restateStrings(strings);
    const chartWidth = config.background.outerbox.dimensions.width;
    const chartHeight = config.background.outerbox.dimensions.height;
    // Width for wrapping is less outer margins:
    const wrappingWidth =
      chartWidth -
      (config.background.outerMargins.left +
        config.background.outerMargins.right);
    const colours = config.metadata.colours;
    // Context
    const stringsGroup = d3.select('.silver-chart-strings-group');
    // Bind text strings to D3 group:
    const boundText = stringsGroup.selectAll('text').data(stringArray);
    // Enter
    boundText.enter().append('text');
    const textWrapConfig = {
      wWidth: wrappingWidth,
      forceTurn: globalThis.props.config.metadata.forceTurn,
    };

    // Update
    boundText
      .attr({
        class: ddd => ddd.class,
        id: ddd => {
          const id = ddd.id;
          const fill = ddd.fill;
          const justification = this.getTextAnchor(ddd.anchor, ddd.x);
          const leading = ddd.leading;
          const tID = ChartUtils.getTextID(id, fill, justification, leading);
          return tID;
        },
        x: ddd => {
          let xPos = ddd.x;
          if (xPos === 'center') {
            xPos = chartWidth / 2;
          } else if (xPos < 0) {
            // Negative x is relative to right of chart
            xPos += chartWidth;
          }
          return xPos;
        },
        y: ddd => {
          let yPos = ddd.y;
          if (yPos < 0) {
            // Negative y is relative to bottom of chart
            yPos += chartHeight;
          }
          return yPos;
        },
        leading: ddd => ddd.leading,
      })
      .text(ddd => ddd.content)
      .style({
        fill: ddd => ChartUtils.getColour(ddd, colours, true),
        'font-family': ddd => ddd['font-family'],
        'letter-spacing': ddd => {
          // Only title strings have tracking defined:
          let spacing = 0;
          if (typeof ddd['letter-spacing'] !== 'undefined') {
            spacing = ddd['letter-spacing'];
          }
          return spacing;
        },
        'font-size': ddd => `${ddd['font-size']}px`,
        'text-anchor': ddd => this.getTextAnchor(ddd.anchor, ddd.x),
      });
    // Text wrapping
    boundText.call(
      TextWrapping.wrapAllTextElements,
      textWrapConfig,
      globalThis,
      globalThis.adjustBackgroundStringPositions,
    );
    // Exit
    boundText.exit().remove();
  }
  // UPDATE BACKGROUND STRINGS ends

  // ADJUST BACKGROUND STRING POSITIONS
  // Callback from wrapText.
  // Inferentially adjust positions of title, subtitle, subsubtitle & footnote
  // to allow for any wrapping. These tweaks determine 2 adjustments
  // -- top and bottom -- for the innerbox bounds...
  // ...which are returned to Chartwrapper
  adjustBackgroundStringPositions(globalThis, lineCountArray) {
    const config = globalThis.props.config;
    const strings = config.background.strings;
    const stringClasses = globalThis.props.stringClasses;
    // Cumulative margin of IB from top of chart
    let topMargin = 0;
    // Running adjustment for turned strings
    let turnExtra = 0;
    // === === === Title string
    const titleClass = `.${stringClasses.title.class}`;
    const titleString = d3.select(titleClass);
    // Move it and adjust top margin
    const yPos = strings.title.y;
    topMargin = yPos;
    titleString.attr('y', yPos);
    // Does the title wrap? Get leading and number of extra lines
    const tLeading = strings.title.leading;
    // Extra padding for wrapping
    turnExtra += (lineCountArray[0] - 1) * tLeading;
    topMargin = +titleString.attr('y') + turnExtra;
    // === === === Subtitle
    const subtitleClass = `.${stringClasses.subtitle.class}`;
    const subtitleString = d3.select(subtitleClass);
    // Subtitle string may be empty, so...
    const subtitleExists =
      !subtitleString.empty() && subtitleString.text().length > 0;
    if (subtitleExists) {
      // Adjust position
      TextWrapping.moveTextAndTspans(subtitleString, turnExtra);
      const stLeading = strings.subtitle.leading;
      const stExtra = (lineCountArray[1] - 1) * stLeading;
      turnExtra += stExtra;
      topMargin = +subtitleString.attr('y') + stExtra;
    }
    // === === === Sub-subtitle
    const sstClass = `.${stringClasses.subsubtitle.class}`;
    const sstString = d3.select(sstClass);
    // Sub-subtitle string may be empty, so...
    const sstExists = !sstString.empty() && sstString.text().length > 0;
    if (sstExists) {
      TextWrapping.moveTextAndTspans(sstString, turnExtra);
      // ChartUtils.moveTextWithTspans(sstString, turnExtra);
      const sstLeading = strings.subsubtitle.leading;
      const sstExtra = (lineCountArray[2] - 1) * sstLeading;
      turnExtra += sstExtra;
      topMargin = +sstString.attr('y') + sstExtra;
    }
    // === === === Source and footnote
    // Handler returns amount by which to adjust bottom margin
    let bottomMargin;
    if (strings.footnote.aboveSource) {
      // Footnote stacked above source
      bottomMargin = globalThis.adjustSourceAndFootnoteStacked(globalThis);
    } else {
      // Source and footnote are side by side
      bottomMargin = globalThis.adjustSourceAndFootnoteLevel(globalThis);
    }
    // FIXME: 1) this is an unholy mess
    //       2) this whole function needs refactoring, anyway
    // At this point I have:
    //    topMargin: baseline of bottom line of title cluster
    //    bottomMargin: baseline of top line of source/footnote cluster
    // Assemble and return a global (i.e. pre-panels) inner box object:
    const bGrd = config.background;
    const mLeft = bGrd.outerMargins.left;
    const mRight = bGrd.outerMargins.right;
    const globalInnerBox = {
      x: mLeft,
      width: bGrd.outerbox.dimensions.width - (mLeft + mRight),
      y: topMargin,
      height: bGrd.outerbox.dimensions.height - (topMargin + bottomMargin),
    };
    // Let the background draw before proceeding
    setTimeout(() => {
      globalThis.props.onGetGlobalInnerBox(globalInnerBox);
    }, config.other.duration * 1.5);
  }
  // ADJUST BACKGROUND STRING POSITIONS ends

  // ADJUST SOURCE AND FOOTNOTE LEVEL
  // Called from adjustBackgroundStringPositions to set
  // positions of source and footnote strings and make any
  // adjustment to bottom margin. This function deals with source
  // and footnote 'level'. We move them up to allow for turned lines,
  // then measure the number of lines to get bottom margin
  adjustSourceAndFootnoteLevel(globalThis) {
    const config = globalThis.props.config;
    const strings = config.background.strings;
    const chartHeight = config.background.outerbox.dimensions.height;
    // const chartWidth = config.background.outerbox.dimensions.width;
    const sourceString = d3.select('.silver-d3-source-string');
    const sourceExists =
      !sourceString.empty() && sourceString.text().length > 0;
    const footnoteString = d3.select('.silver-d3-footnote-string');
    const footnoteExists =
      !footnoteString.empty() && footnoteString.text().length > 0;
    // By default, source and footnote are in position above bottom
    // Get extra height of wrapped source and footnote (leading * (lines - 1))
    let sourceMove = 0;
    let footnoteMove = 0;
    let bottomMargin = 0;
    let footnoteYPos = chartHeight;
    let sourceYPos = footnoteYPos;
    // let footnoteXPos = 0;

    if (sourceExists) {
      sourceYPos = chartHeight + strings.source.y;
      sourceMove = TextWrapping.getTextAndTspansMove(
        sourceString,
        strings.source.leading,
      );
    }
    // some presets like Films, want to keep the background margin bottom even
    // when there is no source or footnote to add. In that case the preset comes
    // with a keepBottomMargin flag. If true, the area chart grows until sitting
    // on the original source position
    else if (strings.source.keepBottomMargin) {
      sourceYPos = chartHeight + strings.source.y;
      sourceMove = TextWrapping.getTextAndTspansMove(
        sourceString,
        strings.source.leading,
      );
      sourceYPos += strings.source.keepBottomMarginOffset;
    }
    if (footnoteExists) {
      footnoteYPos = chartHeight + strings.footnote.y;
      footnoteMove = TextWrapping.getTextAndTspansMove(
        footnoteString,
        strings.footnote.leading,
      );
      // NOTE: inferential to footnotes -- I 'know' they're right-aligned!
      // footnoteXPos = strings.footnote.x;
      // if (footnoteXPos < 0) {
      //   footnoteXPos += chartWidth;
      // }
    }
    // Which is greater?
    const bottomMove = Math.max(sourceMove, footnoteMove);
    // NOTE: inferential. It all assumes
    //    (a) that the source and footnote are at the bottom, and
    //    (b) that they're 'level'.
    // So there's redundancy here (going back, actually, to the lookup file)

    let basesaligned = true;
    if (sourceExists) {
      basesaligned = strings.source.wrapoptions.basealigned;
    }
    // We have to move text element and t-spans.
    // Default is for both to move by their height
    // But is bottom-aligned...
    if (!basesaligned) {
      sourceMove = bottomMove;
      footnoteMove = bottomMove;
    }
    if (sourceExists) {
      globalThis.moveSourceAndFootnote(sourceString, sourceMove);
    }
    if (footnoteExists) {
      globalThis.moveSourceAndFootnote(footnoteString, footnoteMove);
    }

    // And adjust bottom margin:
    // I get the absolute xpos of topmost baseline, from top of chart
    // Basline is chart height minus that value
    const highestBaseline = Math.min(sourceYPos, footnoteYPos);
    bottomMargin = chartHeight - highestBaseline;
    return bottomMargin + bottomMove;
  }
  // ADJUST SOURCE AND FOOTNOTE LEVEL ends

  // ADJUST SOURCE AND FOOTNOTE STACKED
  // Called from adjustBackgroundStringPositions to set
  // positions of source and footnote strings and make any
  // adjustment to bottom margin. Here, footnote is stacked above
  // source. Move source up to allow for turned lines; then footnote
  // above it; then margin below axis
  adjustSourceAndFootnoteStacked(globalThis) {
    const config = globalThis.props.config;
    const strings = config.background.strings;
    const chartHeight = config.background.outerbox.dimensions.height;
    // const chartWidth = config.background.outerbox.dimensions.width;
    const sourceString = d3.select('.silver-d3-source-string');
    const sourceExists =
      !sourceString.empty() && sourceString.text().length > 0;
    const footnoteString = d3.select('.silver-d3-footnote-string');
    const footnoteExists =
      !footnoteString.empty() && footnoteString.text().length > 0;
    // At this point, source and footnote are in position at the bottom
    // of the chart, correctly aligned left/right
    // Get absolute default ypos of source, and extra height of
    // wrapped string (leading * (lines - 1)). Then move source
    let baselineYPos = 0;
    let sourceMove = 0;

    // some presets (i.e. Films. want to keep the background margin bottom even
    // when there is no source or footnote to add. In that case the preset comes
    // with a keepBottomMargin flag)
    if (sourceExists || strings.source.keepBottomMargin) {
      sourceMove = TextWrapping.getTextAndTspansMove(
        sourceString,
        strings.source.leading,
      );
      // Set to distance from top of chart to source baseline:
      baselineYPos = chartHeight + strings.source.y;
      globalThis.moveSourceAndFootnote(sourceString, sourceMove);
    }
    let footnoteMove = sourceMove;
    // Gap between footnote and source
    const gap = strings.footnote.sourceGap;
    if (footnoteExists) {
      if (sourceExists) {
        footnoteMove += gap;
      } else {
        // Inelegant; but fixes issue when no source
        baselineYPos = chartHeight + strings.footnote.y;
      }
      footnoteMove += TextWrapping.getTextAndTspansMove(
        footnoteString,
        strings.footnote.leading,
      );
      globalThis.moveSourceAndFootnote(footnoteString, footnoteMove);
      // Inferential to footnotes. Right-aligned is
      // flagged by a minutely-negative x value, set in prefs
      // let footnoteXPos = strings.footnote.x;
      // if (footnoteXPos < 0) {
      //   footnoteXPos += chartWidth;
      // }
      baselineYPos -= footnoteMove;
    } else {
      baselineYPos -= sourceMove;
    }
    // We want to return the distance between the baseline of the
    // topmost element of source/footnote and the bottom of the chart
    return chartHeight - baselineYPos;
  }
  // ADJUST SOURCE AND FOOTNOTE STACKED ends

  // MOVE SOURCE AND FOOTNOTE
  // Called from adjustSourceAndFootnoteLevel/Stacked. Moves source
  // and footnote elements specifically, with child t-spans
  moveSourceAndFootnote(tElement, yMove) {
    // Move the text element
    const xPos = +tElement.attr('x');
    tElement.attr({
      y: () => {
        let moveY = tElement.attr('y');
        moveY -= yMove;
        return moveY;
      },
    });
    // Move tSpans
    tElement.selectAll('tspan').each(function() {
      const thisSpan = d3.select(this);
      thisSpan.attr({
        x: () => {
          let myX = null;
          if (thisSpan.attr('y') !== null) {
            myX = xPos;
          }
          return myX;
        },
        y: () => {
          let moveY = null;
          const spanY = thisSpan.attr('y');
          if (spanY !== null) {
            moveY = +spanY - yMove;
          }
          return moveY;
        },
      });
    });
  }
  // MOVE SOURCE AND FOOTNOTE ends

  callNumberBox() {
    const config = this.props.config;
    const bgID = '#background-group';
    NumberBox.updateNumberBox(config, bgID);
  }

  // RENDER
  // Just render the svg group. Everything else is appended
  // from componentDidMount
  render() {
    return (
      <g className="silver-chart-background-group" id="background-group">
        <g className="silver-chart-shapes-group" id="shapes-group" />
        <g className="silver-chart-strings-group" id="strings-group" />
        <g className="silver-chart-panels-group" id="panels-group" />
      </g>
    );
  }
}

SilverBackground.propTypes = {
  config: PropTypes.object,
  drawBackground: PropTypes.bool,
  stringClasses: PropTypes.object,
  // eslint-disable-next-line react/no-unused-prop-types
  onGetGlobalInnerBox: PropTypes.func.isRequired,
};

export default SilverBackground;
