// NOTE: while I'm messing around...
// /* eslint-disable no-unused-vars */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as AxisUtilities from '../axes/axis-utilities';
import * as ChartUtilities from '../chart-utilities';
import SilverPieSeries from './pieseries';

class SilverPieChart extends Component {
  // CONSTRUCTOR
  constructor(props) {
    super(props);
    this.state = {
      innerBox: this.props.config.innerBox,
    };
    // Click on wedge
    this.handleWedgeClick = this.handleWedgeClick.bind(this);
  }

  // COMPONENT WILL MOUNT
  // Puts inherited innerBox into state:
  UNSAFE_componentWillMount() {
    this.setState({
      innerBox: this.props.config.innerBox,
    });
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    // this.mainDthreeGroupTransition(0);
  }

  // COMPONENT WILL RECEIVE PROPS
  // Reset state to default...
  UNSAFE_componentWillReceiveProps(newProps) {
    this.setState({
      innerBox: newProps.config.innerBox,
    });
  }

  // HANDLE WEDGE CLICK
  // This is potentially useful... maybe...
  handleWedgeClick(event) {
    const wedgeData = event.wedgeData;
    // const index = event.index;
    const info = `Value is ${wedgeData.val}`;
    /* eslint-disable no-console */
    console.log(info);
    /* eslint-enable no-console */
  }
  // HANDLE WEDGE CLICK ends

  // BUILD PB ARRAY
  // Called from getPieBoundsArray. Assembles an array of
  // pie-panel properties, based on number of rows and cols
  buildPbArray(bounds, rows, cols, isHalfPie) {
    const myBounds = Object.assign({}, bounds);
    const pWidth = myBounds.width / cols;
    const pHeight = myBounds.height / rows;
    const left = myBounds.x;
    const top = myBounds.y;
    const pieArray = [];
    for (let rNo = 0; rNo < rows; rNo++) {
      for (let cNo = 0; cNo < cols; cNo++) {
        const pObj = {};
        pObj.width = pWidth;
        pObj.height = pHeight;
        pObj.x = left + pWidth * cNo;
        pObj.y = top + pHeight * rNo;
        // Centre points
        pObj.cx = left + pWidth * cNo + pWidth / 2;
        pObj.cy = top + pHeight * rNo + pHeight / 2;
        // But half pies align to bottom, with an
        // arbitrary allowance for the series header
        if (isHalfPie) {
          pObj.cy = top + pHeight * rNo + pHeight - 10;
        }
        pieArray.push(pObj);
      }
    }
    return pieArray;
  }
  // BUILD PB ARRAY ends

  // GET PIE BOUNDS ARRAY
  // Called from configSeriesPies to work out how
  // pie panels should be arranged in chart inner box
  getPieBoundsArray(bounds, sCount, chartType) {
    const isHalfPie = chartType.includes('half');
    // Start by getting the w/h ratio of the inner box
    const boundsRatio = bounds.width / bounds.height;
    // Default is one pie:
    let pbArray = [Object.assign({}, bounds)];
    let rows = 1;
    let cols = 1;
    // Threshold is a ratio that determines whether we draw
    // a horizontal or vertical stack
    // NOTE: there's a lot of redundancy here; and
    // half-pies are a bit... approximate
    let threshold = 1;
    if (sCount === 2) {
      // TWO *****
      if (isHalfPie) {
        threshold = 2;
      }
      if (boundsRatio > threshold) {
        cols = 2;
      } else {
        rows = 2;
      }
    } else if (sCount === 3) {
      // THREE*****
      if (boundsRatio > 1.5) {
        cols = 3;
      } else if (boundsRatio < 0.75) {
        rows = 3;
      } else {
        cols = 2;
        rows = 2;
      }
    } else if (sCount === 4) {
      // FOUR *****
      if (boundsRatio > 1.5) {
        cols = 4;
      } else if (boundsRatio < 0.75) {
        rows = 4;
      } else {
        cols = 2;
        rows = 2;
      }
    } else if (sCount === 5) {
      // FIVE *****
      if (boundsRatio > 1.5) {
        cols = 5;
      } else if (boundsRatio < 0.75) {
        rows = 5;
      } else {
        cols = 3;
        rows = 2;
      }
    } else if (sCount === 6) {
      // SIX *****
      if (boundsRatio > 1) {
        cols = 3;
        rows = 2;
      } else {
        cols = 2;
        rows = 3;
      }
    } else if (sCount === 7) {
      // SEVEN *****
      if (boundsRatio > 1) {
        cols = 4;
        rows = 2;
      } else {
        cols = 2;
        rows = 4;
      }
    } else if (sCount >= 8) {
      // EIGHT *****
      if (boundsRatio > 1) {
        cols = 4;
        rows = 2;
      } else {
        cols = 2;
        rows = 4;
      }
    }
    pbArray = this.buildPbArray(bounds, rows, cols, isHalfPie);
    return pbArray;
  }
  // GET PIE BOUNDS ARRAY ends

  // CONFIG SERIES PIES
  // Called from render to assemble config object
  // to pass to PieSeries
  configSeriesPies(chartConfig) {
    // The default name/value lookup of colours
    const colourLookup = chartConfig.colourLookup;
    // Colours for this sequence of series
    const bounds = Object.assign({}, this.state.innerBox);
    const side = AxisUtilities.getSide(chartConfig.scales);
    const chartType = chartConfig.scales[side].type;
    const colourSet = chartConfig.series[chartType].colours;
    // There will be 2 bounds objects:
    //    1. A single object defining the entire inner box
    //    2. An array of objects defining seriesCount
    //       inner boxes -- one for each pie
    // NOTE: hard-coded to max 8 pies
    const seriesCount = Math.min(chartConfig.seriesCount, 8);
    const pieBoundsArray = this.getPieBoundsArray(
      bounds,
      seriesCount,
      chartType,
    );
    const config = {
      bounds,
      catHead: chartConfig.headers[0],
      chartData: chartConfig.chartData,
      chartIndex: chartConfig.chartIndex,
      chartType,
      className: `pie-series-group-${chartConfig.chartIndex}`,
      colourLookup,
      colourSet,
      emVal: chartConfig.emVal,
      factor: 1,
      forceTurn: chartConfig.forceTurn,
      pieBoundsArray,
      pointCount: chartConfig.pointCount,
      seriesCount,
      piePrefs: chartConfig.series[chartType],
    };
    // Now exclude any blob headers:
    const actualHeaders = [];
    for (let iii = 1; iii <= config.seriesCount; iii++) {
      actualHeaders.push(chartConfig.headers[iii]);
    }
    config.seriesHeads = actualHeaders;
    // Map colours (for pies, by categories):
    config.colourMap = ChartUtilities.getColourMap(actualHeaders, colourSet);
    const cats = chartConfig.categories;
    config.catsColourMap = ChartUtilities.getColourMap(cats, colourSet);
    return config;
  }
  // CONFIG SERIES PIES ends

  render() {
    const config = this.props.config;
    const chartIndex = config.chartIndex;
    // Key all subcomponents:
    const kids = ChartUtilities.getKeysAndIds(chartIndex);
    // Config obj to go to PieSeries
    const seriesConfig = this.configSeriesPies(config);
    const pieSeriesJsx = (
      <SilverPieSeries
        key={kids.pieSeriesKey}
        config={seriesConfig}
        // onPassWedgeClick={this.handleWedgeClick}
      />
    );
    // Name parent group:
    const chartComponentsJSX = (
      <g className="outer-pie-group" id={kids.contentId}>
        {pieSeriesJsx}
      </g>
    );
    return chartComponentsJSX;
  }
}

SilverPieChart.propTypes = {
  config: PropTypes.object.isRequired,
};

export default SilverPieChart;
