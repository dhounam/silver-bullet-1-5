/* eslint-disable complexity */

import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities module
import * as ChartUtils from '../chart-utilities'
import * as LegendUtils from './legend-utilities'
import SilverLegendSet from './legendset'

class SilverLegends extends Component {
  // CONSTRUCTOR
  constructor(props) {
    super(props)
    this.state = {
      legendSets: '',
    }
    // I think I have to track all IB bounds as a global...
    this.innerBoxes = []
    // Callback from LegendSet
    this.handleLegendSetInnerBoxBounds = this.handleLegendSetInnerBoxBounds.bind(
      this
    )
  }

  // COMPONENT DID MOUNT
  // I think that, by definition, there are no legends
  // to append on mount...

  componentDidMount() {
    if (this.props.drawLegends) {
      // this.props.onGetInnerBoxes(this.props.innerboxes);
    }
  }

  // COMPONENT WILL RECEIVE PROPS
  // Creates new internal global array of IB definitions, each with
  // the 'drawn' flag at default false.
  // Then assembles array of legendSets (JSX)
  UNSAFE_componentWillReceiveProps(nextProps) {
    let legendSets = ''
    // On first call in update cycle, the drawLegend flag
    // will be false, preventing legends being attempted
    // until Background has assembled a decent IB
    if (nextProps.drawLegends) {
      // Pull in the IBs passed as props; mark each as 'un-legended';
      // and save an an internal global (see handleLegendSetInnerBoxBounds, above)
      const ibDefs = Object.assign([], nextProps.innerboxes)
      for (let ibx = 0; ibx < ibDefs.length; ibx++) {
        ibDefs[ibx].drawn = false
      }
      this.innerBoxes = ibDefs
      legendSets = this.assembleLegendSets()
    }
    this.setState({ legendSets })
  }
  // COMPONENT WILL RECEIVE PROPS ends

  // SHOULD COMPONENT UPDATE
  // Only update if the flag says so
  shouldComponentUpdate(nextProps) {
    return nextProps.drawLegends
  }
  // SHOULD COMPONENT UPDATE

  // GET PADDING FOR INNER BOX
  // Called from assembleLegendSets. Based upon chart type
  // appends to the IB object a value representing the
  // default (untweaked) padding below any legendset
  // NOTE: to be clear...
  // Any legendstack has a default padding below; this
  // value depends, however, upon the chart type.
  // (If it's a table there's no legends, so zero padding).
  // If there ARE legends, tweaks are applied (see elsewhere)
  // for wrapped legend strings, or if there's more than one
  // row of legends...
  getPaddingForInnerBox(paddings, iBox, panelConfig) {
    // Questions:
    // Are there enough series for a legend?
    // Is this a table?
    // Is the legend drawn inside the chart?
    let legendWithin = false
    let seriesCount = panelConfig.seriesCount
    // If there are blobs, subtract a series
    if (panelConfig.blobs.blobState.column > 0) {
      seriesCount--
    }
    // I'm checking that legends are within panel. Also that, if
    // double scale, there are more than 2 series
    // (2-series dbl scale shows axis headers and  omits legends)
    let seriesThreshold = 1
    if (panelConfig.scales.isDouble) {
      seriesThreshold = 2
    }
    if (
      panelConfig.overallChartType !== 'table' &&
      seriesCount > seriesThreshold &&
      panelConfig.legend.value > 0
    ) {
      legendWithin = true
    }
    if (legendWithin) {
      // Internal legends
      if (panelConfig.blobs.hasBlobs) {
        // Blobs:
        iBox.paddingBelowLegends = paddings.toBlobTop
      } else if (panelConfig.scales.isDouble) {
        // Double scale
        iBox.paddingBelowLegends = paddings.toTopOfChart.double
      } else if (
        panelConfig.overallChartType.includes('bar') ||
        panelConfig.overallChartType.includes('thermohorizontal')
      ) {
        // Bars or hThermos
        iBox.paddingBelowLegends = paddings.toTopOfChart.bar
      } else {
        // Default
        iBox.paddingBelowLegends = paddings.toTopOfChart.default
      }
    } else {
      // External legends: no padding
      iBox.paddingBelowLegends = 0
    }
    // Can I handle outside here?
  }
  // GET PADDING FOR INNER BOX

  // HANDLE LEGEND-SET INNER BOX BOUNDS
  // Event handler for callback from each instance of Legendset
  // Arg is an object with 2 props: panel-index and tweak (depth
  // of stack drawn by this iteration of Legendset).
  // It works on an internal global, innerBoxes, which maintains
  // an ongoing set of IB bounds. As each Legendset 'reports',
  // an IB definition is updated to allow for the legend-set's height.
  // Then we loop thro ALL IB defs and get the biggest 'tweak'. If
  // ALL legendsets have been drawn, we apply that max tweak to
  // ALL IB defs, which are passed up to Chartwrapper.
  // This ensures that all charts (if multipanel) start at the same
  // vertical position
  handleLegendSetInnerBoxBounds(ibObj) {
    const config = this.props.config
    // ibObj is an object with 2 props: IB-tweak and panel-index
    const ibCount = this.innerBoxes.length
    // Identify the IB def in the array of IBs, adjust top,
    // and mark as 'drawn'
    const thisIB = this.innerBoxes[ibObj.index]
    thisIB.drawn = true
    thisIB.tweak = ibObj.tweak
    // Loop through all panels.
    let drawnCount = 0
    for (let ibx = 0; ibx < ibCount; ibx++) {
      const thisBox = this.innerBoxes[ibx]
      if (thisBox.drawn) {
        drawnCount++
      }
    }
    const allDone = drawnCount === ibCount

    // When ALL charts have been 'legended', I get the max tweak
    // in each 'row' of panels and apply to that entire row
    // NOTE: this can surely be farmed out...
    if (allDone) {
      // Array of panels, by rows
      const rowCount = config.metadata.panels.rows
      // Get number of panels in each row. I'm assuming that upstream
      // checks guarantee this is an integer
      const rowLen = ibCount / rowCount
      const rowedArray = LegendUtils.createRowedArray(this.innerBoxes, rowLen)
      // So each element in rowedArray represents one row
      // Do charts in panel rows align?
      const panelsAlign = config.panelAttributes.alignChartsInPanels
      if (panelsAlign) {
        // Tweaks are max in any row
        const maxArray = LegendUtils.getRowMaxesArray(rowedArray, rowLen)
        // Feed tweaks back into main array
        LegendUtils.adjustAlignedInnerBoxes(this.innerBoxes, maxArray)
      } else {
        LegendUtils.adjustNonAlignedInnerBoxes(this.innerBoxes)
      }
      //
      //
      // Dispatch callback to Chartwrapper with adjusted IBs.
      // This callback was originally outside the condition, just below.
      // But this resulted in legend-stacks being moved down
      // with every legendset drawn... (fixed 18.7.18)
      this.props.onGetInnerBoxes(this.innerBoxes)
    }
    // HANDLE LEGEND-SET INNER BOX BOUNDS ends
  }

  // GET KEY STYLE ARRAY
  // Called from assembleLegendSets. Params are
  // panel-specific config object, and key styles from DPs
  getKeyStyleArray(pConfig, styles) {
    // Styles are defined in DPs, by series type
    // If chart is mixed/double, potentially 2 chart-types
    const isMixed = pConfig.scales.isDouble || pConfig.scales.isMixed
    const splitAt = pConfig.scales.splitDataAtCol
    const keyStyleArray = []
    // Pick a 'side'
    let side = 'left'
    if (pConfig.scales.enableScale.right) {
      side = 'right'
    }
    let loopCount = pConfig.seriesCount
    // But pies loop by categories, so...
    if (pConfig.scales[side].type.includes('pie')) {
      loopCount = pConfig.pointCount
    }
    // Loop by series:
    for (let iii = 0; iii < loopCount; iii++) {
      let keyProps = {}
      if (isMixed) {
        if (iii < splitAt) {
          keyProps = this.getKeyStyleProps(
            pConfig.scales.left.type,
            pConfig.scales.left.stacked,
            pConfig.scales.left.thermoDots,
            styles
          )
        } else {
          keyProps = this.getKeyStyleProps(
            pConfig.scales.right.type,
            pConfig.scales.right.stacked,
            pConfig.scales.right.thermoDots,
            styles
          )
        }
      } else {
        const type = pConfig.scales[side].type
        const stacked = pConfig.scales[side].stacked
        const thermoDots = pConfig.scales[side].thermoDots
        keyProps = this.getKeyStyleProps(type, stacked, thermoDots, styles)
      }
      keyStyleArray.push(keyProps)
    }
    return keyStyleArray
  }

  // ASSEMBLE LEGEND SETS
  /*  Called from render to calc how many legendsets to draw.
      Knocks up the JSX with data and IB bounds then renders:
      - the outlying group (as now) with, as its children...
      - however many Legendset components
      And there's an event listener for each legendset which returns
      revised IB bounds, which, once 'complete', are passed back
      to Chartwrapper
      NOTE: desperately needs refactoring
  */
  assembleLegendSets() {
    const config = this.props.config
    const innerboxes = this.innerBoxes
    // Init array of legend sets...
    const legendSets = []
    // Count the number of panels that have legends
    let legendCounter = 0
    // ...each element of which consists of:
    // - a call to a keyed LegendSet with...
    // - legendPrefs: {keyWidth, keyHeight, padding}
    // - innerbox: {x, y, height, width}
    // Maybe I don't need all those props, but leave it open
    // - legendData: an array of objects, each with header and colour properties
    // - a key
    // - a binding to an event handler which awaits the revised innerbox bounds
    //
    // Lookup values for paddings below legends (if any)
    // const legendPaddings = config.legend.padding;
    const legendPaddings = config.background.topPadding.belowLegendBaseline
    // So Legend is doing external triage. Legendset components are 'dumb' and
    // just render a containing group, then a stack of subgroups with
    // key-element and text...
    // Loop by 'panel'
    for (let ibIndex = 0; ibIndex < config.panelArray.length; ibIndex++) {
      const thisData = config.panelArray[ibIndex]
      // Append padding-below value to each innerbox object
      // based on chart type
      this.getPaddingForInnerBox(legendPaddings, innerboxes[ibIndex], thisData)
      // Double/mixed scale
      const isDouble = thisData.scales.isDouble
      const isMixed = thisData.scales.isMixed
      // seriesCount
      let { seriesCount } = thisData
      // Side:
      let side = 'left'
      if (thisData.scales.enableScale.right) {
        side = 'right'
      }
      // No legend if only 1 series; if 2 series, no legend if double scale
      let hasLegend = true
      // Number of data-'columns' per series. Default (non-scatters) is 1
      let cluster = 1
      // Check for scatters or pies:
      // NOTE: should be using the overallChartType prop
      const typeString = `${thisData.scales.left.type}-
        ${thisData.scales.right.type}`
      const isScatter = typeString.includes('scatter')
      const isPie = typeString.includes('pie')
      const isTable = typeString.includes('table')
      if (!isPie) {
        if (isTable) {
          hasLegend = false
        } else if (isScatter) {
          cluster = 2
          if (typeString.includes('sized')) {
            cluster = 3
          }
          if (seriesCount / cluster < 2) {
            hasLegend = false
          } else {
            seriesCount /= cluster
          }
        } else {
          // Non scatters: possible blobs series
          let blobAdjust = 0
          if (thisData.blobs.blobState.column > 0) {
            blobAdjust = 1
          }
          if (seriesCount - blobAdjust === 1) {
            hasLegend = false
          } else if (isDouble && seriesCount - blobAdjust === 2) {
            // Double scale: if only two series we rely upon axis headers
            // and don't need legends
            hasLegend = false
          }
        }
      }
      const lSetObj = {
        hasLegend,
        index: ibIndex,
        seriesCount,
      }
      if (!isTable) {
        const headers = []
        // If it's a double scale, the array remains empty,
        // killing ALL legends
        // NO! If double and seriesCount (-blobs) > 2, also runs
        // Key by series headers...
        let sourceArray = thisData.headers
        let startFrom = 1
        if (isPie) {
          // ...except pies, which key categories
          sourceArray = thisData.categories
          startFrom = 0
        }
        // Take first header from each 'cluster' (ignoring category header)
        for (let iii = startFrom; iii < sourceArray.length; iii += cluster) {
          // Omit any blob header
          if (sourceArray[iii] !== thisData.blobs.blobState.header) {
            headers.push(sourceArray[iii])
          }
        }
        const scales = thisData.scales
        const chartType = scales[side].type
        const stacked = scales[side].stacked
        const thermoDots = scales[side].thermoDots
        // Map series colours:
        let colours = thisData.series[chartType].colours
        if (isDouble || isMixed) {
          colours = thisData.series.colours
        }
        // Function converts to array of legend-data, each element with
        // props 'header' and 'colour'
        const colourMap = ChartUtils.getColourMap(headers, colours)

        // The key styles as defined in DPs
        const styles = config.legend.styles
        const keyStyleArray = this.getKeyStyleArray(thisData, styles)
        // NOTE: can I integrate colours into keyStyleArray?
        lSetObj.headers = headers
        lSetObj.colourMap = colourMap
        lSetObj.mainHeader = thisData.legend.header
        // General legend prefs
        const usePartyColours =
          thisData.series.ukParties || thisData.series.usParties
        lSetObj.prefs = {
          chartType,
          chartWidth: config.background.outerbox.dimensions.width,
          columns: thisData.legend.value,
          drawLeftToRight: config.legend.drawLeftToRight,
          duration: config.other.duration,
          headerPrefs: config.legend.headerText,
          keyStyleArray,
          keySizePrefs: config.legend,
          left: config.background.margins.left,
          metadata: config.metadata,
          padding: config.legend.padding,
          stacked,
          textPrefs: config.legend.text,
          thermoDots,
          usePartyColours,
        }
        lSetObj.prefs.isMixed =
          thisData.scales.isDouble || thisData.scales.isMixed
        // ...and panel-specific innerbox bounds (use all IB props, in case
        // we want to consider wrapping... eventually...)
        lSetObj.prefs.innerbox = innerboxes[ibIndex]
        // Absolute panel left, before any margin adjustment
        // Used to do legend tweaks
        lSetObj.prefs.absoluteLeft = innerboxes[ibIndex].x
        lSetObj.prefs.emVal = config.metadata.emVal
        // Colour lookup:
        lSetObj.prefs.colourLookup = config.metadata.colours
        // And doubleScale:
        // lSetObj.prefs.doubleScale = isDouble;
        // }
        // Increment counter (if, just below, this is
        // zero, no panel has legends, so simply abort)
        if (lSetObj.hasLegend) {
          legendCounter++
        }
      }
      // All legendsets are pushed to the array, even tables,
      // or 1-series charts
      legendSets.push(lSetObj)
    }

    const jsxArray = []
    // If no legends, return unmodified innerboxes
    if (legendCounter === 0) {
      this.props.onGetInnerBoxes(innerboxes)
    } else {
      // So, in theory, legendSets should be an array of set
      // definitions. Knock up the jsx array:
      for (let childI = 0; childI < legendSets.length; childI++) {
        const lSet = Object.assign({}, legendSets[childI])
        const lSetJSX = (
          <SilverLegendSet
            config={lSet}
            key={`legendset-${childI}`}
            onGetInnerBox={this.handleLegendSetInnerBoxBounds}
          />
        )
        jsxArray.push(lSetJSX)
      }
    }

    return jsxArray
  }
  // ASSEMBLE LEGEND SETS ends

  // GET KEY WIDTH/HEIGHT
  // Called from getKeyStyleArray to determine which
  // key-style to use, by series type
  // Params are series-type, stacked-flag,
  // thermo-dots flag, and key styles from DPs
  getKeyStyleProps(type, stacked, thermoDots, styles) {
    let wah = styles.line
    if (type.includes('line') && stacked) {
      wah = styles.linestacked
    } else if (type.includes('thermo')) {
      if (thermoDots) {
        wah = styles.thermodot
      } else {
        wah = styles.thermo
      }
    } else if (type.includes('scatter')) {
      wah = styles.scatter
    } else if (type.includes('bar') || type.includes('column')) {
      wah = styles.barcolumn
    } else if (type.includes('pie')) {
      wah = styles.pie
    }
    return wah
  }

  // RENDER
  render() {
    // There is a potential legendSet for each panel
    const legendSets = Object.assign([], this.state.legendSets)
    const actualSets = []
    for (let i = 0; i < legendSets.length; i++) {
      const thisSet = legendSets[i]
      actualSets.push(thisSet)
    }
    // So are there any legend sets? If not, I don't want any empty groups...
    let legendSetsJsx = null
    if (actualSets.length > 0) {
      legendSetsJsx = (
        <g className="silver-chart-legends-group" id="legends-group">
          {actualSets}
        </g>
      )
    }
    return legendSetsJsx
  }
}

SilverLegends.propTypes = {
  config: PropTypes.object,
  drawLegends: PropTypes.bool,
  onGetInnerBoxes: PropTypes.func.isRequired,
}

export default SilverLegends
