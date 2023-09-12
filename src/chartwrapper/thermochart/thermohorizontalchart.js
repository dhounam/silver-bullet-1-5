import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities modules
import * as ChartUtilities from '../chart-utilities'
import * as AxisUtilities from '../axes/axis-utilities'
import ConfigXaxisLinear from '../axes/configuration/xaxis-linear-config'
import ConfigYaxisOrdinal from '../axes/configuration/yaxis-ordinal-config'
import SilverXaxisLinear from '../axes/live/xaxis-linear'
import SilverXaxisLinearTest from '../axes/tests/xaxis-linear-test'
import SilverYaxisOrdinal from '../axes/live/yaxis-ordinal'
import SilverYaxisOrdinalTest from '../axes/tests/yaxis-ordinal-test'
import SilverThermoHorizontalSeries from './thermohorizontalseries'
import SilverYaxisBlobs from '../blobs/yaxis-blobs'

class SilverThermoHorizontalChart extends Component {
  // CONSTRUCTOR
  constructor(props) {
    super(props)
    this.state = {
      // flags to control subcomponent testing/rendering
      xaxisTest: true,
      yaxisTest: false,
      blobsTest: false,
      // updated innerBox bounds
      innerBox: this.props.config.innerBox,
    }
    // Callbacks from axis and blobs tests:
    this.handleXaxisInnerBoxBounds = this.handleXaxisInnerBoxBounds.bind(this)
    this.handleYaxisInnerBoxBounds = this.handleYaxisInnerBoxBounds.bind(this)
    this.handleBlobsInnerBoxBounds = this.handleBlobsInnerBoxBounds.bind(this)
    // Click on thermo
    this.handleThermoClick = this.handleThermoClick.bind(this)
  }

  // COMPONENT WILL MOUNT
  // Puts inherited innerBox into state:
  // componentWillMount() {
  //   this.setState({ innerBox: this.props.config.innerBox });
  // }

  // COMPONENT DID MOUNT
  componentDidMount() {
    this.mainDthreeGroupTransition(0)
  }

  // COMPONENT WILL RECEIVE PROPS
  // Reset state to default...
  UNSAFE_componentWillReceiveProps(newProps) {
    this.setState({
      innerBox: newProps.config.innerBox,
      xaxisTest: true,
      yaxisTest: false,
      blobsTest: false,
    })
  }

  // Callbacks:
  // HANDLE X-AXIS INNER BOX BOUNDS
  // ...fields the revised innerBox (after axis testing)
  handleXaxisInnerBoxBounds(innerBox) {
    this.setState({
      innerBox,
      // Set flags for render 2 (y-axis test)
      xaxisTest: false,
      yaxisTest: true,
      blobsTest: false,
    })
  }

  // HANDLE Y-AXIS INNER BOX BOUNDS
  handleYaxisInnerBoxBounds(innerBox) {
    this.setState({
      innerBox,
      // Set flags for render 3 (blobs test)
      xaxisTest: false,
      yaxisTest: false,
      blobsTest: true,
    })
  }

  // HANDLE BLOBS INNER BOX BOUNDS
  handleBlobsInnerBoxBounds(innerBox) {
    this.setState({
      innerBox,
      // Set flags for render 4 (final)
      xaxisTest: false,
      yaxisTest: false,
      blobsTest: false,
    })
    // const duration = this.props.config.duration;
    // NOTE: set to zero to prevent visible drop-in from top left...
    // NOTE: if I'm going to use a zero duration regularly, put it into prefs
    const duration = 0
    this.mainDthreeGroupTransition(duration)
  }

  // HANDLE THERMO CLICK EVENT
  // This is potentially useful... maybe...
  handleThermoClick(event) {
    const thermoData = event.colData
    // const index = event.index;
    const info = `Value is ${thermoData.category}`
    /* eslint-disable no-console */
    console.log(info)
    /* eslint-enable no-console */
  }
  // HANDLE THERMO CLICK EVENT ends
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
    const innerBox = this.state.innerBox
    const bLeft = innerBox.x
    const bTop = innerBox.y
    const transStr = `translate(${bLeft}, ${bTop})`
    const mainGroupClass = this.getMainGroupClass(true, false)
    const mainGroup = d3.select(mainGroupClass)
    mainGroup
      .transition()
      .duration(duration)
      .attr('transform', transStr)
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
    let dot = ''
    let generalClass = ''
    if (prefixDot) {
      dot = '.'
    }
    if (addGeneralClass) {
      generalClass = `${dot}chart-main-group`
    }
    return `${generalClass} ${dot}chart-main-group-${this.props.config.chartIndex}`
  }
  // GET MAIN GROUP CLASS ends

  //
  // ==================================
  // D3 component configuration objects:
  // ==================================

  // GET AXIS CONFIG
  // Hands off to function in axis-utilities. 2nd param is a flag
  // for x- or y-axis.
  // NOTE: for horizontal thermo charts, I have no option for x-axis at top or bottom...
  getAxisConfig(chartConfig, isXaxis) {
    let axisConfig = {}
    // Go to state for the innerBox, since that
    // gets modified by the callback from margin check...
    const innerBox = Object.assign({}, this.state.innerBox)
    if (isXaxis) {
      // Utility fcn; 3rd arg is testFlag
      axisConfig = ConfigXaxisLinear(
        chartConfig,
        innerBox,
        this.state.xaxisTest
      )
    } else {
      axisConfig = ConfigYaxisOrdinal(
        chartConfig,
        innerBox,
        this.state.yaxisTest
      )
    }
    return axisConfig
  }
  // GET AXIS CONFIG ends

  // CONFIG BLOBS
  // Assembles blob config object for horizontal thermos (y-axis)
  // Dangerously close to a dupe of barchart
  configBlobs(chartConfig) {
    // Define props required for more than immediate slot-in to config
    const colourSet = chartConfig.series.thermohorizontal.colours
    // Extract blob headers.
    // headers is complete list
    const hLen = chartConfig.headers.length
    const blobs = chartConfig.blobs
    blobs.min = chartConfig.blobs.minVal
    blobs.max = chartConfig.blobs.maxVal
    const blobheads = []
    const bStart = hLen - blobs.blobState.column
    for (let hhh = bStart; hhh < hLen; hhh++) {
      blobheads.push(chartConfig.headers[hhh])
    }
    const padding = AxisUtilities.getBarThermoGap(chartConfig)
    // Get side:
    const side = AxisUtilities.getSide(chartConfig.scales)
    const chartType = chartConfig.scales[side].type
    const accum = chartConfig.scales[side].stacked
    // Dot markers: bar or circle?
    let dotFlag = chartConfig.scales[side].thermoDots
    if (typeof dotFlag === 'undefined') {
      dotFlag = false
    }
    // Assemble the config object with 'simple' props
    const config = {
      accum,
      bounds: this.state.innerBox,
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
    }
    // And emVal for blobs:
    config.blobs.blobMeta.text.emVal = chartConfig.emVal
    // HEADERS:
    // NOTE: this is all dup'd elsewhere...
    // and there's redundancy in header-extraction, too...
    // Separate first (category) column header from subsequent headers:

    // NOTE: do I really need these?
    const actualHeaders = chartConfig.headers.slice()
    config.catHead = actualHeaders.shift()
    config.seriesHeads = actualHeaders
    // NOTE ends

    // Map blobbed series colours:
    config.colourMap = ChartUtilities.getColourMap(blobheads, colourSet)
    // So, to be clear, the config obj includes properties--
    //      catHead: the category column header
    //      seriesHeads: all subsequent (col 2 etc...) header strings
    //      colourMap: a D3 scale object that maps headers to series colours
    // Y-SCALE:
    const yDomain = chartConfig.chartData.map((ddd) => ddd[config.catHead])
    // Offset from IB top and bottom:
    let tickOffset = 0
    // if (chartConfig.thermometer) {
    if (dotFlag) {
      tickOffset = chartConfig.series.thermohorizontal.dot.radius
    } else {
      tickOffset = chartConfig.series.thermohorizontal.line.length / 2
    }
    // } else {
    //   const gap = AxisUtilities.getBarThermoGap(chartConfig);
    //   tickOffset =
    //     AxisUtilities.getClusterWidth(bounds.height, config.pointCount, gap) /
    //     2;
    // }
    config.yMainScale = d3.scale
      .ordinal()
      // .rangeBands([0, config.bounds.height + padding, 0, 0])
      .rangePoints([tickOffset, config.bounds.height - tickOffset], 0, 0)
      .domain(yDomain)
    return config
  }
  // CONFIG BLOBS ends

  // CONFIG SERIES THERMO
  // Assembles bar series config object
  configSeriesThermos(chartConfig) {
    // The default name/value lookup of colours
    const colourLookup = chartConfig.colourLookup
    // Colours for this sequence of series
    const colourSet = chartConfig.series.thermohorizontal.colours
    const bounds = Object.assign({}, this.state.innerBox)
    const padding = chartConfig.series.thermohorizontal.gap
    // Get side:
    const side = AxisUtilities.getSide(chartConfig.scales)
    const mmO = Object.assign({}, chartConfig.scales[side].minMaxObj.scale)
    const isLog = chartConfig.scales[side].log
    // Broken scale...?
    // It seems that I don't have to do anything, since
    // bounds were adjusted somewhere up the line (presumably
    // in y-axis...)
    // NOTE: if you ever have time, check this
    let breakScale = false
    if (mmO.min > 0 && !isLog) {
      // bounds.x += chartConfig.xAxis.brokenScalePadding;
      // bounds.width -= chartConfig.xAxis.brokenScalePadding;
      breakScale = true
    }
    const chartType = chartConfig.scales[side].type
    // Dot markers?
    let dotFlag = chartConfig.scales[side].thermoDots
    if (typeof dotFlag === 'undefined') {
      dotFlag = false
    }
    // Assemble the config object with 'simple' props
    const config = {
      dotFlag,
      blobHeader: chartConfig.blobs.blobState.header,
      bounds,
      breakScale,
      brokenScalePadding: chartConfig.yAxis.brokenScalePadding.thermoHorizontal,
      chartData: chartConfig.chartData,
      chartIndex: chartConfig.chartIndex,
      chartType,
      className: `d3-thermo-series-group d3-thermo-series-group-${chartConfig.chartIndex}`,
      colourLookup,
      colourSet,
      duration: chartConfig.duration,
      factor: chartConfig.scales[side].factor,
      isLog,
      minVal: mmO.min,
      originalBounds: chartConfig.originalInnerBox,
      padding,
      pointCount: chartConfig.pointCount,
      seriesCount: chartConfig.seriesCount,
      styles: chartConfig.series.thermohorizontal,
      thermometer: chartConfig.thermometer,
      tickProjection: chartConfig.yAxis.ticks.projection,
      zeroPrefs: chartConfig.yAxis.ticks.zero,
    }
    // Mixed +/– flag:
    config.mixedVals = mmO.min < 0 && mmO.max >= 0
    // X-SCALE (linear)
    if (isLog) {
      config.xScale = d3.scale
        .log()
        .range([0, bounds.width])
        .domain([mmO.min, mmO.max])
    } else {
      config.xScale = d3.scale
        .linear()
        .range([0, bounds.width])
        .domain([mmO.min, mmO.max])
    }
    // HEADERS:
    // NOTE: this is all dup'd in barchart.js...
    // and there's redundancy in header-extraction, too...
    // Separate first (category) column header from subsequent headers:
    config.catHead = chartConfig.headers[0]
    // Now exclude any blob headers:
    const actualHeaders = []
    for (let iii = 1; iii <= chartConfig.seriesCount; iii++) {
      if (chartConfig.headers[iii] !== chartConfig.blobs.blobState.header) {
        actualHeaders.push(chartConfig.headers[iii])
      }
    }
    config.seriesHeads = actualHeaders
    // Map series colours:
    config.colourMap = ChartUtilities.getColourMap(actualHeaders, colourSet)
    // So, to be clear, the config obj includes properties--
    //      catHead: the category column header
    //      seriesHeads: all subsequent (col 2 etc...) header strings
    //      colourMap: a D3 scale object that maps headers to series colours
    // Y-SCALE
    const yMainDomain = chartConfig.chartData.map((ddd) => ddd[config.catHead])
    // Offset from IB top and bottom:
    let tickOffset = 0
    if (chartConfig.thermometer) {
      if (dotFlag) {
        tickOffset = config.styles.dot.radius
      } else {
        tickOffset = config.styles.line.length / 2
      }
    }
    /*
     else {
      // FIXME: actually this fork is surely redundant...
      // ...and some sort of leftover from bar charts, or something
      // NOTE: I've comm'd this out. Does anything in
      // this fork actually do anything useful?
      // const gap = AxisUtilities.getBarThermoGap(chartConfig);
      // tickOffset =
      //   AxisUtilities.getClusterWidth(bounds.height, config.pointCount, gap) /
      //   2;
      tickOffset = AxisUtilities.getHalfClusterWidthForAxis(config, false);
      // NOTE: really? Surely, for thermos:
      // NOTE: well, this is arbitrary; does it do anything useful?
      tickOffset = 0;
    }
    */
    config.yMainScale = d3.scale
      .ordinal()
      .rangePoints([tickOffset, config.bounds.height - tickOffset], 0, 0)
      .domain(yMainDomain)
    return config
  }
  // CONFIG SERIES THERMO ends

  // RENDER
  render() {
    const config = this.props.config
    const chartIndex = config.chartIndex
    // Key all subcomponents:
    const kids = ChartUtilities.getKeysAndIds(chartIndex)

    let xaxisJSX = ''
    let yaxisJSX = ''
    let blobsJSX = ''
    let thermoseriesJSX = ''
    // Render sequence:
    if (this.state.xaxisTest) {
      const xAxisConfig = this.getAxisConfig(config, true)
      // Render xaxis only, with 'test' flag
      xaxisJSX = (
        <SilverXaxisLinearTest
          key={kids.xAxisKey}
          config={xAxisConfig}
          onReturnRevisedInnerBox={this.handleXaxisInnerBoxBounds}
        />
      )
    } else if (this.state.yaxisTest) {
      const yAxisConfig = this.getAxisConfig(config, false)
      yAxisConfig.bounds = this.state.innerBox
      // Render yaxis only, with 'test' flag
      yaxisJSX = (
        <SilverYaxisOrdinalTest
          key={kids.yAxisKey}
          config={yAxisConfig}
          onReturnRevisedInnerBox={this.handleYaxisInnerBoxBounds}
        />
      )
    } else if (this.state.blobsTest) {
      const blobsConfig = this.configBlobs(config)
      blobsConfig.bounds = this.state.innerBox
      // Render blobs only, with 'test' flag
      blobsJSX = (
        <SilverYaxisBlobs
          key={kids.blobsKey}
          config={blobsConfig}
          onReturnRevisedInnerBox={this.handleBlobsInnerBoxBounds}
        />
      )
    } else {
      // Update config objects with 'latest' bounds:
      const xAxisConfig = this.getAxisConfig(config, true)
      xAxisConfig.bounds = this.state.innerBox
      const yAxisConfig = this.getAxisConfig(config, false)
      yAxisConfig.bounds = this.state.innerBox
      const blobsConfig = this.configBlobs(config)
      blobsConfig.bounds = this.state.innerBox
      const seriesConfig = this.configSeriesThermos(config)
      seriesConfig.bounds = this.state.innerBox
      // Full render: all children
      // NOTE: do I need events on IB bounds this time?
      xaxisJSX = <SilverXaxisLinear key={kids.xAxisKey} config={xAxisConfig} />
      yaxisJSX = <SilverYaxisOrdinal key={kids.yAxisKey} config={yAxisConfig} />
      if (blobsConfig.blobs.blobState.column > 0) {
        blobsJSX = (
          <SilverYaxisBlobs
            key={kids.blobsKey}
            config={blobsConfig}
            onReturnRevisedInnerBox={this.handleBlobsInnerBoxBounds}
          />
        )
      }
      // NOTE: I need to look at event-handling
      thermoseriesJSX = (
        <SilverThermoHorizontalSeries
          spindlesId={kids.thermoSpindlesId}
          seriesKey={kids.thermoSeriesKey}
          config={seriesConfig}
          onPassThermoClick={this.handleThermoClick}
        />
      )
    }

    // General and indexed class for main group:
    const mainGroupClass = this.getMainGroupClass(false, true)

    // NOTE: I can draw a temporary 'inner box'
    // so I can see what I've got...
    // const rectStyle = {
    //   fill: '#aa5',
    //   width: this.state.innerBox.width,
    //   height: this.state.innerBox.height,
    //   x: 0,
    //   y: 0,
    // };
    // <rect style={rectStyle} />

    // Structure changes according to number of series
    let sCount = config.seriesCount
    if (config.blobs.hasBlobs) {
      sCount--
    }
    // Default is more than one series:
    let chartComponentsJSX = (
      <g className={mainGroupClass} key={kids.mainGroupKey} id={kids.contentId}>
        {yaxisJSX}
        {xaxisJSX}
        {blobsJSX}
        <g className={kids.zeroId} id={kids.zeroId} />
        <g className={kids.thermoSpindlesId} id={kids.thermoSpindlesId} />
        {thermoseriesJSX}
      </g>
    )
    // But if only one series, zeroline is in front of spindles
    if (sCount < 2) {
      chartComponentsJSX = (
        <g
          className={mainGroupClass}
          key={kids.mainGroupKey}
          id={kids.contentId}
        >
          {yaxisJSX}
          {xaxisJSX}
          {blobsJSX}
          <g className={kids.thermoSpindlesId} id={kids.thermoSpindlesId} />
          <g className={kids.zeroId} id={kids.zeroId} />
          {thermoseriesJSX}
        </g>
      )
    }
    return chartComponentsJSX
  }
}

SilverThermoHorizontalChart.propTypes = {
  config: PropTypes.object.isRequired,
}

export default SilverThermoHorizontalChart
