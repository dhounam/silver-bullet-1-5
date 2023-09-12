// For D3:
/* eslint-disable prefer-reflect, func-names, no-invalid-this,
  consistent-this, no-unused-vars */

// FIXME: this could be a non-React component
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'

// Utilities modules
import * as ChartUtils from '../chart-utilities'
import * as PanelUtils from './panel-utilities'
import * as TextWrapping from '../chartside-utilities/text-wrapping'

class SilverPanels extends Component {
  // DEFAULT PROPS
  static get defaultProps() {
    return {}
  }

  // CONSTRUCTOR
  constructor(props) {
    super(props)
    this.panelArray = []
    // I think I have to track the IB as a global...
    this.innerBoxBounds = []
  }

  componentDidMount() {
    if (this.props.drawPanels) {
      this.updatePanels()
    }
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.drawPanels
  }

  componentDidUpdate() {
    if (this.props.drawPanels) {
      this.updatePanels()
    }
  }

  // ADJUST GLOBAL INNER BOX FOR BELOW-TITLE PADDING
  // Called from updatePanels. Returns entire-chart
  // inner box, adjusted for padding below title cluster
  adjustGlobalInnerBoxForBelowTitlePadding(config) {
    // All-chart inner box
    const globalInnerBox = this.props.innerbox
    // Total number of panels:
    const pTotal = config.panelArray.length
    const topPadding =
      config.background.topPadding.belowTitleClusterBaseline.toPanelFlash
    if (pTotal > 1) {
      globalInnerBox.y += topPadding
      globalInnerBox.height -= topPadding
    }
    return globalInnerBox
  }
  // ADJUST GLOBAL INNER BOX FOR BELOW-TITLE PADDING ends

  // GET HORIZONTAL PANEL GAP
  // Called from updatePanels. Returns horiz. gap
  // between panels, depending upon overall chart width
  getHorizontalPanelGap(outerbox, opX, colLen) {
    // Horizontal padding depends upon overall chart width and number of panels
    // Initially assume the chart is narrow
    const paddingX = opX
    let pGapX = paddingX.narrow
    // But if chart is wide, h-gap depends upon number of panels
    if (outerbox.width >= paddingX.narrowThreshold) {
      pGapX = opX.wideTwo
      if (colLen > 2) {
        pGapX = opX.wideMoreThanTwo
      }
    }
    return pGapX
  }
  // GET HORIZONTAL PANEL GAP ends

  // GET PANEL WIDTH/HEIGHT
  // 2 fcns called from updatePanels to get width
  // and height of ONE panel
  getPanelWidth(pWidth, pGap, colLen) {
    // Deduct gaps
    pWidth -= pGap * (colLen - 1)
    pWidth /= colLen
    pWidth = Math.max(pWidth, 0)
    return pWidth
  }

  getPanelHeight(pHeight, pGap, rowLen) {
    // Take away gap(s) between rows
    pHeight -= pGap * (rowLen - 1)
    pHeight /= rowLen
    pHeight = Math.max(pHeight, 0)
    return pHeight
  }
  // GET PANEL WIDTH/HEIGHT end

  // BUILD INITIAL PANEL ARRAY
  // Called from updatePanels to assemble the initial data object
  // for binding. All I want here is 'location' properties for
  // each panel
  buildInitialPanelArray(globalInnerBox, pHeight) {
    const config = this.props.config
    const pConfig = config.metadata.panels
    // Total number of panels:
    const pTotal = Number(pConfig.total)
    // Given no. of rows, how many cols?
    const rowLen = pConfig.rows
    const colLen = pTotal / rowLen
    const originalPadding = config.panelAttributes.padding
    // Padding between panels: x (between cols) and y (between rows) axes
    // Depends upon overall chart width
    const outerbox = config.background.outerbox.dimensions
    const pGapX = this.getHorizontalPanelGap(
      outerbox,
      originalPadding.between.x,
      colLen
    )
    const pGapY = originalPadding.between.y

    // Props for the panel rect (flash)
    const rectProps = config.panelAttributes.rect

    // Attributes common to *all* panels, rects and headers --
    // Panels:
    const pWidth = this.getPanelWidth(globalInnerBox.width, pGapX, colLen)
    const pHeadAttribs = config.panelAttributes.strings.panelheader

    const panelArray = []
    // Since we're looping by rows, then columns, we need a counter:
    let pCount = 0
    // Drawing row by row...
    for (let rNo = 0; rNo < rowLen; rNo++) {
      // ...and column by column
      for (let cNo = 0; cNo < colLen; cNo++) {
        const pObj = {}
        // Panel 'location'
        pObj.x = globalInnerBox.x + (pWidth + pGapX) * cNo
        pObj.y = globalInnerBox.y + (pHeight + pGapY) * rNo
        pObj.height = pHeight
        // Rect location and ID
        pObj.rectX = pObj.x + Number(rectProps.x)
        pObj.rectY = pObj.y + Number(rectProps.y)
        pObj.rectID = rectProps.id
        // Panel header -- if more than 1 'panel'
        // (forced to string and trimmed)
        let pStr = ''
        if (pTotal > 1) {
          pStr = config.panelArray[pCount].panelheader.toString().trim()
        }
        pObj.content = pStr
        pObj.textX = pObj.x + pHeadAttribs.x
        pObj.textY = pObj.y + pHeadAttribs.y
        pObj.height = pHeight
        panelArray.push(pObj)
        pCount++
      }
    }
    return panelArray
  }
  // BUILD INITIAL PANEL ARRAY ends

  // BUILD INNER BOX ARRAY
  // Called from updatePanels to make array of innerbox-bounds objects
  buildInnerBoxArray(panelArray, pWidth, pHeight, hBaseline) {
    const ibArray = panelArray.map((pObj) => {
      const ibItem = {
        x: pObj.x,
        width: pWidth,
        // Top and y adjust to baseline of (unwrapped) panel header...
        // ...then again by set margin. If there is a header (see just above)
        y: pObj.y + hBaseline,
        height: pHeight - hBaseline,
      }
      return ibItem
    })
    return ibArray
  }
  // BUILD INNER BOX ARRAY ends

  // UPDATE RECT
  // Called from updatePanels to set props on the flash
  // Flash is drawn *above* (sitting on) top of IB
  updateRect(pGrpBinding, rectProps, colours) {
    const rHeight = +rectProps.height
    pGrpBinding
      .select('rect')
      .attr({
        class: 'panel-rect',
        id: (ddd) => `${ddd.rectID}~~~fill:${rectProps.fill}`,
        x: (ddd) => ddd.rectX,
        y: (ddd) => ddd.rectY - rHeight,
        height: rHeight,
        width: +rectProps.width,
      })
      .style({
        fill: colours[rectProps.fill],
      })
  }
  // UPDATE RECT ends

  // UPDATE TEXT
  // Called from updatePanels to set props on header text
  // (All except x and y -- see caller)
  updateText(pHeadText, headProps, colours) {
    pHeadText
      .text((ddd) => ddd.content)
      .attr({
        class: 'panel-header',
        id: (ddd, iii) => {
          const id = `panel-header-${iii}`
          const fill = headProps.fill
          const justification = 'start'
          const leading = headProps.leading
          const tID = ChartUtils.getTextID(id, fill, justification, leading)
          return tID
        },
        leading: headProps.leading,
      })
      .style({
        fill: colours[headProps.fill],
        'font-family': headProps['font-family'],
        'font-size': `${headProps['font-size']}px`,
        'text-anchor': 'start',
      })
  }
  // UPDATE TEXT

  // BIND AND APPEND
  // Called from updatePanels. Sets up binding and appends
  // rect and header
  bindAndAppend(panelsGroup, panelArray) {
    const pGrpBinding = panelsGroup.selectAll('g').data(panelArray)
    // EXIT
    pGrpBinding.exit().remove()
    // ENTER
    const panelGroupEnter = pGrpBinding
      .enter()
      .append('g')
      .attr({
        class: (ddd, iii) => `panel-group-${iii}`,
        id: (ddd, iii) => `panel-group-${iii}`,
      })
    // RECT
    panelGroupEnter.append('rect')
    // HEADER
    panelGroupEnter.append('text')
    //
    return pGrpBinding
  }
  // BIND AND APPEND ends

  // DEAL WITH NO PANELS
  // Called from updatePanels if there's are no panels. Binds
  // an empty array to the selection, so that the exit method
  // removes any panel furniture left over from previous chart...
  dealWithNoPanels(iBox) {
    const panelArray = []
    const panelsGroup = d3.select('.silver-chart-panels-group')
    this.bindAndAppend(panelsGroup, panelArray)
    // Return un-panelled IB as single array element
    this.props.onGetInnerBoxes([iBox])
  }
  // DEAL WITH NO PANELS ends

  // UPDATE PANELS
  updatePanels() {
    const globalThis = this
    const config = this.props.config
    const pConfig = config.metadata.panels
    // Total number of panels:
    const pTotal = Number(pConfig.total)
    if (pTotal < 2) {
      // NOTE: this feels like a whacko kludge...
      this.dealWithNoPanels(this.props.innerbox)
      return
    }
    // Still here? We have panels...
    const globalInnerBox = this.adjustGlobalInnerBoxForBelowTitlePadding(config)
    // Given no. of rows, how many cols?
    const rowLen = pConfig.rows
    const colLen = pTotal / rowLen
    // Colours lookup
    const colours = config.metadata.colours

    // X-padding between panels depends upon overall chart width
    const outerbox = config.background.outerbox.dimensions
    const originalPadding = config.panelAttributes.padding
    const pGapX = this.getHorizontalPanelGap(
      outerbox,
      originalPadding.between.x,
      colLen
    )
    // Y-padding doesn't adjust
    const pGapY = originalPadding.between.y

    // Props for the flash
    const rectProps = config.panelAttributes.rect

    // Attributes common to *all* panels, rects and headers --
    // Panels:
    const pWidth = this.getPanelWidth(globalInnerBox.width, pGapX, colLen)
    // Get height of each panel, after we have allowed
    // for padding between panels:
    const pHeight = this.getPanelHeight(globalInnerBox.height, pGapY, rowLen)
    // IBs will adjust to header baseline (below rect)
    const headProps = config.panelAttributes.strings.panelheader
    const hBaseline = headProps.y

    // Data for binding
    const panelArray = this.buildInitialPanelArray(globalInnerBox, pHeight)
    // Inner boxes held as global for future ref
    this.innerBoxBounds = this.buildInnerBoxArray(
      panelArray,
      pWidth,
      pHeight,
      hBaseline
    )

    // D3 'global panels' binding: parent group for all panel groups
    const panelsGroup = d3.select('.silver-chart-panels-group')

    // Bind data; append rect and header
    const panelGroupBinding = this.bindAndAppend(panelsGroup, panelArray)

    // UPDATE RECT
    this.updateRect(panelGroupBinding, rectProps, colours)
    // For textwrapping call
    const wtConfig = {
      wWidth: pWidth,
      forceTurn: config.metadata.forceTurn,
    }

    // UPDATE TEXT
    const panelHeaderText = panelGroupBinding.select('text')
    // Set all properties...
    this.updateText(panelHeaderText, headProps, colours)
    // ...except x and y, which chain into call to guarantee completion
    panelHeaderText
      .attr({
        x: (ddd) => +ddd.textX,
        y: (ddd) => +ddd.textY,
      })
      .call(
        TextWrapping.wrapAllTextElements,
        wtConfig,
        globalThis,
        globalThis.afterPanelHeaderWrap
      )
    // Wrap text, with callback

    // Exit
    panelGroupBinding.exit().remove()
  }
  // UPDATE PANELS ends

  // AFTER PANEL HEADER WRAP
  // Callback from wrapText. All it does is call top-level function to
  // adjust panels if necessary, then tickle Chartwrapper...
  afterPanelHeaderWrap(globalThis) {
    // *** Previously, I set a delay to let initial transition complete...
    // setTimeout(() => {
    //   globalThis.adjustInnerBoxAndReturn();
    // }, 100);
    // *** But this was causing a problem: if user repeatedly changed chart
    // *** size, innerbox y-value was incrementing during the lag, causing
    // *** the innerbox to move down the chart (and shrink)
    // *** So no wait:
    globalThis.adjustInnerBoxAndReturn()
  }
  // AFTER PANEL HEADER WRAP ends

  // ADJUST INNER BOX AND RETURN
  // Callback from wrapText for panels to adjust innerbox top
  // and height to allow for wrapped panel headers. This doesn't
  // change the panel rect...
  adjustInnerBoxAndReturn() {
    // Not just concerned with 'active' panel: handle ALL innerboxes...
    const config = this.props.config
    // Loop all headers for max line count
    const headers = d3.selectAll('.panel-header')
    const pProps = config.metadata.panels
    // Number of charts per row
    const rowLen = pProps.total / pProps.rows
    // Get leading
    const leading = config.panelAttributes.strings.panelheader.leading
    // Inner boxes:
    const innerBoxes = JSON.parse(JSON.stringify(this.innerBoxBounds))
    // First, get a 1d array of all panel-headers' line-counts
    const pLinesArray = []
    headers.each(function() {
      const head = d3.select(this)
      // I want the number of lines, rather than a distance to
      // move each element. So I don't pass in any leading
      const thisCount = TextWrapping.getTextAndTspansMove(head)
      pLinesArray.push(thisCount)
    })
    // Do charts in panel rows align?
    const panelsAlign = config.panelAttributes.alignChartsInPanels
    if (panelsAlign) {
      // Create a flat array of the max linecounts in each 'row'
      const maxLineCountArray = PanelUtils.createLineCountMaxArray(
        pLinesArray,
        rowLen,
        leading
      )
      // Update array of innerboxes
      PanelUtils.adjustAlignedInnerBoxes(innerBoxes, maxLineCountArray, leading)
    } else {
      // Unaligned charts; set adjustment on each
      PanelUtils.adjustNonAlignedInnerBoxes(innerBoxes, pLinesArray, leading)
    }
    this.props.onGetInnerBoxes(innerBoxes)
    // At this point, the IBs are tight on panel header baselines
    // (So I don't insert padding below the header here)
  }
  // ADJUST INNER BOX AND RETURN ends

  // RENDER
  render() {
    return null
  }
}

SilverPanels.propTypes = {
  config: PropTypes.object,
  drawPanels: PropTypes.bool,
  innerbox: PropTypes.object,
  onGetInnerBoxes: PropTypes.func.isRequired,
}

export default SilverPanels
