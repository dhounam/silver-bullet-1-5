import * as d3 from 'd3';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

class TableRules extends Component {
  // constructor(props) {
  //   super(props);
  // }

  // COMPONENT DID MOUNT
  componentDidMount() {
    this.updateRules();
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    this.updateRules();
  }

  getContentHeight(config) {
    const contentLength = config.chartData.length;
    const linespacing = config.tableProperties.text.content.paragraph;
    return contentLength * linespacing;
  }

  drawRule(rProps, rGrp) {
    rGrp
      .append('line')
      .attr({
        class: 'top-rule',
        x1: rProps.x1,
        x2: rProps.x2,
        y1: rProps.y,
        y2: rProps.y,
        id: `${rProps.id}~~~stroke:${rProps.strokeName}`,
      })
      .style({
        'stroke-width': rProps.width,
        stroke: rProps.stroke,
      });
  }

  prepareTopRule(config, rGrp) {
    const rPrefs = config.tableProperties.rules.top;
    const iBox = config.innerBox;
    const x1 = iBox.x;
    const x2 = x1 + iBox.width;
    const y = iBox.y + rPrefs.belowText;
    const rProps = {
      x1,
      x2,
      y,
      width: rPrefs.width,
      strokeName: rPrefs.stroke,
      stroke: config.colourLookup[rPrefs.stroke],
      id: 'table-top-rule',
    };
    this.drawRule(rProps, rGrp);
  }

  prepareBottomRule(config, rGrp) {
    const rPrefs = config.tableProperties.rules.bottom;
    const iBox = config.innerBox;
    const x1 = iBox.x;
    const x2 = x1 + iBox.width;
    let y = iBox.y + this.getContentHeight(config);
    y += rPrefs.belowText;
    const rProps = {
      x1,
      x2,
      y,
      width: rPrefs.width,
      strokeName: rPrefs.stroke,
      stroke: config.colourLookup[rPrefs.stroke],
      id: 'table-bottom-rule',
    };
    this.drawRule(rProps, rGrp);
  }

  // UPDATE RULES
  updateRules() {
    const config = this.props.config;
    // Group
    const idName = this.props.idName;
    const rulesGrp = d3.select(`#${idName}`);
    const rules = config.tableProperties.rules;
    if (rules.top.drawn) {
      this.prepareTopRule(config, rulesGrp);
    }
    if (rules.bottom.drawn) {
      this.prepareBottomRule(config, rulesGrp);
    }
  }
  // UPDATE RULES ends

  // RENDER:
  render() {
    return <g className={this.props.config.className} id={this.props.idName} />;
  }
}

TableRules.propTypes = {
  config: PropTypes.object,
  idName: PropTypes.string,
};

export default TableRules;
