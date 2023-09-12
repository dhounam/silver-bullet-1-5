import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities modules
import * as ChartUtilities from '../chart-utilities'
// import * as AxisUtilities from '../axes/axis-utilities';
import * as BrokenScale from '../axes/broken-scale'
import ConfigXaxisLinear from '../axes/configuration/xaxis-linear-config'
import ConfigYaxisLinear from '../axes/configuration/yaxis-linear-config'
// D3 sub-components:
import SilverXaxisLinear from '../axes/live/xaxis-linear'
import SilverXaxisLinearTest from '../axes/tests/xaxis-linear-test'
import SilverYaxisLinear from '../axes/live/yaxis-linear'
import SilverYaxisLinearTest from '../axes/tests/yaxis-linear-test'
import SilverScatterSeries from './scatterseries'

class SilverScatterChart extends Component {
  // CONSTRUCTOR
  constructor(props) {
    super(props)
    this.state = {
      // flags to control subcomponent testing/rendering
      yaxisTest: false,
      // NOTE: assumption that x-axis is at bottom
      xaxisTest: false,
      // updated innerBox bounds
      innerBox: this.props.config.innerBox,
    }
    // Callbacks from axis tests:
    this.handleXaxisInnerBoxBounds = this.handleXaxisInnerBoxBounds.bind(this)
    this.handleYaxisInnerBoxBounds = this.handleYaxisInnerBoxBounds.bind(this)
    // Click on any scatter-dot
    // this.handleScatterDotClick = this.handleScatterDotClick.bind(this);
  }

  // COMPONENT WILL MOUNT
  // Puts inherited innerBox into state:
  UNSAFE_componentWillMount() {
    this.setState({
      yaxisTest: true,
      xaxisTest: false,
      innerBox: this.props.config.innerBox,
    })
  }

  // COMPONENT DID MOUNT
  UNSAFE_componentDidMount() {
    this.mainDthreeGroupTransition(0)
  }

  // COMPONENT WILL RECEIVE PROPS
  // Reset state to default...
  UNSAFE_componentWillReceiveProps(newProps) {
    this.setState({
      innerBox: newProps.config.innerBox,
      yaxisTest: true,
      xaxisTest: false,
    })
  }

  // Callbacks:
  // HANDLE Y-AXIS INNER BOX BOUNDS
  // ...fields the revised innerBox, allowing for axis labels.
  // It also sets state.postYaxisBounds, which represents the
  // chart area after allowing for yaxis labels and before the
  // IB is adjusted for projecting x-axis category strings.
  handleYaxisInnerBoxBounds(innerBox) {
    this.setState({
      innerBox,
      // postYaxisBounds: Object.assign({}, innerBox),
      yaxisTest: false,
      xaxisTest: true,
    })
  }

  // HANDLE X-AXIS INNER BOX BOUNDS
  // ...fields the revised innerBox after calculating axis adjustments
  handleXaxisInnerBoxBounds(innerBox) {
    // Firing off an error msg if IB is on the small side...
    // ...deleted Feb'21
    // ...and set state. All test-flags are false, so 'real' render
    this.setState({
      innerBox,
      yaxisTest: false,
      xaxisTest: false,
    })
    // NOTE: set to zero to prevent visible drop-in from top left...
    const duration = 0
    this.mainDthreeGroupTransition(duration)
  }

  handleDotClick(event) {
    const dotData = event.dotData
    // const index = event.index;
    const info = `You clicked on ${dotData.category}`
    /* eslint-disable no-console */
    console.log(info)
    /* eslint-enable no-console */
  }

  // MAIN D3 GROUP TRANSITION
  // After adjustments have been made to the background elements,
  // moves main D3 group into position
  // NB: This isn't interested in mainGroup *size* -- only in location
  // NOTE: dup'ed in every chart-type component. Surely can go
  // somewhere shared...
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
  // Hands off to function in axis-utilities.
  // Params: config object, flag for x/y-axis, flag for y-axis side (left/right)
  getAxisConfig(chartConfig, isXaxis, yAxisSide) {
    let axisConfig = {}
    const innerBox = Object.assign({}, this.state.innerBox)
    if (isXaxis) {
      // Check for test...
      const testFlag = this.state.xaxisTest
      axisConfig = ConfigXaxisLinear(chartConfig, innerBox, testFlag)
    } else {
      const testFlag = this.state.yaxisTest
      axisConfig = ConfigYaxisLinear(chartConfig, innerBox, testFlag, yAxisSide)
    }
    return axisConfig
  }
  // GET AXIS CONFIG ends

  getSeriesConfig(chartConfig) {
    // The default name/value lookup of colours
    const colourLookup = chartConfig.colourLookup
    const chartType = chartConfig.scales.left.type
    // Series preferences
    const seriesPrefs = chartConfig.series[chartType]
    // Colours for this sequence of series
    const colourSet = seriesPrefs.colours
    const bounds = Object.assign({}, this.state.innerBox)
    // Is this a simple or 'sized' scatter
    const isSized = chartConfig.scales.left.type.includes('sized')
    const leftLog = chartConfig.scales.left.log
    const rightLog = chartConfig.scales.right.log
    // Label points? Trendline:
    const labels = chartConfig.scales.left.scatterLabels
    const trendline = chartConfig.scales.left.scatterTrendline
    const mmoX = Object.assign({}, chartConfig.scales.left.minMaxObj.scale)
    const mmoY = Object.assign({}, chartConfig.scales.right.minMaxObj.scale)
    const mmoZ = chartConfig.scales.z
    // Min and max dot *size*:
    const zAxisBounds = {
      min: mmoZ.min,
      max: mmoZ.max,
    }
    const brokenScalePadding = BrokenScale.getYaxisBrokenScalePadding(
      chartType,
      chartConfig
    )
    // Fix, 27.6.23: previously tested leftLog (i.e. the x-axis), which is ludicrous
    // Subtract padding if y-axis is (a) unlogged and (b) broken
    if (!rightLog && mmoY.min > 0) {
      bounds.height -= brokenScalePadding
    }

    const config = {
      bounds,
      chartData: chartConfig.chartData,
      chartIndex: chartConfig.chartIndex,
      className: `d3-scatter-series-group d3-scatter-series-group-${chartConfig.chartIndex}`,
      colourLookup,
      colourSet,
      emVal: chartConfig.emVal,
      forceTurn: chartConfig.forceTurn,
      isSized,
      labels,
      leftLog,
      rightLog,
      maxXval: mmoX.max,
      minXval: mmoY.min,
      maxYval: mmoX.max,
      minYval: mmoY.min,
      maxZval: mmoZ.actualMax,
      minZval: mmoZ.actualMin,
      originalBounds: chartConfig.originalInnerBox,
      outerWidth: chartConfig.outerWidth,
      pointCount: chartConfig.pointCount,
      seriesCount: chartConfig.seriesCount,
      seriesPrefs,
      trendline,
      xFactor: chartConfig.scales.left.factor,
      yFactor: chartConfig.scales.right.factor,
      zeroPrefs: chartConfig.yAxis.ticks.zero,
      zAxisBounds,
      zAxisHeader: chartConfig.axisHeaders.zaxis,
    }
    // Map series colours, excluding cats column. But scatter headers
    // are by cluster...
    // FIXME: this duplicates code in legends.assembleLegendSets
    // (and, I suspect, elsewhere)
    // Number of data-'columns' per series. Default (non-scatters) is 1
    let clusterNo = 2
    if (config.isSized) {
      clusterNo = 3
    }
    config.clusterNo = clusterNo
    const headers = Object.assign([], chartConfig.headers)
    // Extract cat header
    config.catHead = headers.shift()
    config.headers = headers
    // Filter to first header in each cluster
    const clusterHeaders = headers.filter((head, iii) => iii % clusterNo === 0)
    config.colourMap = ChartUtilities.getColourMap(clusterHeaders, colourSet)
    // So, to be clear, the config obj includes properties--
    //      catHead: the category column header
    //      headers: ALL subsequent (col 2 etc...) header strings
    //      colourMap: a D3 scale object that maps the first header in each cluster to series colours
    // X-scale object
    const invertX = false
    let xDomainArray = [mmoX.min, mmoX.max]
    if (invertX) {
      xDomainArray = [mmoX.max, mmoX.min]
    }
    if (leftLog) {
      config.xScale = d3.scale
        .log()
        .range([0, bounds.width])
        .domain(xDomainArray)
    } else {
      config.xScale = d3.scale
        .linear()
        .range([0, bounds.width])
        .domain(xDomainArray)
    }
    // Y-scale object
    // Assemble the scale object
    let yDomainArray = [mmoY.min, mmoY.max]
    const invertY = false
    if (invertY) {
      yDomainArray = [mmoY.max, mmoY.min]
    }
    if (rightLog) {
      config.yScale = d3.scale
        .log()
        .range([bounds.height, 0])
        .domain(yDomainArray)
    } else {
      config.yScale = d3.scale
        .linear()
        .range([bounds.height, 0])
        .domain(yDomainArray)
    }
    return config
  }

  // GET SCATTER SERIES JSX
  getScatterSeriesJsx(config, key) {
    const seriesConfig = this.getSeriesConfig(config)
    const seriesJsx = (
      <SilverScatterSeries
        key={key}
        config={seriesConfig}
        onPassDotClick={this.handleDotClick}
      />
    )
    return seriesJsx
  }
  // GET SCATTER SERIES JSX ends

  // GET Y-AXIS JSX
  // Ideally, these would be in AxisUtilities, shared by all chart
  // types. The trouble is, it needs access to state, so unless I'm
  // going to start passing state around as a param, it has to live
  // here, and all chart-type components will duplicate this code...
  // FIXME: that's bollocks. I need the IB, which is in state, but that
  // can be passed into a shared function...
  getYaxisJsx(config, key) {
    // FIXME: I really need to refactor this 'left'/'right' side shit
    // Axes need to be x or y.
    // BUT FOR NOW...
    // Scatters read 'left' as the x-axis and 'right' as the y-axis
    // But they can draw the y-axis to the left or right of the chart!
    // So there's a flag to tell us which:
    const side = config.yAxis.orient.scatter
    const axisConfig = this.getAxisConfig(config, false, side)
    axisConfig.bounds = this.state.innerBox
    // Render yaxis, with 'test' flag to get margin
    const callbackHandler = this.handleYaxisInnerBoxBounds
    let axisJsx = ''
    if (this.state.yaxisTest) {
      axisJsx = (
        <SilverYaxisLinearTest
          key={`${key}-test-${side}`}
          config={axisConfig}
          onReturnRevisedInnerBox={callbackHandler}
        />
      )
    } else {
      axisJsx = (
        <SilverYaxisLinear key={`${key}-test-${side}`} config={axisConfig} />
      )
    }
    return axisJsx
  }
  // GET Y-AXIS JSX ends

  // GET X-AXIS JSX
  // Called from render to assemble x-axis jsx
  getXaxisJsx(config, key) {
    // Fcn in this component pulls a couple of strings, then calls
    // fcn in AxisUtilities... and the result is the axis config obj.
    const axisConfig = this.getAxisConfig(config, true)
    axisConfig.bounds = this.state.innerBox
    let xaxisJsx = ''
    if (this.state.xaxisTest) {
      xaxisJsx = (
        <SilverXaxisLinearTest
          key={key}
          config={axisConfig}
          onReturnRevisedInnerBox={this.handleXaxisInnerBoxBounds}
        />
      )
    } else {
      xaxisJsx = <SilverXaxisLinear key={key} config={axisConfig} />
    }
    return xaxisJsx
  }
  // GET X-AXIS JSX ends

  render() {
    const config = this.props.config
    const chartIndex = config.chartIndex
    // Key strings for all subcomponents:
    const kids = ChartUtilities.getKeysAndIds(chartIndex)

    // Custom config objects for the various d3 components
    // See linechart.js
    // Default empty jsx
    let xaxisJSX = ''
    let yaxisJSX = ''
    let scatterSeriesJSX = ''
    // Render sequence:
    // Either the tests, where we render individual components...
    if (this.state.yaxisTest) {
      yaxisJSX = this.getYaxisJsx(config, kids.yAxisKey)
    } else if (this.state.xaxisTest) {
      xaxisJSX = this.getXaxisJsx(config, kids.xAxisKey)
    } else {
      // ...or, when all tests are done, full render, with all children
      xaxisJSX = this.getXaxisJsx(config, kids.xAxisKey)
      yaxisJSX = this.getYaxisJsx(config, kids.yAxisKey)
      scatterSeriesJSX = this.getScatterSeriesJsx(config, kids.scatterSeriesKey)
      // seriesConfig.bounds = this.state.innerBox;
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

    // zeroline-group is in front of yaxis, behind series;
    // for zero line, if any, and other possible
    // furniture that has to overlay other elements

    const chartComponentsJSX = (
      <g className={mainGroupClass} key={kids.mainGroupKey} id={kids.contentId}>
        {xaxisJSX}
        {yaxisJSX}
        <g className={kids.zeroId} id={kids.zeroId} />
        {scatterSeriesJSX}
      </g>
    )
    return chartComponentsJSX
  }
}

SilverScatterChart.propTypes = {
  config: PropTypes.object.isRequired,
}

export default SilverScatterChart
