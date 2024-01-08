/* global document: false */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
// Background components
import SilverBackground from './background/background'
import SilverPanels from './background/panels'
import SilverLegends from './legend/legends'
// Chart type components
import SilverBarChart from './barchart/barchart'
import SilverColumnChart from './columnchart/columnchart'
import SilverThermoVerticalChart from './thermochart/thermoverticalchart'
import SilverThermoHorizontalChart from './thermochart/thermohorizontalchart'
import SilverLineChart from './linechart/linechart'
import SilverMixedChart from './mixedchart/mixedchart'
import SilverScatterChart from './scatterchart/scatterchart'
import SilverPieChart from './piechart/piechart'
import SilverTable from './table/table'
// Axis and Chart Utilities
import * as AxisUtilities from './axes/axis-utilities'
import * as ChartUtilities from './chart-utilities'

// Fonts as base64 strings
import EconSansReg from './font/econsans-reg'
import EconSansBol from './font/econsans-bol'
import EconSansLig from './font/econsans-lig'
import EconSansBolIta from './font/econsans-bol-ita'
import EconSansCndReg from './font/econsanscnd-reg'
import EconSansCndRegIta from './font/econsanscnd-reg-ita'
import EconSansCndLig from './font/econsanscnd-lig'
import EconSansCndLigIta from './font/econsanscnd-lig-ita'
import EconSansCndMed from './font/econsanscnd-med'
import EconSansCndMedIta from './font/econsanscnd-med-ita'
import MiloTEBold from './font/milo-primary-bd'
import MiloTEMedium from './font/milo-primary-md'
import MiloTERegular from './font/milo-primary-rg'
import MiloTERegularItalic from './font/milo-primary-rg-it'

class SilverChartWrapper extends Component {
  static get defaultProps() {
    return {
      chartJsxLookup: {
        bar: {
          chartType: SilverBarChart,
          thermometer: false,
        },
        column: {
          chartType: SilverColumnChart,
          thermometer: false,
        },
        thermohorizontal: {
          chartType: SilverThermoHorizontalChart,
          thermometer: true,
        },
        thermovertical: {
          chartType: SilverThermoVerticalChart,
          thermometer: true,
        },
        // thermometer is undefined in other chart types
        line: { chartType: SilverLineChart },
        mixed: { chartType: SilverMixedChart },
        pointline: { chartType: SilverLineChart },
        stepline: { chartType: SilverLineChart },
        scatter: { chartType: SilverScatterChart },
        sizedscatter: { chartType: SilverScatterChart },
        pie: { chartType: SilverPieChart },
        halfpie: { chartType: SilverPieChart },
        table: { chartType: SilverTable },
      },
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      // By default, innerbox is an empty array
      innerboxes: [],
      renderPanels: false,
      renderLegends: false,
    }
    // Callback from Background returns first global innerbox definition
    this.handleBackgroundInnerBoxBounds = this.handleBackgroundInnerBoxBounds.bind(
      this
    )
    // Callback from Panels returns array of panel-specific innerbox definitions
    this.handlePanelInnerBoxBounds = this.handlePanelInnerBoxBounds.bind(this)
    // Callback from Legend returns array of further-revised innerbox bounds
    this.handleLegendInnerBoxBounds = this.handleLegendInnerBoxBounds.bind(this)
  }

  // When new props arrive AFTER initial render
  UNSAFE_componentWillReceiveProps() {
    // Set innerbox back to empty array
    this.setState({
      innerboxes: [],
      renderPanels: false,
      renderLegends: false,
    })
    return true
  }
  // COMPONENT WILL RECEIVE PROPS ends

  shouldComponentUpdate(newProps) {
    const canRender = true // newProps.chartTypeComponentCanRender
    return canRender
  }

  // GET ONE PADDING VALUE
  // Called from getPaddingBelowTitleCluster &
  // getPaddingBelowPanelHeaderBaselines
  // pLookup is title-cluster or panel-header padding lookup
  getOnePaddingValue(pConfig, pLookup) {
    // What's below? Could be legends,
    // blobs or top of chart
    const hasBlobs = pConfig.blobs.hasBlobs
    const hasLegend = pConfig.seriesCount > 1 && pConfig.legend.value > 0
    let chartType = pConfig.overallChartType
    // Belt and braces:
    if (typeof chartType === 'undefined') {
      if (pConfig.categoryType === 'string') {
        chartType = 'bar'
      } else {
        chartType = 'line'
      }
    }
    // Inferential kludge, Jan'24: hthermo sets same padding as bar:
    if (chartType === 'thermohorizontal') {
      chartType = 'bar';
    }
    let padding = pLookup.toTopOfChart.default
    if (hasBlobs) {
      padding = pLookup.toBlobTop
    } else if (hasLegend) {
      padding = pLookup.toLegendBaseline
    } else if (typeof pLookup.toTopOfChart[chartType] !== 'undefined') {
      padding = pLookup.toTopOfChart[chartType]
    }
    return padding
  }
  // GET ONE PADDING VALUE ends

  // GET PADDING BELOW TITLE CLUSTER
  // Called from handleBackgroundInnerBoxBounds. Returns
  // padding below the title cluster
  getPaddingBelowTitleCluster(config) {
    const pLookup = config.background.topPadding.belowTitleClusterBaseline
    const pConfig = config.panelArray[0]
    const pVal = this.getOnePaddingValue(pConfig, pLookup)
    return pVal
  }
  // GET PADDING BELOW TITLE CLUSTER ends

  // GET PADDING BELOW PANEL HEADER BASELINES
  // Called from handlePanelInnerBoxBounds. Returns
  // paddings below panel-headers in a multipanel chart
  getPaddingBelowPanelHeaderBaselines(config) {
    const pLookup = config.background.topPadding.belowPanelHeaderBaseline
    const pCount = config.metadata.panels.total
    const pArray = []
    for (let pNo = 0; pNo < pCount; pNo++) {
      const pConfig = config.panelArray[pNo]
      pArray.push(this.getOnePaddingValue(pConfig, pLookup))
    }
    return pArray
  }
  // GET PADDING BELOW PANEL HEADER BASELINES ends

  // GET PADDING BELOW CHART
  // Called from handleBackgroundInnerBoxBounds
  // A bit redundant... unless padding becomes different
  // with or without panels...
  getPaddingBelowChart(config) {
    const belowChart = config.background.chartPadding.below
    return belowChart
  }
  // GET PADDING BELOW CHART

  // HANDLE BACKGROUND INNER BOX BOUNDS
  // Handles callback from Background, which returns inner box
  // after background shapes and strings have been drawn
  handleBackgroundInnerBoxBounds(innerBox) {
    const config = this.props.config
    // Are there any panels?
    const pCount = config.metadata.panels.total
    // Jul'20: always *call* panels, even if none
    const renderPanels = true
    let renderLegends = true
    if (pCount > 1) {
      renderLegends = false
    } else {
      // No panels, so get padding above chart now
      const tcPadding = this.getPaddingBelowTitleCluster(config)
      innerBox.y += tcPadding
      innerBox.height -= tcPadding
    }
    console.log(innerBox.y)
    // In either case, get padding above source/footnote
    const bPadding = this.getPaddingBelowChart(config)
    innerBox.height -= bPadding
    this.setState({
      innerboxes: [innerBox],
      renderPanels,
      renderLegends,
    })
  }
  // HANDLE BACKGROUND INNER BOX BOUNDS

  // HANDLE PANEL INNER BOX BOUNDS
  // Listens out for the callback from Panels, which returns
  // an array of innerbox definitions (x, y, height, width)
  // after all panel-header elements have been drawn.
  // IBs.y is baseline of each panel's header
  // Precipitates re-render with Legends flag...
  handlePanelInnerBoxBounds(innerboxes) {
    const config = this.props.config
    // I'm after the padding below panel headers...
    const pCount = config.metadata.panels.total
    if (pCount > 1) {
      const paddingArray = this.getPaddingBelowPanelHeaderBaselines(config)
      for (let pNo = 0; pNo < pCount; pNo++) {
        const myIB = innerboxes[pNo]
        myIB.y += paddingArray[pNo]
        myIB.height -= paddingArray[pNo]
      }
    }
    this.setState({ innerboxes, renderPanels: false, renderLegends: true })
  }
  // HANDLE PANEL INNER BOX BOUNDS ends

  // HANDLE LEGEND INNER BOX BOUNDS
  // Listens out for the callback from Legend, which returns
  // revised array of innerbox definitions (x, y, height, width).
  // One element in the array of innerbox definitions will be attached to
  // each element in config.panelArray, to be bequeathed to individual
  // charts...
  handleLegendInnerBoxBounds(innerboxes) {
    this.setState({ innerboxes, renderLegends: false })
  }
  // HANDLE LEGEND INNER BOX BOUNDS ends

  // GET CHART JSX ARRAY
  getChartJsxArray(cdArray, outerWidth) {
    // Lookup of child components and (bar/col only) thermo flags
    const chartJsxLookup = this.props.chartJsxLookup
    // Array of JSX objects...
    const chartJsxArray = cdArray.map((oneChart, index) => {
      let typeJSX = ''
      if (oneChart.headers.length > 0) {
        oneChart.chartIndex = index
        const key = `chart-${index}`
        // By default:
        let ChartType = SilverLineChart
        if (oneChart.overallChartType.includes('table')) {
          ChartType = SilverTable
        } else if (oneChart.scales.isDouble) {
          // Double and mixed both use the 'mixed' component
          ChartType = SilverMixedChart
        } else if (oneChart.scales.isMixed) {
          ChartType = SilverMixedChart
        } else {
          // Get side:
          const side = AxisUtilities.getSide(oneChart.scales)
          // Now look up chart-type child component and, for bars and cols,
          // get thermo flag.
          const chartTypeDef = oneChart.scales[side].type
          ChartType = chartJsxLookup[chartTypeDef].chartType
          oneChart.thermometer = chartJsxLookup[chartTypeDef].thermometer
          // FIXME: kludge for bar/hThermo padding. This needs mending as
          // part of a general refactoring of vertical padding
          if (chartTypeDef === 'bar' || chartTypeDef === 'thermohorizontal') {
            oneChart.innerBox.y += 2
            oneChart.innerBox.height -= 2
          }
          // Chart outer width
          oneChart.outerWidth = outerWidth
        }
        // By definition:
        const drawChart = true
        typeJSX = (
          <ChartType
            config={oneChart}
            key={key}
            drawChart={drawChart}
            chartTypeComponentCanRender={true} // {this.props.chartTypeComponentCanRender}
          />
        )
      }
      return typeJSX
    })
    return chartJsxArray
  }
  // GET CHART JSX ARRAY ends

  // RENDER
  render() {
    const config = Object.assign({}, this.props.config)
    config.originalInnerBox = Object.assign({}, config.innerBox)
    // Colour lookup:
    const colourLookup = config.metadata.colours
    // This component now has 4 children:
    //    Background renders background shapes and strings
    //    Panels renders panel flashes and headers
    //    Legend renders any legend(s)
    //    Chart is triaged by type, then renders all chart content in
    //      the innerboxes as modified by the Background and Legend

    // Render can be precipitated by 3 events:
    // 1) new props, in which case innerboxes is an empty array
    // 2) update to state, after Background returns callback that
    //    defines a global inner box...
    //    ...and the renderPanels flag is true
    // 3) update to state, after Panels returns callback that
    //    defines the innerbox structure, in which case innerboxes
    //    is an array of those definitions...
    //    ...and the renderLegends flag is true
    // 4) update to state, after Legend returns callback that
    //    defines the innerbox structure, in which case innerboxes
    //    is an array of those revised definitions...
    //    ...but renderLegends has been set back to false

    // Do we have inner boxes?
    const innerboxes = this.state.innerboxes
    // Flags and default JSX...
    // I only want to actually DRAW the background if there are no innerboxes
    // And I only want to draw legends if background has been drawn and
    // the renderLegends flag = true...
    let drawBackground = false
    let drawPanels = false
    let drawLegends = false
    let drawChart = false
    // NOTE: this is a bit crap, but I'm getting a headache...
    if (innerboxes.length === 0) {
      drawBackground = true
    } else if (this.state.renderPanels) {
      drawPanels = true
    } else if (this.state.renderLegends) {
      drawLegends = true
    } else {
      drawChart = true
    }

    // Custom fonts
    // This is the only pattern that worked reliably for both PNG and SVG export
    // https://vijayt.com/post/save-svg-element-with-custom-font-as-image/
    const defs = (
      <defs>
        <style
          type="text/css"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: EconSansReg;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${EconSansReg})
              }
              @font-face {
                font-family: EconSansBol;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${EconSansBol})
              }
              @font-face {
                font-family: EconSansLig;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${EconSansLig})
              }
              @font-face {
                font-family: EconSansBolIta;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${EconSansBolIta})
              }
              @font-face {
                font-family: EconSansCndLig;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${EconSansCndLig})
              }
              @font-face {
                font-family: EconSansCndLigIta;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${EconSansCndLigIta})
              }
              @font-face {
                font-family: EconSansCndReg;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${EconSansCndReg})
              }
              @font-face {
                font-family: EconSansCndRegIta;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${EconSansCndRegIta})
              }
              @font-face {
                font-family: EconSansCndMed;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${EconSansCndMed})
              }
              @font-face {
                font-family: EconSansCndMedIta;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${EconSansCndMedIta})
              }
              @font-face {
                font-family: MiloTE-Bold;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${MiloTEBold})
              }
              @font-face {
                font-family: MiloTE-Medium;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${MiloTEMedium})
              }
              @font-face {
                font-family: MiloTE-RegularItalic;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${MiloTERegularItalic})
              }
              @font-face {
                font-family: MiloTE-Regular;
                src: url(data:application/x-font-woff2;charset=utf-8;base64,${MiloTERegular})
              }`,
          }}
        />
      </defs>
    )

    // Background: shapes and strings
    // with flag to prevent it updating if unnecessary
    // and callback for returned global chart innerbox
    const backgroundJSX = (
      <SilverBackground
        config={config}
        drawBackground={drawBackground}
        onGetGlobalInnerBox={this.handleBackgroundInnerBoxBounds}
      />
    )

    // Panels
    // Pass in IBs as single element
    const panelJSX = (
      <SilverPanels
        config={config}
        drawPanels={drawPanels}
        innerbox={innerboxes[0]}
        onGetInnerBoxes={this.handlePanelInnerBoxBounds}
      />
    )

    // Legends
    const legendJSX = (
      <SilverLegends
        config={config}
        drawLegends={drawLegends}
        innerboxes={innerboxes}
        onGetInnerBoxes={this.handleLegendInnerBoxBounds}
      />
    )

    // Default is no data
    let chartJSX = ''
    if (drawChart) {
      // Background returned an array of innerbox definitions, which
      // I append to the array of chart definitions, which gets passed
      // to the chart constructor
      // NOTE: will I need to verify that there are the same number of
      // innerboxes as chart definitions? Seems redundant...
      // Isolate the array of chartData objects
      const cdArray = config.panelArray
      const cLen = cdArray.length
      // Assign matching innerbox bounds
      for (let cNo = 0; cNo < cLen; cNo++) {
        cdArray[cNo].innerBox = innerboxes[cNo]
        // Reserve an *original* innerbox def (since
        // downstream components will mangle the original)
        // (Used, e.g. to position left-anchored barchart yAxis labels)
        cdArray[cNo].originalInnerBox = Object.assign({}, innerboxes[cNo])
        // And pass in an emVal, for calculating text height...
        cdArray[cNo].emVal = config.metadata.emVal
        // ...and the hard-return tag
        cdArray[cNo].forceTurn = config.metadata.forceTurn
        cdArray[cNo].colourLookup = colourLookup
      }
      // So now I've got an array of chart definitions that include
      // innerbox bounds. Create as many instances of the chartJSX
      // as we have charts...
      // We need outer chart width:
      const outerWidth = config.background.outerbox.dimensions.width
      chartJSX = this.getChartJsxArray(cdArray, outerWidth)
    }

    // Hard-set chart outerbox width and height
    const divStyle = ChartUtilities.getSilverChartwrapperStyle(config)
    const wrapperClass = 'silver-chartwrapper'
    const whatsRendered = (
      <div className={wrapperClass} style={divStyle}>
        <svg className="svg-wrapper" style={{ width: '100%', height: '100%' }}>
          {defs}
          {backgroundJSX}
          {panelJSX}
          {legendJSX}
          {chartJSX}
        </svg>
      </div>
    )
    return typeof window === 'undefined' || typeof document === 'undefined'
      ? null
      : whatsRendered
  }
  // RENDER ends
}

SilverChartWrapper.propTypes = {
  chartJsxLookup: PropTypes.object,
  config: PropTypes.object,
  // chartTypeComponentCanRender: PropTypes.bool,
}

export default SilverChartWrapper
