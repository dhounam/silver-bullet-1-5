import * as d3 from 'd3';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Utilities modules
import * as ChartUtilities from '../chart-utilities';
import * as AxisUtilities from '../axes/axis-utilities';
import ConfigXaxisLinear from '../axes/configuration/xaxis-linear-config';
import ConfigYaxisOrdinal from '../axes/configuration/yaxis-ordinal-config';

// D3 sub-components:
import SilverXaxisLinear from '../axes/live/xaxis-linear';
import SilverXaxisLinearTest from '../axes/tests/xaxis-linear-test';
import SilverYaxisOrdinal from '../axes/live/yaxis-ordinal';
import SilverYaxisOrdinalTest from '../axes/tests/yaxis-ordinal-test';
import SilverSeriesBar from './barseries';
import SilverYaxisBlobs from '../blobs/yaxis-blobs';

class SilverBarChart extends Component {
  // CONSTRUCTOR
  constructor(props) {
    super(props);
    this.state = {
      // flags to control subcomponent testing/rendering
      yaxisTest: true,
      blobsTest: false,
      xaxisTest: false,
      // updated innerBox bounds
      innerBox: this.props.config.innerBox,
    };
    // Callbacks from axis and blobs tests:
    this.handleYaxisInnerBoxBounds = this.handleYaxisInnerBoxBounds.bind(this);
    this.handleBlobsInnerBoxBounds = this.handleBlobsInnerBoxBounds.bind(this);
    this.handleXaxisInnerBoxBounds = this.handleXaxisInnerBoxBounds.bind(this);
    // Click on bar
    this.handleBarClick = this.handleBarClick.bind(this);
  }

  // COMPONENT WILL RECEIVE PROPS
  // Reset state to default...
  UNSAFE_componentWillReceiveProps(newProps) {
    this.setState({
      innerBox: newProps.config.innerBox,
      yaxisTest: true,
      blobsTest: false,
      xaxisTest: false,
    });
  }

  // Callbacks:
  // HANDLE Y-AXIS INNER BOX BOUNDS
  handleYaxisInnerBoxBounds(innerBox) {
    // Mod May'25 checks for fixed l/r inner margins (Online Video Landscape)
    // const config = this.props.config;
    // innerBox = ChartUtilities.checkForFixedInnerMargins(innerBox, config, 'barchart')
    this.setState({
      innerBox,
      // Set flags for render 2 (blobs test)
      xaxisTest: false,
      yaxisTest: false,
      blobsTest: true,
    });
  }

  // HANDLE BLOBS INNER BOX BOUNDS
  handleBlobsInnerBoxBounds(innerBox) {
    // ...and set state
    this.setState({
      innerBox,
      // Set flags for render 3 (xaxis)
      xaxisTest: true,
      yaxisTest: false,
      blobsTest: false,
    });
  }

  // HANDLE X-AXIS INNER BOX BOUNDS
  // ...fields the revised innerBox (after axis testing)
  handleXaxisInnerBoxBounds(innerBox) {
    // Mod May'25 checks for fixed l/r inner margins (Online Video Landscape)
    const config = this.props.config;
    innerBox = ChartUtilities.checkForFixedInnerMargins(
      innerBox,
      config,
      'barchart',
    );
    this.setState({
      innerBox,
      // Set flags for render 4 (final)
      xaxisTest: false,
      yaxisTest: false,
      blobsTest: false,
    });
    // const duration = this.props.config.duration;
    const duration = 0;
    // NOTE: set to zero to prevent visible drop-in from top left...
    // NOTE: if I'm going to use a zero duration regularly, put it into prefs
    this.mainDthreeGroupTransition(innerBox, duration);
  }

  // HANDLE BAR CLICK EVENT
  // This is potentially useful... maybe...
  handleBarClick(event) {
    const barData = event.barData;
    // const index = event.index;
    const info = `Value is ${barData.y}`;
    /* eslint-disable no-console */
    console.log(info);
    /* eslint-enable no-console */
  }
  // HANDLE BAR CLICK EVENT ends

  // MAIN D3 GROUP TRANSITION
  // Called from handleXaxisInnerBoxBounds
  // Moves main D3 group into position
  mainDthreeGroupTransition(innerBox, duration) {
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
  // MAIN D3 GROUP TRANSITION ends

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

  // GET AXIS CONFIG
  // Hands off to function in axis-utilities. 2nd param is a flag
  // for x- or y-axis.
  // NOTE: for bar charts, I have no option for x-axis at top or bottom...
  // NOTE: On bounds, see barchart.render
  getAxisConfig(chartConfig, isXaxis, bounds) {
    let axisConfig = {};
    // Go to state for the innerBox, since that
    // gets modified by the callback from margin check...
    let innerBox = JSON.parse(JSON.stringify(this.state.innerBox));
    if (typeof bounds !== 'undefined') {
      innerBox = bounds;
    }
    if (isXaxis) {
      // Utility fcn; 3rd arg is testFlag
      axisConfig = ConfigXaxisLinear(
        chartConfig,
        innerBox,
        this.state.xaxisTest,
      );
    } else {
      axisConfig = ConfigYaxisOrdinal(
        chartConfig,
        innerBox,
        this.state.yaxisTest,
      );
    }
    return axisConfig;
  }
  // GET AXIS CONFIG ends

  // CONFIG BLOBS
  // Assembles blob config object for bars (y-axis)
  configBlobs(chartConfig, projectionBounds) {
    // Define props required for more than immediate slot-in to config
    const colourSet = chartConfig.series.bar.colours;
    // Extract blob headers.
    // headers is complete list
    const hLen = chartConfig.headers.length;
    // NOTE: dup'd in ColumnChart.configBlobs
    const blobs = chartConfig.blobs;
    blobs.min = chartConfig.blobs.minVal;
    blobs.max = chartConfig.blobs.maxVal;
    const blobheads = [];
    const bStart = hLen - blobs.blobState.column;
    for (let hhh = bStart; hhh < hLen; hhh++) {
      blobheads.push(chartConfig.headers[hhh]);
    }
    const padding = AxisUtilities.getBarThermoGap(chartConfig);
    // Get side:
    const side = AxisUtilities.getSide(chartConfig.scales);
    const chartType = chartConfig.scales[side].type;
    const accum = chartConfig.scales[side].stacked;
    // Assemble the config object with 'simple' props
    let bounds = JSON.parse(JSON.stringify(this.state.innerBox));
    if (typeof projectionBounds !== 'undefined') {
      bounds = projectionBounds;
    }
    const config = {
      accum,
      bounds,
      blobData: chartConfig.chartData,
      blobheads,
      // blobmeta: chartConfig.blobmeta,
      blobs,
      chartIndex: chartConfig.chartIndex,
      chartType,
      groupName: `blob-group-${chartConfig.chartIndex}`,
      colourLookup: chartConfig.colourLookup,
      duration: chartConfig.duration,
      originalBounds: chartConfig.originalInnerBox,
      outerWidth: chartConfig.outerWidth,
      padding,
      pointCount: chartConfig.pointCount,
      seriesCount: chartConfig.seriesCount,
      testFlag: this.state.blobsTest,
    };
    // And emVal for blobs:
    config.blobs.blobMeta.text.emVal = chartConfig.emVal;
    // HEADERS:
    // NOTE: this is all dup'd in barchart.js...
    // and there's redundancy in header-extraction, too...
    // Separate first (category) column header from subsequent headers:

    // NOTE: do I really need these?
    const actualHeaders = chartConfig.headers.slice();
    config.catHead = actualHeaders.shift();
    config.seriesHeads = actualHeaders;
    // NOTE ends

    // Map blobbed series colours:
    config.colourMap = ChartUtilities.getColourMap(blobheads, colourSet);
    // So, to be clear, the config obj includes properties--
    //      catHead: the category column header
    //      seriesHeads: all subsequent (col 2 etc...) header strings
    //      colourMap: a D3 scale object that maps headers to series colours
    // Y-SCALE:
    const yDomain = chartConfig.chartData.map(ddd => ddd[config.catHead]);
    config.yMainScale = d3.scale
      .ordinal()
      .rangeBands([0, config.bounds.height + padding, 0, 0])
      .domain(yDomain);
    return config;
  }
  // CONFIG BLOBS ends

  // CONFIG SERIES BARS
  // Assembles bar series config object
  configSeriesBars(chartConfig, projectionBounds) {
    // The default name/value lookup of colours
    const colourLookup = chartConfig.colourLookup;
    // Colours for this sequence of series
    const colourSet = chartConfig.series.bar.colours;
    const padding = AxisUtilities.getBarThermoGap(chartConfig);
    // const padding = chartConfig.series.bar.gap;
    let bounds = JSON.parse(JSON.stringify(this.state.innerBox));
    if (typeof projectionBounds !== 'undefined') {
      bounds = projectionBounds;
    }
    // Get side:
    const side = AxisUtilities.getSide(chartConfig.scales);
    const mmO = Object.assign({}, chartConfig.scales[side].minMaxObj.scale);
    // Broken scale...?
    let breakScale = false;
    if (mmO.min > 0) {
      // Bounds have already been adjusted, so comm'd out
      //   bounds.x += chartConfig.xAxis.brokenScalePadding;
      //   bounds.width -= chartConfig.xAxis.brokenScalePadding;
      breakScale = true;
    }
    const chartType = chartConfig.scales[side].type;
    const accum = chartConfig.scales[side].stacked;
    // Assemble the config object with 'simple' props
    const config = {
      accum,
      bounds,
      breakScale,
      brokenScalePadding: chartConfig.xAxis.brokenScalePadding,
      chartData: chartConfig.chartData,
      chartIndex: chartConfig.chartIndex,
      chartType,
      className: `d3-bar-series-group d3-bar-series-group-${chartConfig.chartIndex}`,
      colourLookup,
      colourSet,
      duration: chartConfig.duration,
      // factor: mmO.factor,
      factor: chartConfig.scales[side].factor,
      minVal: mmO.min,
      originalBounds: chartConfig.originalInnerBox,
      padding,
      pointCount: chartConfig.pointCount,
      seriesCount: chartConfig.seriesCount,
      thermometer: chartConfig.thermometer,
      tickProjection: chartConfig.yAxis.ticks.projection,
      zeroPrefs: chartConfig.yAxis.ticks.zero,
    };
    // Mixed +/– flag:
    config.mixedVals = mmO.min < 0 && mmO.max >= 0;
    // X-SCALE (linear)
    config.xScale = d3.scale
      .linear()
      .range([0, config.bounds.width])
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
    // Y-SCALE
    const yMainDomain = chartConfig.chartData.map(ddd => ddd[config.catHead]);
    // On use of 'padding' here, see ColumnChart.configSeriesColumns
    const cwp = ChartUtilities.getSeriesClusterWidthAndPadding(
      chartConfig,
      true,
    );
    const halfClusterWidth = cwp.clusterWidth / 2;
    config.halfClusterWidth = halfClusterWidth;
    config.padding = cwp.padding;
    //
    config.yMainScale = d3.scale
      .ordinal()
      // .rangeBands([0, config.bounds.height + padding], 0, 0)
      .rangeBands(
        [
          // 0 + halfClusterWidth,
          0,
          // config.bounds.height, // - halfClusterWidth + config.padding,
          config.bounds.height + config.padding,
        ],
        0,
        0,
      )
      .domain(yMainDomain);
    // Now, cluster scale (n/a for unstacked, but anyway...)
    config.yClusterScale = d3.scale
      .ordinal()
      .domain(actualHeaders)
      .rangeBands([0, config.yMainScale.rangeBand() - config.padding], 0, 0);
    return config;
  }
  // CONFIG SERIES BARS ends

  // RENDER
  render() {
    const config = this.props.config;
    const chartIndex = config.chartIndex;
    // Key all subcomponents:
    const kids = ChartUtilities.getKeysAndIds(chartIndex);
    // I originally did bounds tests in the order x-axis,
    // y-axis, blobs.
    // But I changed this, Nov'20, when I made provision
    // for projecting bar charts. I do y-axis and blobs
    // first, to settle the IB width. Then do x-axis
    // tests...
    let yaxisJSX = '';
    let blobsJSX = '';
    let xaxisJSX = '';
    let barseriesJSX = '';
    // Render sequence:
    if (this.state.yaxisTest) {
      const yAxisConfig = this.getAxisConfig(config, false);
      // Render yaxis only, with 'test' flag
      yaxisJSX = (
        <SilverYaxisOrdinalTest
          key={kids.yAxisKey}
          config={yAxisConfig}
          onReturnRevisedInnerBox={this.handleYaxisInnerBoxBounds}
        />
      );
    } else if (this.state.blobsTest) {
      const blobsConfig = this.configBlobs(config);
      blobsConfig.bounds = Object.assign({}, this.state.innerBox);
      // Render blobs only, with 'test' flag
      blobsJSX = (
        <SilverYaxisBlobs
          key={kids.blobsKey}
          config={blobsConfig}
          onReturnRevisedInnerBox={this.handleBlobsInnerBoxBounds}
        />
      );
    } else if (this.state.xaxisTest) {
      const xAxisConfig = this.getAxisConfig(config, true);
      xAxisConfig.bounds = JSON.parse(JSON.stringify(this.state.innerBox));
      // Test render, with callback
      xaxisJSX = (
        <SilverXaxisLinearTest
          key={kids.xAxisKey}
          config={xAxisConfig}
          onReturnRevisedInnerBox={this.handleXaxisInnerBoxBounds}
        />
      );
    } else {
      const bounds = JSON.parse(JSON.stringify(this.state.innerBox));
      // NOTE: I don't think I have to reimpose bounds at this stage
      // Pass the final-tweak bounds to the various config handlers
      const xAxisConfig = this.getAxisConfig(config, true, bounds);
      const yAxisConfig = this.getAxisConfig(config, false, bounds);
      const blobsConfig = this.configBlobs(config, bounds);
      const seriesConfig = this.configSeriesBars(config, bounds);
      // 'Live' render: all children
      xaxisJSX = <SilverXaxisLinear key={kids.xAxisKey} config={xAxisConfig} />;
      yaxisJSX = (
        <SilverYaxisOrdinal key={kids.yAxisKey} config={yAxisConfig} />
      );
      if (blobsConfig.blobs.blobState.column > 0) {
        blobsJSX = (
          <SilverYaxisBlobs
            key={kids.blobsKey}
            config={blobsConfig}
            onReturnRevisedInnerBox={this.handleBlobsInnerBoxBounds}
          />
        );
      }
      // NOTE: I need to look at event-handling
      barseriesJSX = (
        <SilverSeriesBar
          key={kids.barSeriesKey}
          config={seriesConfig}
          onPassBarClick={this.handleBarClick}
        />
      );
    }

    // General and indexed class for main group:
    const mainGroupClass = this.getMainGroupClass(false, true);

    // NOTE: I can draw a temporary 'inner box'
    // so I can see what I've got...
    // const rectStyle = {
    //   fill: '#aa5',
    //   width: this.state.innerBox.width,
    //   height: this.state.innerBox.height,
    //   x: 0,
    //   y: 0,
    // };
    // Next goes to top of JSX stack
    // <rect style={rectStyle} />

    const chartComponentsJSX = (
      <g className={mainGroupClass} key={kids.mainGroupKey} id={kids.contentId}>
        {xaxisJSX}
        {yaxisJSX}
        {blobsJSX}
        {barseriesJSX}
        <g className={kids.zeroId} id={kids.zeroId} />
      </g>
    );
    return chartComponentsJSX;
  }
}

SilverBarChart.propTypes = {
  config: PropTypes.object.isRequired,
};

export default SilverBarChart;
