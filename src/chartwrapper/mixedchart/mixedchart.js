// NOTE: while I'm messing around...

import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities modules
import * as ChartUtilities from '../chart-utilities'
import * as AxisUtilities from '../axes/axis-utilities'
import ConfigXaxisOrdinal from '../axes/configuration/xaxis-ordinal-config'
import ConfigYaxisLinear from '../axes/configuration/yaxis-linear-config'
import * as BrokenScale from '../axes/broken-scale'
// D3 sub-components:
import SilverXaxisOrdinal from '../axes/live/xaxis-ordinal'
import SilverXaxisOrdinalTest from '../axes/tests/xaxis-ordinal-test'
import SilverYaxisLinear from '../axes/live/yaxis-linear'
import SilverYaxisLinearTest from '../axes/tests/yaxis-linear-test'
import SilverXaxisBlobs from '../blobs/xaxis-blobs'
import SilverSeriesColumn from '../columnchart/columnseries'
import SilverSeriesLine from '../linechart/lineseries'

class SilverMixedChart extends Component {
  // CONSTRUCTOR
  constructor(props) {
    super(props)
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
    }
    // Callbacks from axis and blobs tests:
    this.handleXaxisInnerBoxBounds = this.handleXaxisInnerBoxBounds.bind(this)
    this.handleYaxisInnerBoxBoundsLeft = this.handleYaxisInnerBoxBoundsLeft.bind(
      this
    )
    this.handleYaxisInnerBoxBoundsRight = this.handleYaxisInnerBoxBoundsRight.bind(
      this
    )
    this.handleBlobsInnerBoxBounds = this.handleBlobsInnerBoxBounds.bind(this)
    // Click on column
    this.handleColumnClick = this.handleColumnClick.bind(this)
    // Click on line
    this.handleLineClick = this.handleLineClick.bind(this)
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
    })
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    this.mainDthreeGroupTransition(0)
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
    })
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
    this.setState({
      innerBox,
      postYaxisBounds: Object.assign({}, innerBox),
      // Set flags for render 3 (blobs test)
      yaxisTestLeft: false,
      yaxisTestRight: true,
      xaxisTest: false,
      blobsTest: false,
    })
  }

  handleYaxisInnerBoxBoundsRight(innerBox) {
    this.setState({
      innerBox,
      postYaxisBounds: Object.assign({}, innerBox),
      // Set flags for render 3 (blobs test)
      yaxisTestLeft: false,
      yaxisTestRight: false,
      xaxisTest: true,
      blobsTest: false,
    })
  }

  // HANDLE X-AXIS INNER BOX BOUNDS
  // ...fields the revised innerBox after calculating axis adjustments
  handleXaxisInnerBoxBounds(result) {
    this.setState({
      innerBox: result.bounds,
      granularity: result.granularity,
      yaxisTestLeft: false,
      yaxisTestRight: false,
      xaxisTest: false,
      blobsTest: true,
    })
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
    })
    // const duration = this.props.config.duration;
    // NOTE: set to zero to prevent visible drop-in from top left...
    // NOTE: if I'm going to use a zero duration regularly, put it into prefs
    const duration = 0
    this.mainDthreeGroupTransition(duration)
  }

  // HANDLE COLUMN CLICK EVENT
  // This is potentially useful... maybe...
  handleColumnClick(event) {
    const colData = event.colData
    // const index = event.index;
    const info = `Value is ${colData.val}`
    /* eslint-disable no-console */
    console.log(info)
    /* eslint-enable no-console */
  }
  // HANDLE COLUMN CLICK EVENT ends

  // HANDLE LINE CLICK EVENT
  // This is potentially useful... maybe...
  // NOTE: both column and line click handlers are duplicated
  // in Columnchart and Linechart respectively
  handleLineClick(event) {
    // const dataPt = event.seriesData[event.index];
    const header = event.header
    const cat = event.category
    const val = event.val
    const info = `You clicked on series: ${header}; category: ${cat} and value ${val}`
    /* eslint-disable no-console */
    console.log(info)
    /* eslint-enable no-console */
  }
  // HANDLE LINE CLICK EVENT ends

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

  // GET X-AXIS CONFIG
  // Hands off to function in axis-utilities.
  // Params is CO
  getXaxisConfig(chartConfig) {
    const innerBox = this.state.innerBox
    // Check for test...
    const testFlag = this.state.xaxisTest
    const granularity = this.state.granularity
    const axisConfig = ConfigXaxisOrdinal(
      chartConfig,
      innerBox,
      testFlag,
      granularity
    )
    return axisConfig
  }
  // GET X-AXIS CONFIG ends

  // GET Y-AXIS CONFIG
  getYaxisConfig(chartConfig, side, testFlag) {
    const innerBox = Object.assign({}, this.state.innerBox)
    const axisConfig = ConfigYaxisLinear(chartConfig, innerBox, testFlag, side)
    return axisConfig
  }
  // GET Y-AXIS CONFIG ends

  // CONFIG BLOBS
  // Assembles blob config object for columns (x-axis)
  // NOTE: I updated this to 'match' other chart-types, Nov 2017
  // NOTE: But since the restyle doesn't implement mixed yet,
  //        this is untested...
  configBlobs(chartConfig) {
    // Define props required for more than immediate slot-in to config
    // const colourSet = chartConfig.series.colours;
    // Extract blob headers.
    // headers is complete list
    // const hLen = chartConfig.headers.length;
    // Neither of the above is used, so why defined?
    // blobmeta.columns is number from end
    // NOTE: dup'd in Line/Barchart.configBlobs
    const blobs = chartConfig.blobs
    const padding = chartConfig.series.gap
    // Get side:
    const side = AxisUtilities.getSide(chartConfig.scales)
    const chartType = chartConfig.scales[side].type
    const accum = chartConfig.scales[side].stacked
    // Assemble the config object with 'simple' props
    const config = {
      accum,
      blobs,
      blobData: chartConfig.chartData,
      bounds: this.state.innerBox,
      chartIndex: chartConfig.chartIndex,
      chartType,
      colourLookup: chartConfig.colourLookup,
      duration: chartConfig.duration,
      indexed: chartConfig.indexDot,
      groupName: `blob-group-${chartConfig.chartIndex}`,
      originalBounds: chartConfig.originalInnerBox,
      padding,
      pointCount: chartConfig.pointCount,
      postYaxisBounds: this.state.postYaxisBounds,
      seriesCount: chartConfig.seriesCount,
      testFlag: this.state.blobsTest,
    }
    // And append emVal for text:
    config.blobs.blobMeta.text.emVal = chartConfig.emVal
    // HEADERS:
    // NOTE: this is all dup'd in barchart.js...
    // and there's redundancy in header-extraction, too...
    // Separate first (category) column header from subsequent headers:

    // NOTE: do I really need these?
    const actualHeaders = chartConfig.headers.slice()
    config.catHead = actualHeaders.shift()
    config.seriesHeads = actualHeaders
    // NOTE ends

    // So, to be clear, the config obj includes properties--
    //      catHead: the category column header
    //      seriesHeads: all subsequent (col 2 etc...) header strings
    //      colourMap: a D3 scale object that maps headers to series colours
    // X-SCALE:
    const xDomain = chartConfig.categories
    // On the use of 'padding' here...
    // In order to set an exact px gap between columns, I ignore the optional
    // arguments that D3 attaches to the rangeBands method to set inner and
    // outer gaps. Instead, I set up rangeBands for no gap; then, in
    // columnseries, I subtract the gap from the width of each column.
    // And I add the padding to the right of the range, to bring the last
    // column back into line with the innerbox (i.e. to allow for the
    // lost width on that last column)
    // Main scale (by data point)
    config.xMainScale = d3.scale
      .ordinal()
      .rangeBands([0, config.bounds.width + padding, 0, 0])
      .domain(xDomain)
    return config
  }
  // CONFIG BLOBS ends

  // Sub-handlers to reduce complexity of configSeriesMixed
  getSeriesType(chartConfig, isLeft) {
    let seriesType = chartConfig.scales.right.type
    if (isLeft) {
      seriesType = chartConfig.scales.left.type
    }
    return seriesType
  }

  getMinWidth(chartConfig, seriesType) {
    const isLine = seriesType.includes('line')
    return isLine ? 0 : chartConfig.series[seriesType].minWidth
  }

  getSide(isLeft) {
    return isLeft ? 'left' : 'right'
  }

  getChartType(leftType, rightType, isLeft) {
    return isLeft ? leftType : rightType
  }

  getAccum(scales, isLeft) {
    return isLeft ? scales.left.stacked : scales.right.stacked
  }

  getInvert(scales, isLeft) {
    return isLeft ? scales.left.invert : scales.right.invert
  }

  getGroupID(isLeft) {
    return isLeft ? '-A' : '-B'
  }

  // APPEND CONFIG CLASS-NAMES
  appendConfigClassNames(config, groupID) {
    const cIndex = config.chartIndex
    // As of Jun'21, the line series class names are no longer
    // picked up in lineseries.js...
    // if (config.isLine) {
    //   let linesGroupClassName = `line-series-group-`;
    //   linesGroupClassName = `${linesGroupClassName}${cIndex}${groupID}`;
    //   config.linesGroupClassName = linesGroupClassName;
    //   let pointsGroupClassName = `point-series-group-`;
    //   pointsGroupClassName = `${pointsGroupClassName}${cIndex}${groupID}`;
    //   config.pointsGroupClassName = pointsGroupClassName;
    // } else {
    // ...so for columns only
    if (!config.isLine) {
      let className = `d3-column-series-group d3-column-series-group-`
      className = `${className}${cIndex}${groupID}`
      config.className = className
    }
  }
  // APPEND CONFIG CLASS-NAMES ends

  setDomainArray(mmO, invert) {
    const dArray = [mmO.min, mmO.max]
    if (invert) {
      dArray.reverse()
    }
    return dArray
  }

  getsplitHeadColObj(chartConfig, isLeft) {
    let splitAt = chartConfig.scales.splitDataAtCol
    // Trap zero (this should have been trapped in Datafold)
    if (splitAt === 0) {
      splitAt = 1
    }
    let start = splitAt + 1
    let end = chartConfig.seriesCount
    if (isLeft) {
      start = 1
      end = splitAt
    }
    // Get the specific headers:
    const splitHeaders = []
    const splitColours = []
    // So now we have an array of series-headers, excluding blob-headers
    // Create specific arrays of headers and colours
    for (let iii = start; iii <= end; iii++) {
      splitHeaders.push(chartConfig.headers[iii])
      splitColours.push(chartConfig.series.colours[iii - 1])
    }
    return {
      splitHeaders,
      splitColours,
    }
  }

  getClusterPadding(config) {
    let clusterPadding = config.padding
    if (config.xMainScale.rangeBand() - config.padding < 0) {
      clusterPadding = config.xMainScale.rangeBand() / 2
    }
    return clusterPadding
  }

  // INITIALISE BASIC CONFIG SERIES MIXED
  // To reduce length and complexity of configSeriesMixed, it calls
  // this function to assemble the basic config object.
  // The properties worked out and assigned here are those
  // that aren't required during subsequent operations in configSeriesMixed
  initialiseBasicConfigSeriesMixed(chartConfig, isLeft, side, seriesType) {
    const stroke = chartConfig.series[seriesType].stroke
    // NOTE: there's some redundancy in the properties sent to the
    // series components... pointRadius, e.g., is irrelevant to
    // column series...
    const pointRadius = ((chartConfig.series || {}).pointline || {}).radius
    const minWidth = this.getMinWidth(chartConfig, seriesType)
    // Series type
    const scales = chartConfig.scales
    const leftType = scales.left.type
    const rightType = scales.right.type
    const chartType = this.getChartType(leftType, rightType, isLeft)
    const accum = this.getAccum(scales, isLeft)
    const invert = this.getInvert(scales, isLeft)
    // Are both 'sides' column series?
    const bcCheck = -1
    const bothCols =
      leftType.search('line') + rightType.search('line') < bcCheck
    const isLine = chartType.includes('line')
    // Step / Pointline check:
    const isStepline = chartConfig.scales[side].type === 'stepline'
    const isPointline = chartConfig.scales[side].type === 'pointline'
    // Line series need the 'indexed' object. The flag should (!)
    // be false, so don't append styling props from DPs
    const indexed = chartConfig.indexDot
    // Colours for this sequence of series
    const seriesCount = chartConfig.seriesCount
    const brokenScalePadding = BrokenScale.getYaxisBrokenScalePadding(
      chartType,
      chartConfig
    )
    return {
      accum,
      bothCols,
      brokenScalePadding,
      chartData: chartConfig.chartData,
      chartIndex: chartConfig.chartIndex,
      chartType,
      // Default name/value lookup of colours
      colourLookup: chartConfig.colourLookup,
      colourSet: chartConfig.series.colours,
      duration: chartConfig.duration,
      factor: scales[side].factor,
      indexed,
      invert,
      isLeft,
      // isLine attached becos required by caller
      isLine,
      isMixed: true,
      isPointline,
      isStepline,
      minWidth,
      originalBounds: chartConfig.originalInnerBox,
      pointCount: chartConfig.pointCount,
      pointRadius,
      seriesCount,
      steplineSpur: chartConfig.steplineSpur,
      stroke,
      // Can be undefined:
      zeroPrefs: chartConfig.xAxis.ticks.zero,
    }
  }
  // INITIALISE BASIC CONFIG SERIES MIXED ends

  // CONFIG SERIES MIXED
  // Assembles series config object
  // Param 2 is left/right flag
  configSeriesMixed(chartConfig, isLeft) {
    // To reduce complexity, construction of the basic config object
    // is farmed out...
    const side = this.getSide(isLeft)
    const seriesType = this.getSeriesType(chartConfig, isLeft)
    const config = this.initialiseBasicConfigSeriesMixed(
      chartConfig,
      isLeft,
      side,
      seriesType
    )
    // Define other config props

    // Left/right outer groups must be distinguished, A or B.
    const groupID = this.getGroupID(isLeft)
    // But this works differently for...
    // ...lines, which handle it on the fly...
    config.mixedID = groupID
    // ...and columns, which expect to inherit
    this.appendConfigClassNames(config, groupID)
    // (this is an anomaly created Jun'21, when I refactored lines)

    const scales = chartConfig.scales
    const mmO = Object.assign({}, scales[side].minMaxObj.scale)
    const bounds = Object.assign({}, this.state.innerBox)
    // NOTE: next gets overridden anyway
    let padding = chartConfig.series[seriesType].gap
    // Broken scale padding...?
    let breakScale = false;
    // Inverted scale can't have BS padding:
    if (!chartConfig.scales[side].invert) {
      const brokenScalePadding = BrokenScale.getYaxisBrokenScalePadding(
        'mixed',
        chartConfig
      )
      // No broken scale
      if (mmO.min > 0) {
        bounds.height -= brokenScalePadding
        breakScale = true
      }
    }
    // Append additional props to config:
    config.bounds = bounds
    config.breakScale = breakScale
    // config.colourSet = colourSet;
    config.minVal = mmO.min
    config.padding = padding
    // Mixed +/– flag:
    config.mixedVals = mmO.min < 0 && mmO.max >= 0
    // NOTE: the de-complexification could be taken further...
    // Y-SCALE (linear):
    const domainArray = this.setDomainArray(
      mmO,
      chartConfig.scales[side].invert
    )
    config.yScale = d3.scale
      .linear()
      .range([bounds.height, 0])
      .domain(domainArray)
    // HEADERS:
    // NOTE: this is all dup'd in barchart.js...
    // and there's redundancy in header-extraction, too...
    // Separate first (category) column header from subsequent headers:
    config.catHead = chartConfig.headers[0]
    // I need to isolate the relevant headers...
    // chartConfig.headers is an array of ALL headers, including blob-headers
    // NOTE: This could be all wrong, but it's roughly what other types do...
    // Let's get rid of any blobs header:
    // Actually, this never seems to get used...
    // const nonBlobHeaders = this.getNonBlobHeaders(chartConfig);
    // NOTE: blob exclusion ends -- but is this premature here?
    // Now split the complete array of non-blob
    // headers into column and line sets
    // I need start and end for columns; ditto for lines
    // And left or right could be cols or lines! So...
    // ...split at:
    const splitHeadColObj = this.getsplitHeadColObj(chartConfig, isLeft)
    const splitHeaders = splitHeadColObj.splitHeaders
    const splitColours = splitHeadColObj.splitColours
    config.seriesHeads = splitHeaders
    // Map series colours:
    config.colourMap = ChartUtilities.getColourMap(splitHeaders, splitColours)
    // So, to be clear, the config obj includes properties--
    //      catHead: the category column header
    //      seriesHeads: all subsequent (col 2 etc...) header strings
    //      colourMap: a D3 scale object that maps headers to series colours
    // X-SCALE:
    const xMainDomain = chartConfig.chartData.map((ddd) => ddd[config.catHead])

    // Cluster width & padding
    let halfClusterWidth = 0
    padding = 0
    if (chartConfig.hasColumns) {
      const cwp = ChartUtilities.getSeriesClusterWidthAndPadding(
        chartConfig,
        false
      )
      halfClusterWidth = cwp.clusterWidth / 2
      config.halfClusterWidth = halfClusterWidth
      padding = cwp.padding
      config.padding = padding
    }
    // Scale object, depending on line/col
    if (config.isLine) {
      // Line goes right across IB
      config.xMainScale = d3.scale
        .ordinal()
        .domain(xMainDomain)
        .rangePoints([0, config.bounds.width], 0, 0)
    } else {
      // On the use of 'padding' here...
      // In order to set an exact px gap between columns, I ignore the optional
      // arguments that D3 attaches to the rangeBands method to set inner and
      // outer gaps. Instead, I set up rangeBands for no gap; then, in
      // columnseries, I subtract the gap from the width of each column.
      // And I add the padding to the right of the range, to bring the last
      // column back into line with the innerbox (i.e. to allow for the
      // lost width on that last column)
      // Main scale (by data point)
      config.xMainScale = d3.scale
        .ordinal()
        // .rangeBands([0, config.bounds.width + config.padding, 0, 0])
        .rangeBands(
          [
            0 - halfClusterWidth,
            config.bounds.width + halfClusterWidth + config.padding,
          ],
          0,
          0
        )
        .domain(xMainDomain)
      // There's a problem with D3 and clusters...
      // If the xMainScale rangeBands are so narrow that subtracting
      // padding, for xClusterScale, yields a negative value...
      // ...D3 does some sort of Math.abs on it, which results in
      // bonkers wide columns. So crude trap: if allowing for the padding
      // would result in a negative rangeBand, make padding just half
      // of cluster-width...
      // NOTE: in the longer term, would default and narrow series.gap
      // values be helpful...?
      const clusterPadding = this.getClusterPadding(config)
      // Now, cluster scale (n/a for unstacked, but anyway...)
      config.xClusterScale = d3.scale
        .ordinal()
        .domain(splitHeaders)
        .rangeBands([0, config.xMainScale.rangeBand() - clusterPadding], 0, 0)
    }
    return config
  }
  // CONFIG SERIES MIXED ends

  // GET Y-AXIS JSX
  // Ideally, this would be in AxisUtilities, shared by all chart
  // types. The trouble is, it needs access to state, so unless I'm
  // going to start passing state around as a param, it has to live
  // here, and all chart-type components will duplicate this code...
  getYaxisJsx(config, exists, key, side) {
    // Check for test...
    let testFlag = this.state.yaxisTestLeft
    if (side === 'right') {
      testFlag = this.state.yaxisTestRight
    }
    let axisConfig = { enabled: false }
    if (exists) {
      axisConfig = this.getYaxisConfig(config, side, testFlag)
    }
    axisConfig.bounds = this.state.innerBox
    // return axisConfig;
    // Render left yaxis only, with 'test' flag
    // to get margin
    let callbackHandler = this.handleYaxisInnerBoxBoundsRight
    if (side === 'left') {
      callbackHandler = this.handleYaxisInnerBoxBoundsLeft
    }
    let axisJsx = ''
    if (testFlag) {
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
    const axisConfig = this.getXaxisConfig(config)
    axisConfig.bounds = this.state.innerBox
    // Test or live:
    let xaxisJsx = ''
    if (this.state.xaxisTest) {
      // Only send callback for test
      xaxisJsx = (
        <SilverXaxisOrdinalTest
          key={key}
          config={axisConfig}
          onReturnRevisedInnerBox={this.handleXaxisInnerBoxBounds}
        />
      )
    } else {
      xaxisJsx = <SilverXaxisOrdinal key={key} config={axisConfig} />
    }
    return xaxisJsx
  }
  // GET X-AXIS JSX ends

  // GET BLOBS JSX
  getBlobsJsx(config, key, isTest) {
    const blobsConfig = this.configBlobs(config)
    blobsConfig.bounds = this.state.innerBox
    const jsxTemplate = (
      <SilverXaxisBlobs
        key={key}
        config={blobsConfig}
        onReturnRevisedInnerBox={this.handleBlobsInnerBoxBounds}
      />
    )
    let jsx = ''
    if (isTest) {
      // If it's a test, always assemble jsx
      jsx = jsxTemplate
    } else if (blobsConfig.blobs.blobState.column > 0) {
      // Not a test, only make up jsx if there ARE blobs
      jsx = jsxTemplate
    }
    return jsx
  }
  // GET BLOBS JSX en;ds

  // GET BACK OR FRONT SERIES
  // Called from render; returns front/back column/line series JSX
  getBackOrFrontSeriesJsx(backConfig, frontConfig, keys, isBack) {
    // Back or front?
    let seriesConfig = frontConfig
    let keyPrefix = 'front'
    if (isBack) {
      seriesConfig = backConfig
      keyPrefix = 'back'
    }
    // Line or column?
    // (NOTE: var must start U/C)
    let SeriesComponent = SilverSeriesColumn
    let seriesKey = `${keyPrefix}-${keys.columnSeriesKey}`
    if (seriesConfig.chartType.includes('line')) {
      SeriesComponent = SilverSeriesLine
      seriesKey = `${keyPrefix}-${keys.lineSeriesKey}`
    }
    return (
      <SeriesComponent
        key={seriesKey}
        config={seriesConfig}
        onPassLineClick={this.handleLineClick}
      />
    )
  }
  // GET BACK OR FRONT SERIES ends

  // RENDER
  render() {
    const config = this.props.config
    const chartIndex = config.chartIndex
    // Key all subcomponents:
    const kids = ChartUtilities.getKeysAndIds(chartIndex)

    // Custom config objects for the various d3 components:
    // See linechart.js

    // Y axis can be left/right/both...
    const enableScale = config.scales.enableScale
    const yLeft = enableScale.left
    const yRight = enableScale.right
    // Default empty jsx
    let xaxisJSX = ''
    let yaxisJSXLeft = ''
    let yaxisJSXRight = ''
    let blobsJSX = ''
    let backseriesJSX = ''
    let frontseriesJSX = ''
    // Render sequence
    // Either the tests, where we render individual components...
    if (this.state.yaxisTestLeft) {
      yaxisJSXLeft = this.getYaxisJsx(config, yLeft, kids.yAxisKey, 'left')
    } else if (this.state.yaxisTestRight) {
      yaxisJSXRight = this.getYaxisJsx(config, yRight, kids.yAxisKey, 'right')
    } else if (this.state.xaxisTest) {
      xaxisJSX = this.getXaxisJsx(config, kids.xAxisKey)
    } else if (this.state.blobsTest) {
      // (NOTE: blobs are disabled in Editor on mixed charts, anyway)
      blobsJSX = this.getBlobsJsx(config, kids.blobsKey, this.state.blobsTest)
    } else {
      // The series config objects will be shuffled back/front later
      // (Each has a chartType property to identify col/line)
      const seriesConfigLeft = this.configSeriesMixed(config, true)
      const seriesConfigRight = this.configSeriesMixed(config, false)
      // Default back and front. This will be OK if:
      //    Left is stacked cols
      //    Left is cols and right is cols or lines
      //    Left and right are both lines
      let seriesConfigBack = seriesConfigLeft
      let seriesConfigFront = seriesConfigRight
      // Correct if l/r sequence is:
      //    Left:line / Right:!line
      //    Left:cols / Right:stacked

      const linesOnlyBack =
        seriesConfigBack.chartType.includes('line') &&
        !seriesConfigFront.chartType.includes('line')
      const columnsStackedFront =
        seriesConfigBack.chartType === 'columns' &&
        seriesConfigFront.chartType === 'stackedcolumn'
      // if (seriesConfigBack.chartType.includes('line')) {
      //   if (!seriesConfigFront.chartType.includes('line')) {
      if (linesOnlyBack) {
        seriesConfigBack = seriesConfigRight
        seriesConfigFront = seriesConfigLeft
        // } else if (seriesConfigBack.chartType === 'columns') {
        //   if (seriesConfigFront.chartType === 'stackedcolumn') {
      } else if (columnsStackedFront) {
        seriesConfigBack = seriesConfigRight
        seriesConfigFront = seriesConfigLeft
      }

      // So now I have front and back COs
      // Update all config objects with 'latest' bounds:
      xaxisJSX = this.getXaxisJsx(config, kids.xAxisKey)
      if (yLeft) {
        yaxisJSXLeft = this.getYaxisJsx(config, yLeft, kids, 'left')
      }
      if (yRight) {
        yaxisJSXRight = this.getYaxisJsx(config, yRight, kids, 'right')
      }
      blobsJSX = this.getBlobsJsx(config, kids.blobsKey, this.state.blobsTest)
      // Conditional back/front jsx objects
      backseriesJSX = this.getBackOrFrontSeriesJsx(
        seriesConfigBack,
        seriesConfigFront,
        kids,
        true
      )
      frontseriesJSX = this.getBackOrFrontSeriesJsx(
        seriesConfigBack,
        seriesConfigFront,
        kids,
        false
      )
    }

    // Zero line stacking. Defaults to back:
    let zeroStackPos = 'back'
    // Test when JSX objs exist:
    if (
      typeof backseriesJSX === 'object' &&
      typeof frontseriesJSX === 'object'
    ) {
      const backType = backseriesJSX.props.config.chartType
      const frontType = frontseriesJSX.props.config.chartType
      // If front is column, back must be too. Zero line at front
      if (frontType.includes('column')) {
        zeroStackPos = 'front'
      } else if (backType.includes('column')) {
        // Front is line (by implication); if back is columns,
        // zero line is sandwiched
        zeroStackPos = 'sandwich'
      }
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

    // Group for zero line, if any
    const zeroGrpJSX = (
      <g className={kids.zeroId} id={kids.zeroId} key="zero-group" />
    )
    // Components whose position in the stack is fixed:
    const jsxArray = [xaxisJSX, yaxisJSXLeft, yaxisJSXRight, blobsJSX]
    // Stacking of front and back series, and of zero, depends upon chart types:
    let extraItems = [backseriesJSX, frontseriesJSX, zeroGrpJSX]
    if (zeroStackPos === 'back') {
      extraItems = [zeroGrpJSX, backseriesJSX, frontseriesJSX]
    } else if (zeroStackPos === 'sandwich') {
      extraItems = [backseriesJSX, zeroGrpJSX, frontseriesJSX]
    }
    jsxArray.push(...extraItems)

    const chartComponentsJSX = (
      <g className={mainGroupClass} key={kids.mainGroupKey} id={kids.contentId}>
        {jsxArray}
      </g>
    )
    return chartComponentsJSX
  }
}

SilverMixedChart.propTypes = {
  config: PropTypes.object.isRequired,
}

export default SilverMixedChart
