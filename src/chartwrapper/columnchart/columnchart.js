// NOTE: while I'm messing around...
// /* eslint-disable no-unused-vars */

import * as d3 from 'd3';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Utilities modules
import * as ChartUtilities from '../chart-utilities';
import * as AxisUtilities from '../axes/axis-utilities';
import * as BlobUtilities from '../blobs/blob-utilities';
import ConfigXaxisOrdinal from '../axes/configuration/xaxis-ordinal-config';
import ConfigYaxisLinear from '../axes/configuration/yaxis-linear-config';
// D3 sub-components:
import SilverXaxisOrdinal from '../axes/live/xaxis-ordinal';
import SilverXaxisOrdinalTest from '../axes/tests/xaxis-ordinal-test';
import SilverYaxisLinear from '../axes/live/yaxis-linear';
import SilverYaxisLinearTest from '../axes/tests/yaxis-linear-test';
import SilverSeriesColumn from './columnseries';
import SilverXaxisBlobs from '../blobs/xaxis-blobs';

class SilverColumnChart extends Component {
  // CONSTRUCTOR
  constructor(props) {
    super(props);
    this.state = {
      // flags to control subcomponent testing/rendering
      yaxisTestLeft: false,
      yaxisTestRight: false,
      xaxisTest: false,
      blobsTest: false,
      // updated innerBox bounds
      innerBox: this.props.config.innerBox,
      // Default granularity object
      granularity: {},
      // Temporary innerBox bounds
      postYaxisBounds: {},
    };
    // Callbacks from axis and blobs tests:
    this.handleXaxisInnerBoxBounds = this.handleXaxisInnerBoxBounds.bind(this);
    this.handleYaxisInnerBoxBoundsLeft = this.handleYaxisInnerBoxBoundsLeft.bind(
      this,
    );
    this.handleYaxisInnerBoxBoundsRight = this.handleYaxisInnerBoxBoundsRight.bind(
      this,
    );
    this.handleBlobsInnerBoxBounds = this.handleBlobsInnerBoxBounds.bind(this);
    // Click on column
    this.handleColumnClick = this.handleColumnClick.bind(this);
  }

  // COMPONENT WILL MOUNT
  // Puts inherited innerBox into state:
  UNSAFE_componentWillMount() {
    this.setState({
      yaxisTestLeft: true,
      yaxisTestRight: false,
      xaxisTest: false,
      blobsTest: false,
      innerBox: this.props.config.innerBox,
    });
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    this.mainDthreeGroupTransition(0);
  }

  // COMPONENT WILL RECEIVE PROPS
  // Reset state to default...
  UNSAFE_componentWillReceiveProps(newProps) {
    this.setState({
      innerBox: newProps.config.innerBox,
      yaxisTestLeft: true,
      yaxisTestRight: false,
      xaxisTest: false,
      blobsTest: false,
    });
    // NOTE: can I set state here?
  }

  // Callbacks:
  // HANDLE Y-AXIS INNER BOX BOUNDS
  // ...fields the revised innerBox, allowing for axis labels.
  // It also sets state.postYaxisBounds, which represents the
  // chart area after allowing for yaxis labels and before the
  // IB is adjusted for projecting x-axis category strings. This
  // (hopefully!) allows me to adjust for blobs...
  handleYaxisInnerBoxBoundsLeft(innerBox) {
    // Mod May'25 checks for fixed l/r inner margins (Online Video Landscape)
    const config = this.props.config;
    innerBox = ChartUtilities.checkForFixedInnerMargins(innerBox, config);
    this.setState({
      innerBox,
      postYaxisBounds: Object.assign({}, innerBox),
      // Set flags for render 3 (blobs test)
      yaxisTestLeft: false,
      yaxisTestRight: true,
      xaxisTest: false,
      blobsTest: false,
    });
  }

  handleYaxisInnerBoxBoundsRight(innerBox) {
    // Mod May'25 checks for fixed l/r inner margins (Online Video Landscape)
    const config = this.props.config;
    innerBox = ChartUtilities.checkForFixedInnerMargins(innerBox, config);
    this.setState({
      innerBox,
      postYaxisBounds: Object.assign({}, innerBox),
      // Set flags for render 3 (blobs test)
      yaxisTestLeft: false,
      yaxisTestRight: false,
      xaxisTest: true,
      blobsTest: false,
    });
  }

  // HANDLE X-AXIS INNER BOX BOUNDS
  // ...fields the revised innerBox after calculating axis adjustments
  handleXaxisInnerBoxBounds(result) {
    // Mod May'25 checks for fixed l/r inner margins (Online Video Landscape)
    const config = this.props.config;
    result.bounds = ChartUtilities.checkForFixedInnerMargins(
      result.bounds,
      config,
    );
    this.setState({
      innerBox: result.bounds,
      granularity: result.granularity,
      yaxisTestLeft: false,
      yaxisTestRight: false,
      xaxisTest: false,
      blobsTest: true,
    });
  }

  // HANDLE BLOBS INNER BOX BOUNDS
  // ...fields the revised innerBox (after left margin adjusted for cat strings)
  handleBlobsInnerBoxBounds(innerBox) {
    // Fire off an error msg if IB is on the small side...
    // ...deleted Feb'21
    this.setState({
      innerBox,
      // Set flags for render 4 (final)
      yaxisTestLeft: false,
      yaxisTestRight: false,
      xaxisTest: false,
      blobsTest: false,
    });
    // const duration = this.props.config.duration;
    // NOTE: set to zero to prevent visible drop-in from top left...
    // NOTE: if I'm going to use a zero duration regularly, put it into prefs
    const duration = 0;
    this.mainDthreeGroupTransition(duration);
  }

  // HANDLE BAR CLICK EVENT
  // This is potentially useful... maybe...
  handleColumnClick(event) {
    const colData = event.colData;
    // const index = event.index;
    const info = `Value is ${colData.val}`;
    /* eslint-disable no-console */
    console.log(info);
    /* eslint-enable no-console */
  }
  // HANDLE BAR CLICK EVENT ends

  /*
    The logic is that if I've rendered Sibyl, in order to update
    Editor status, I don't want to have a re-render here fire
    off another callback and start it all going round.
    So actually I want the situation to remain the same, unless
    Editor has kicked off and forced the flag to true
    So if the flag is false, I don't want anything to change
  */

  // MAIN D3 GROUP TRANSITION
  // Called from handleYaxisInnerBoxBounds
  // On 2nd render only, after adjustments have been made to the background elements
  // (strings and legand)
  // Moves main D3 group into position
  // NB: This isn't interested in mainGroup *size* -- only in location
  mainDthreeGroupTransition(duration) {
    const innerBox = this.state.innerBox;
    const bLeft = innerBox.x;
    const bTop = innerBox.y;
    const transStr = `translate(${bLeft}, ${bTop})`;
    const mainGroupClass = this.getMainGroupClass(true, false);
    const mainGroup = d3.select(mainGroupClass);
    mainGroup
      .transition()
      .duration(duration)
      .attr('transform', transStr);
  }
  // Because of the double-render, the above can only be called on an update (I think!)

  // GET MAIN GROUP CLASS
  // Returns class name for main chart group. Arg 1 determines
  // whether classes are preceded by a dot; arg 2 whether
  // the general class (which pulls in the CSS) is appended
  // NOTE: The point is, because all d3 refs are specific, I need
  // indexed class names throughout. The general class will be used
  // for CSS (probably n/a for this main group; but important for
  // axes, at least...)
  getMainGroupClass(prefixDot, addGeneralClass) {
    let dot = '';
    let generalClass = '';
    if (prefixDot) {
      dot = '.';
    }
    if (addGeneralClass) {
      generalClass = `${dot}chart-main-group`;
    }
    return `${generalClass} ${dot}chart-main-group-${this.props.config.chartIndex}`;
  }
  // GET MAIN GROUP CLASS ends

  //
  // ==================================
  // D3 component configuration objects:
  // ==================================

  // GET X-AXIS CONFIG
  // Hands off to function in axis-utilities.
  // Params is CO
  getXaxisConfig(chartConfig) {
    const innerBox = Object.assign({}, this.state.innerBox);
    // Check for test...
    const testFlag = this.state.xaxisTest;
    const granularity = this.state.granularity;
    const axisConfig = ConfigXaxisOrdinal(
      chartConfig,
      innerBox,
      testFlag,
      granularity,
    );
    return axisConfig;
  }
  // GET X-AXIS CONFIG ends

  // GET Y-AXIS CONFIG
  // Hands off to function in axis-utilities.
  // Params are CO, 'left'/'right'...
  getYaxisConfig(chartConfig, side, testFlag) {
    const innerBox = Object.assign({}, this.state.innerBox);
    const axisConfig = ConfigYaxisLinear(chartConfig, innerBox, testFlag, side);
    return axisConfig;
  }
  // GET Y-AXIS CONFIG ends

  // GET BLOBS CONFIG
  // Hands off to function in BlobUtilities
  getBlobsConfig(chartConfig) {
    const nowBounds = this.state.innerBox;
    const postYBounds = this.state.postYaxisBounds;
    // Check for test...
    const testFlag = this.state.blobsTest;
    const side = AxisUtilities.getSide(chartConfig.scales);
    const blobConfig = BlobUtilities.configXBlobs(
      chartConfig,
      nowBounds,
      postYBounds,
      testFlag,
      side,
    );
    return blobConfig;
  }
  // GET BLOBS CONFIG ends

  // CONFIG SERIES COLUMNS
  // Assembles column series config object
  configSeriesColumns(chartConfig) {
    // The default name/value lookup of colours
    const colourLookup = chartConfig.colourLookup;
    // Colours for this sequence of series
    const colourSet = chartConfig.series.column.colours;
    const bounds = Object.assign({}, this.state.innerBox);
    // Padding may change if col width is unacceptable
    const padding = chartConfig.series.column.gap;
    const narrowGap = chartConfig.series.column.narrowGap;
    const absoluteMinWidth = chartConfig.series.column.absoluteMinWidth;
    const minWidth = chartConfig.series.column.minWidth;
    const maxWidth = chartConfig.series.column.maxWidth;
    const side = AxisUtilities.getSide(chartConfig.scales);
    const chartType = chartConfig.scales[side].type;
    const accum = chartConfig.scales[side].stacked;
    const mmO = Object.assign({}, chartConfig.scales[side].minMaxObj.scale);
    // Broken scale...?
    let breakScale = false;
    const brokenScalePadding = chartConfig.yAxis.brokenScalePadding.default;
    if (mmO.min > 0) {
      bounds.height -= brokenScalePadding;
      breakScale = true;
    }
    // Assemble the config object with 'simple' props
    const config = {
      absoluteMinWidth,
      accum,
      bounds,
      breakScale,
      brokenScalePadding,
      chartData: chartConfig.chartData,
      chartIndex: chartConfig.chartIndex,
      chartType,
      className: `d3-column-series-group d3-column-series-group-${chartConfig.chartIndex}`,
      colourLookup,
      colourSet,
      duration: chartConfig.duration,
      // factor: mmO.factor,
      factor: chartConfig.scales[side].factor,
      minVal: mmO.min,
      minWidth,
      maxWidth,
      narrowGap,
      originalBounds: chartConfig.originalInnerBox,
      padding,
      pointCount: chartConfig.pointCount,
      seriesCount: chartConfig.seriesCount,
      zeroPrefs: chartConfig.xAxis.ticks.zero,
    };
    // Mixed +/– flag:
    config.mixedVals = mmO.min < 0 && mmO.max >= 0;
    // Y-SCALE (linear):
    config.yScale = d3.scale
      .linear()
      .range([bounds.height, 0])
      .domain([mmO.min, mmO.max]);
    // HEADERS:
    // NOTE: this is all dup'd in barchart.js...
    // and there's redundancy in header-extraction, too...
    // Separate first (category) column header from subsequent headers:
    config.catHead = chartConfig.headers[0];
    // Now exclude any blob headers:
    const actualHeaders = [];
    for (let iii = 1; iii <= chartConfig.seriesCount; iii++) {
      if (chartConfig.headers[iii] !== chartConfig.blobs.blobState.header) {
        actualHeaders.push(chartConfig.headers[iii]);
      }
    }
    config.seriesHeads = actualHeaders;
    // Map series colours:
    config.colourMap = ChartUtilities.getColourMap(actualHeaders, colourSet);
    // So, to be clear, the config obj includes properties--
    //      catHead: the category column header
    //      seriesHeads: all subsequent (col 2 etc...) header strings
    //      colourMap: a D3 scale object that maps headers to series colours
    // X-SCALE:
    const xMainDomain = chartConfig.chartData.map(ddd => ddd[config.catHead]);
    // On the use of 'padding' here...
    // In order to set an exact px gap between columns, I ignore the optional
    // arguments that D3 attaches to the rangeBands method to set inner and
    // outer gaps. Instead, I set up rangeBands for no gap; then, in
    // columnseries, I subtract the gap from the width of each column.
    // And I add the padding to the right of the range, to bring the last
    // column back into line with the innerbox (i.e. to allow for the
    // lost width on that last column)
    // Main scale (by data point)

    // Cluster width & padding
    const cwp = ChartUtilities.getSeriesClusterWidthAndPadding(
      chartConfig,
      false,
    );
    const halfClusterWidth = cwp.clusterWidth / 2;
    config.halfClusterWidth = halfClusterWidth;
    config.padding = cwp.padding;
    //
    config.xMainScale = d3.scale
      .ordinal()
      .rangeBands(
        [
          0 - halfClusterWidth,
          config.bounds.width + halfClusterWidth + config.padding,
        ],
        0,
        0,
      )
      .domain(xMainDomain);
    // Cluster scale
    // Now, cluster scale (n/a for unstacked, but anyway...)
    config.xClusterScale = d3.scale
      .ordinal()
      .domain(actualHeaders)
      .rangeBands([0, config.xMainScale.rangeBand() - config.padding], 0, 0);
    return config;
  }
  // CONFIG SERIES COLUMNS ends

  // GET Y-AXIS JSX
  // Ideally, these would be in AxisUtilities, shared by all chart
  // types. The trouble is, it needs access to state, so unless I'm
  // going to start passing state around as a param, it has to live
  // here, and all chart-type components will duplicate this code...
  getYaxisJsx(config, exists, key, side) {
    // Check for test...
    let testFlag = this.state.yaxisTestLeft;
    if (side === 'right') {
      testFlag = this.state.yaxisTestRight;
    }
    let axisConfig = { enabled: false };
    if (exists) {
      axisConfig = this.getYaxisConfig(config, side, testFlag);
    }
    axisConfig.bounds = this.state.innerBox;
    // return axisConfig;
    // Render left yaxis only, with 'test' flag
    // to get margin
    let callbackHandler = this.handleYaxisInnerBoxBoundsRight;
    if (side === 'left') {
      callbackHandler = this.handleYaxisInnerBoxBoundsLeft;
    }
    let axisJsx = '';
    if (testFlag) {
      axisJsx = (
        <SilverYaxisLinearTest
          key={`${key}-test-${side}`}
          config={axisConfig}
          onReturnRevisedInnerBox={callbackHandler}
        />
      );
    } else {
      axisJsx = (
        <SilverYaxisLinear key={`${key}-test-${side}`} config={axisConfig} />
      );
    }
    return axisJsx;
  }
  // GET Y-AXIS JSX ends

  // GET X-AXIS JSX
  // Called from render to assemble x-axis jsx
  getXaxisJsx(config, key) {
    // Fcn in this component pulls a couple of strings, then calls
    // fcn in AxisUtilities... and the result is the axis config obj.
    const axisConfig = this.getXaxisConfig(config);
    axisConfig.bounds = this.state.innerBox;
    // Test or live:
    let xaxisJsx = '';
    if (this.state.xaxisTest) {
      // Only send callback for test
      xaxisJsx = (
        <SilverXaxisOrdinalTest
          key={key}
          config={axisConfig}
          onReturnRevisedInnerBox={this.handleXaxisInnerBoxBounds}
        />
      );
    } else {
      xaxisJsx = <SilverXaxisOrdinal key={key} config={axisConfig} />;
    }
    return xaxisJsx;
  }
  // GET X-AXIS JSX ends

  // GET BLOBS JSX
  getBlobsJsx(config, key, isTest) {
    const blobsConfig = this.getBlobsConfig(config);
    blobsConfig.bounds = this.state.innerBox;
    const jsxTemplate = (
      <SilverXaxisBlobs
        key={key}
        config={blobsConfig}
        onReturnRevisedInnerBox={this.handleBlobsInnerBoxBounds}
      />
    );
    let jsx = '';
    if (isTest) {
      // If it's a test, always assemble jsx
      jsx = jsxTemplate;
    } else if (blobsConfig.blobs.blobState.column > 0) {
      // Not a test, only make up jsx if there ARE blobs
      jsx = jsxTemplate;
    }
    return jsx;
  }
  // GET BLOBS JSX ends

  // RENDER
  render() {
    const config = this.props.config;
    const chartIndex = config.chartIndex;
    // Key all subcomponents:
    const kids = ChartUtilities.getKeysAndIds(chartIndex);

    // Custom config objects for the various d3 components
    // See linechart.js

    // Y axis can be left/right/both...
    const enableScale = config.scales.enableScale;
    const yLeft = enableScale.left;
    const yRight = enableScale.right;
    // Default empty jsx
    let xaxisJSX = '';
    let yaxisJSXLeft = '';
    let yaxisJSXRight = '';
    let blobsJSX = '';
    let columnseriesJSX = '';
    // Render sequence:
    // Either the tests, where we render individual components...
    if (this.state.yaxisTestLeft) {
      yaxisJSXLeft = this.getYaxisJsx(config, yLeft, kids.yAxisKey, 'left');
    } else if (this.state.yaxisTestRight) {
      yaxisJSXRight = this.getYaxisJsx(config, yRight, kids.yAxisKey, 'right');
    } else if (this.state.xaxisTest) {
      xaxisJSX = this.getXaxisJsx(config, kids.xAxisKey);
    } else if (this.state.blobsTest) {
      blobsJSX = this.getBlobsJsx(config, kids.blobsKey, this.state.blobsTest);
    } else {
      // ...or, when all tests are done, the whole shebang!
      // Full render, with all children.
      xaxisJSX = this.getXaxisJsx(config, kids.xAxisKey);
      if (yLeft) {
        yaxisJSXLeft = this.getYaxisJsx(config, yLeft, kids, 'left');
      }
      if (yRight) {
        yaxisJSXRight = this.getYaxisJsx(config, yRight, kids, 'right');
      }
      blobsJSX = this.getBlobsJsx(config, kids.blobsKey, this.state.blobsTest);
      const seriesConfig = this.configSeriesColumns(config);
      seriesConfig.bounds = this.state.innerBox;
      columnseriesJSX = (
        <SilverSeriesColumn
          key={kids.colummnSeriesKey}
          config={seriesConfig}
          onPassColumnClick={this.handleColumnClick}
        />
      );
    }
    // General and indexed class for main group:
    const mainGroupClass = this.getMainGroupClass(false, true);

    /*
    // NOTE: I can draw a temporary 'inner box'
    // so I can see what I've got...
    const rectStyle = {
      fill: '#ccc',
      width: this.state.innerBox.width,
      height: this.state.innerBox.height,
      x: 0,
      y: 0,
    };
    // Move next into top of JSX definition, below
    <rect style={rectStyle} />
    */

    // zeroline-group is in front of yaxis, behind series;
    // for zero line, if any, and other possible
    // furniture that has to overlay other elements

    const chartComponentsJSX = (
      <g className={mainGroupClass} key={kids.mainGroupKey} id={kids.contentId}>
        {xaxisJSX}
        {yaxisJSXLeft}
        {yaxisJSXRight}
        {blobsJSX}
        {columnseriesJSX}
        <g className={kids.zeroId} id={kids.zeroId} />
      </g>
    );
    return chartComponentsJSX;
  }
}

SilverColumnChart.propTypes = {
  config: PropTypes.object.isRequired,
};

export default SilverColumnChart;
