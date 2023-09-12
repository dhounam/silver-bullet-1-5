import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as TextWrapping from '../chartside-utilities/text-wrapping'
import * as ChartUtils from '../chart-utilities'

class SilverLegendSet extends Component {
  // Two props: timeouts for calls to tweakLegendSets
  // and moveLegendSets
  static get defaultProps() {
    return {
      // initialTimeout: 0,
      tweakLegendSetsTimeout: 500,
      moveLegendSetsTimeout: 100,
    }
  }

  componentDidMount() {
    this.handleLegendSet()
  }

  componentDidUpdate() {
    this.handleLegendSet()
  }

  // HANDLE LEGEND SET
  // Called on Mount and Update. Determines whether to draw a
  // legendSet, or, if no legendsets, just return a zero adjustment
  // (e.g. for tables)
  handleLegendSet() {
    const config = this.props.config
    if (config.hasLegend) {
      this.updateLegendHeader()
      this.updateLegend()
    } else {
      // There may be a left-over legendset for
      // a chart prev'y in this panel
      this.clearOutLegendSet(config.index)
      const obj = { tweak: 0, index: config.index }
      this.props.onGetInnerBox(obj)
    }
  }
  // HANDLE LEGEND SET ends

  // CLEAR OUT LEGEND-SET
  // Called from handleLegendSet, to empty any
  // existing legend sets if none are required
  // (Tables)
  clearOutLegendSet(cIndex) {
    const headGroup = d3.select(`.legendheader-group-${cIndex}`)
    const keyGroup = d3.select(`.legendkey-group-${cIndex}`)
    headGroup.selectAll('text').remove()
    keyGroup.selectAll('line').remove()
    keyGroup.selectAll('rect').remove()
    keyGroup.selectAll('circle').remove()
    keyGroup.selectAll('text').remove()
  }
  // CLEAR OUT LEGEND-SET ends

  // UPDATE LEGEND HEADER
  // After mount/update, draw any legend header
  updateLegendHeader() {
    const config = this.props.config
    // Text as array, for binding
    const hString = config.mainHeader
    // 'Arrayify' header for D3
    const headArray = []
    if (typeof hString !== 'undefined' && hString.length > 0) {
      headArray.push(hString)
    }
    const lPrefs = config.prefs
    // Position
    let yPos = lPrefs.innerbox.y
    let xPos = lPrefs.innerbox.x
    // Override for zero-columns, which pushes legend outside right of chart
    const legendOutside = lPrefs.columns === 0
    if (legendOutside) {
      xPos += lPrefs.chartWidth + lPrefs.padding.betweenKeys
      yPos -= lPrefs.padding.belowHeader
    }
    // Context is the indexed legendset group, rendered at bottom:
    const contextGroup = d3.select(`.legendheader-group-${config.index}`)
    const boundHead = contextGroup.selectAll('text').data(headArray)
    // Enter
    boundHead
      .enter()
      .append('text')
      .attr({
        class: 'legend-header',
        fill: lPrefs.headerPrefs.fill,
      })
    boundHead
      .attr({
        x: xPos,
        y: yPos,
        id: (ddd, iii) => {
          let tID = `legend-header-${iii}`
          tID = `${tID}~~~fill:${lPrefs.headerPrefs.fill}`
          tID = `${tID}, justification:${lPrefs.headerPrefs.anchor}`
          return tID
        },
      })
      .style({
        'font-family': lPrefs.headerPrefs.font,
        'font-size': `${lPrefs.headerPrefs.size}px`,
        'text-anchor': lPrefs.headerPrefs.anchor,
      })
      .text((ddd) => ddd)
    boundHead.exit().remove()
  }
  // UPDATE LEGEND HEADER ends

  // APPEND KEY
  // Called from updateAnyLegendType. Appends default
  // line, rect or dot
  appendKey(legendGrp) {
    legendGrp.each(function() {
      const thisLegend = d3.select(this)
      const keyStyle = thisLegend.attr('keyStyle')
      if (keyStyle === 'line') {
        thisLegend.append('line').style('stroke-width', 0)
      } else if (keyStyle === 'dot') {
        thisLegend.append('circle').attr({
          r: 0,
          // Default fill (NOTE: change to background fill eventually)
          fill: '#fff',
        })
      } else {
        thisLegend.append('rect').attr({
          width: 0,
          height: 0,
          // Default fill (NOTE: change to background fill eventually?)
          fill: '#fff',
        })
      }
    })
  }
  // APPEND KEY ends

  // GET LINE YPOS
  // Called from updateLine to calculate y-position of a key line
  getLineYpos(config, iii, isY2) {
    let ypos = config.verticalBase
    // Adjust for header, if any:
    if (config.hasHeader) {
      ypos += config.padding.belowHeader
    }
    // Align by half text-height:
    ypos -= config.textHeight / 2
    // If key height > width, draw vertically
    const drawVertical = config.keyHeight > config.keyWidth
    if (drawVertical) {
      if (isY2) {
        ypos += config.keyHeight / 2
      } else {
        ypos -= config.keyHeight / 2
      }
    }
    // Adjust for row
    if (this.props.config.prefs.drawLeftToRight) {
      ypos += Math.floor(iii / config.colTotal) * config.padding.betweenKeys
    } else {
      ypos += (iii % config.colMax) * config.padding.betweenKeys
    }
    return ypos
  }
  // GET LINE YPOS ends

  // GET LINE XPOS
  getLineXpos(config, iii, isX2) {
    let xPos = config.left
    // If key height > width, draw vertically
    const drawVertical = config.keyHeight > config.keyWidth
    if (drawVertical) {
      // Allow for strokewidth
      xPos += config.keyWidth / 2
    } else if (isX2) {
      // Horizontal: line r/h end point
      xPos += config.keyWidth
    }
    // If I don't adjust columns now, I can retrieve this value later
    if (this.props.config.prefs.drawLeftToRight) {
      xPos += (iii % config.colTotal) * config.colWidth
    } else {
      xPos += Math.floor(iii / config.colMax) * config.colWidth
    }
    return xPos
  }
  // GET LINE XPOS ends

  // UPDATE LINE
  // Called from updateAnyLegendType
  updateLine(seriesBinding, lineConfig) {
    seriesBinding
      .select('line')
      .transition()
      .duration(lineConfig.duration)
      .attr({
        x1: (ddd, iii) => this.getLineXpos(lineConfig, iii, false),
        x2: (ddd, iii) => this.getLineXpos(lineConfig, iii, true),
        y1: (ddd, iii) => this.getLineYpos(lineConfig, iii, false),
        y2: (ddd, iii) => this.getLineYpos(lineConfig, iii, true),
        id: (ddd, iii) => {
          const rID = `legend-keyline-${iii}~~~stroke:${ddd.colour}`
          return rID
        },
      })
      .style({
        stroke: (ddd) => lineConfig.colourLookup[ddd.colour],
        'stroke-width': (ddd, iii) => {
          const def = lineConfig.styles[iii]
          let sWid = def.height
          if (def.height > def.width) {
            sWid = def.width
          }
          return sWid
        },
      })
  }
  // UPDATE LINE ends

  // UPDATE RECT
  // Called from updateAnyLegendType
  updateRect(seriesBinding, rectConfig) {
    seriesBinding
      .select('rect')
      .transition()
      .duration(rectConfig.duration)
      .attr({
        width: (ddd, iii) => rectConfig.styles[iii].width,
        height: (ddd, iii) => rectConfig.styles[iii].height,
        fill: (ddd) => rectConfig.colourLookup[ddd.colour],
        y: (ddd, iii) => {
          // Y-pos is top of key rect -- moving up from baseline
          let ypos = rectConfig.verticalBase
          if (rectConfig.hasHeader) {
            ypos += rectConfig.padding.belowHeader
          }
          // Adjust by half text-height, then, to v-centre-align, half rectHeight
          ypos -= rectConfig.textHeight / 2 + rectConfig.styles[iii].height / 2
          // Adjust for row
          if (this.props.config.prefs.drawLeftToRight) {
            ypos +=
              Math.floor(iii / rectConfig.colTotal) *
              rectConfig.padding.betweenKeys
          } else {
            ypos += (iii % rectConfig.colMax) * rectConfig.padding.betweenKeys
          }
          return ypos
        },
        x: (ddd, iii) => {
          let xPos = rectConfig.left
          if (this.props.config.prefs.drawLeftToRight) {
            xPos += (iii % rectConfig.colTotal) * rectConfig.colWidth
          } else {
            xPos += Math.floor(iii / rectConfig.colMax) * rectConfig.colWidth
          }
          return xPos
        },
        id: (ddd, iii) => {
          let rID = `legend-rect-${iii}`
          rID = `${rID}~~~fill:${ddd.colour}`
          return rID
        },
      })
  }
  // UPDATE RECT ends

  // UPDATE  DOT
  // Called from updateAnyLegendType
  updateDot(seriesBinding, dotConfig) {
    const colCount = dotConfig.colTotal
    seriesBinding
      .select('circle')
      .transition()
      .duration(dotConfig.duration)
      .attr({
        r: (ddd, iii) => dotConfig.styles[iii].width / 2,
        fill: (ddd) => dotConfig.colourLookup[ddd.colour],
        cy: (ddd, iii) => {
          // Y-pos is top of key rect -- moving up from baseline
          let ypos = dotConfig.verticalBase
          if (dotConfig.hasHeader) {
            ypos += dotConfig.padding.belowHeader
          }
          // Adjust by half text-height
          ypos -= dotConfig.textHeight / 2
          // Adjust for row
          if (this.props.config.prefs.drawLeftToRight) {
            ypos += Math.floor(iii / colCount) * dotConfig.padding.betweenKeys
          } else {
            ypos += (iii % dotConfig.colMax) * dotConfig.padding.betweenKeys
          }
          return ypos
        },
        cx: (ddd, iii) => {
          let xPos = dotConfig.left
          if (this.props.config.prefs.drawLeftToRight) {
            xPos += (iii % colCount) * dotConfig.colWidth
          } else {
            xPos += Math.floor(iii / dotConfig.colMax) * dotConfig.colWidth
          }
          xPos += dotConfig.styles[iii].width / 2
          return xPos
        },
        id: (ddd, iii) => {
          let rID = `legend-dot-${iii}`
          rID = `${rID}~~~fill:${ddd.colour}`
          return rID
        },
      })
  }
  // UPDATE DOT ends

  // APPEND TEXT
  // Called from updateAnyLegendType
  appendText(legendGrp, lPrefs) {
    const lText = legendGrp.append('text').style({
      'font-family': lPrefs.textPrefs.font,
      'font-size': `${lPrefs.textPrefs.size}px`,
      'text-anchor': 'start',
      fill: () => lPrefs.colourLookup[lPrefs.textPrefs.fill],
    })
    return lText
  }
  // APPEND TEXT ends

  // UPDATE TEXT
  updateText(seriesBinding, textConfig, lPrefs) {
    const globalThis = this
    const config = this.props.config
    const tPrefs = lPrefs.textPrefs
    const colCount = Math.max(lPrefs.columns, 1)
    // Party colours flag -- see below on non-use
    // const usePartyColours = config.prefs.usePartyColours;
    // Props for wrapping
    const textWrapConfig = {
      wWidth: config.prefs.chartWidth,
      forceTurn: config.prefs.metadata.forceTurn,
    }
    const boundText = seriesBinding.select('text')
    // I call this for dot, rect and line keys, 2 of
    // which I'm killing
    if (boundText[0].length === 0) {
      return
    }
    boundText
      .attr({
        class: (ddd) => ddd.class,
        id: (ddd, iii) => {
          const id = `legend-text-${iii}`
          const fill = textConfig.textFill
          const justification = textConfig.anchor
          const leading = tPrefs.leading
          const tID = ChartUtils.getTextID(id, fill, justification, leading)
          return tID
        },
        x: (ddd, iii) => {
          let xPos = textConfig.left
          if (this.props.config.prefs.drawLeftToRight) {
            xPos += (iii % colCount) * textConfig.colWidth
          } else {
            xPos += Math.floor(iii / textConfig.colMax) * textConfig.colWidth
          }
          // Key width and padding
          const keyStyle = ddd.keyStyle
          xPos += keyStyle.width + textConfig.padding.textGap
          return xPos
        },
        y: (ddd, iii) => {
          // Start from baseline
          let ypos = textConfig.verticalBase
          if (textConfig.hasHeader) {
            ypos += textConfig.padding.belowHeader
          }
          // ...tweaking for 'row'
          if (this.props.config.prefs.drawLeftToRight) {
            ypos += Math.floor(iii / colCount) * textConfig.padding.betweenKeys
          } else {
            ypos += (iii % textConfig.colMax) * textConfig.padding.betweenKeys
          }
          return ypos
        },
        leading: tPrefs.leading,
      })
      .text((ddd) => ddd.header)
      .style({
        fill: () => {
          const col = tPrefs.fill
          // Next comm'd out Mar'21. Don't use party colours for legend label
          // if (usePartyColours) {
          //   col = ddd.colour;
          // }
          return lPrefs.colourLookup[col]
        },
        'font-family': tPrefs.font,
        'font-size': `${tPrefs.size}px`,
        'text-anchor': tPrefs.anchor,
      })
    boundText.call(
      TextWrapping.wrapAllTextElements,
      textWrapConfig,
      globalThis,
      globalThis.afterLegendWrap
    )
  }
  // UPDATE TEXT ends

  // GET ROW MAXES ARRAY
  // Called from afterLegendWrap, to generate an array of the
  //  max number of lines in the key strings in each row...
  getRowMaxesArray(lineCountArray, colCount) {
    // If colCount === 0 (for legend outside chart area),
    // we can wind up in an infinite loop. So, since external
    // legends are always in a single column:
    if (colCount === 0) {
      colCount = 1
    }
    // Now, for legends by columns...
    const lSetCount = lineCountArray.length
    const rowCount = Math.ceil(lSetCount / colCount)
    // Construct empty array of arrays
    const rowColArray = []
    for (let iii = 0; iii < rowCount; iii++) {
      rowColArray.push([])
    }
    // Now fill...
    for (let iii = 0; iii < lSetCount; iii++) {
      let rowNumber = iii % rowCount
      if (this.props.config.prefs.drawLeftToRight) {
        rowNumber = Math.floor(iii / colCount)
      }
      rowColArray[rowNumber].push(lineCountArray[iii])
    }

    // Now I need max linecount from each 'row'
    const rowMaxes = []
    for (let rCount = 0; rCount < rowColArray.length; rCount++) {
      rowMaxes.push(Math.max(...rowColArray[rCount]))
    }
    return rowMaxes
  }
  // GET ROW MAXES ARRAY ends

  // GET ARRAY CHUNKS
  // Currently called from tweakLegendSets, below. But I've a feeling this
  // is duplicated elsewhere so should migrate as a general utility.
  // Converts a 1D array into a 2D array of chunks
  getArrayChunks(myArray, chunkSize) {
    const result = []
    while (myArray.length) {
      result.push(myArray.splice(0, chunkSize))
    }
    return result
  }
  // GET ARRAY CHUNKS ends

  // GET LEGEND-SET CLASS ROOT
  // Called from tweakLegendSets, returns the classname of
  // the group enclosing all legend-sets
  getLegendSetClassRoot(panelNumber, keyType) {
    // Root of class name for legend-set line/rect groups:
    // FIXME: I should be getting element names from a lookup
    // Legend set can use line or rect key...
    let lSetClassRoot = '.series-legend-rect-group'
    if (keyType === 'line') {
      lSetClassRoot = '.series-legend-line-group'
    } else if (keyType === 'dot') {
      lSetClassRoot = '.series-legend-dot-group'
    }
    lSetClassRoot = '.series-legend-pair-group'
    // Extend classname root with panel number:
    lSetClassRoot = `${lSetClassRoot}-${panelNumber}`
    return lSetClassRoot
  }
  // GET LEGEND-SET CLASS ROOT ends

  // TRANSPOSE COLUMN ORIGINS
  // Called from getColumnOrigins. If lSets are drawn by rows,
  // resets order. For example, with 3 colums, turns
  // ABCDE into ACEBD
  // NOTE: I've a nagging feeling that this function is
  // dup'd... somewhere else...
  transposeColumnOrigins(inArray, rowTotal) {
    const outArray = []
    for (let iii = 0; iii < rowTotal; iii++) {
      for (let jjj = iii; jjj < inArray.length; jjj += rowTotal) {
        outArray.push(inArray[jjj])
      }
    }
    return outArray
  }
  // TRANSPOSE COLUMN ORIGINS ends

  // CHUNK LEGENDS BY ROWS
  // Params are flat array of lset widths, and
  chunkLegendsByRows(lArray, colTotal) {
    const myArray = []
    for (let colNo = 0; colNo < colTotal; colNo++) {
      myArray.push([])
      for (let setNo = 0; setNo < lArray.length; setNo += colTotal) {
        const oneSet = lArray.slice(setNo, setNo + colTotal)
        const val = oneSet[colNo]
        if (typeof val !== 'undefined') {
          myArray[colNo].push(val)
        }
      }
    }
    return myArray
  }
  // CHUNK LEGENDS BY ROWS ends

  // GET COLUMN ORIGINS
  // Called from tweakLegendSets; returns an array of column widths
  getColumnOrigins(lSetClassRoot, lSetTotal, rowTotal) {
    const config = this.props.config
    // First, get an array of the on-page width of each legendset
    // (that's key and text, grouped)
    const lSetWidths = []
    for (let lSetNo = 0; lSetNo < lSetTotal; lSetNo++) {
      // Name of specific legendset group
      const lSetClassName = `${lSetClassRoot}-${lSetNo}`
      const thisSet = d3.select(lSetClassName)
      let bbWidth = 0
      if (!thisSet.empty()) {
        bbWidth = thisSet.node().getBBox().width
      }
      lSetWidths.push(bbWidth)
    }
    // Convert flat array to a 2D array of colTotal elements,
    // each an array of widths for legendsets in that column
    /* For example:
      [
        [20, 36, 50],   Col A widths
        [27, 48]        Col B widths
      ]
    */
    const colTotal = Math.max(config.prefs.columns, 1)
    let colWidths = []
    if (this.props.config.prefs.drawLeftToRight) {
      // Kludge for columns: min 1
      colWidths = this.chunkLegendsByRows(lSetWidths, colTotal)
    } else {
      colWidths = this.getArrayChunks(lSetWidths, rowTotal)
    }
    // Next, we reset each legendset to the max width of
    // that column, adding padding and any previous column.
    // The result is a 2D array, by columns, with elements in
    // each 'column' set to the same value
    let cumulativeWidth = 0
    for (let iii = 0; iii < colWidths.length; iii++) {
      // Max width in one col:
      const thisCol = colWidths[iii]
      let maxWidth = Math.max(...thisCol)
      // Add gap between columns
      maxWidth += config.prefs.padding.betweenColumns
      // And add distance so far
      maxWidth += cumulativeWidth
      // maxColWidths.push(maxWidth);
      // Now set each element in chunk to max
      for (let jjj = 0; jjj < thisCol.length; jjj++) {
        thisCol[jjj] = maxWidth
      }
      cumulativeWidth = maxWidth
    }
    // So now we have an array, each of whose elements is the
    // width (including gap) of the column to which that
    // element belongs.
    // However... each column is actually adjusted to the
    // width of the previous column. So I prefix a set of
    // zeroes...
    let flatWidths
    if (this.props.config.prefs.drawLeftToRight) {
      // Flat array of column origins
      const simpleArray = this.simplifyColArray(colWidths)
      // Assign column origins to individual legendsets
      flatWidths = this.columniseOrigins(simpleArray, lSetTotal, colTotal)
    } else {
      flatWidths = colWidths.flat()
      for (let rNo = 0; rNo < rowTotal; rNo++) {
        flatWidths.unshift(0)
        flatWidths.pop()
      }
    }
    // So the result is an array of legendset origins
    return flatWidths
  }
  // GET COLUMN ORIGINS ends

  // SIMPLIFY COL ARRAY
  // Called from getColumnOrigins if order is by rows.
  // Gets a simple array, each of which contains the origin
  //  of one column.
  // And, since we shift each column left, prepends zero.
  // So [[A,A,A],[B,B]] becomes [0, A, B]
  simplifyColArray(cArray) {
    const result = [0]
    for (let iii = 0; iii < cArray.length - 1; iii++) {
      result.push(cArray[iii][0])
    }
    return result
  }
  // SIMPLIFY COL ARRAY ends

  // COLUMNISE ORIGINS
  // Called from getColumnOrigins if order is by rows
  // Assigns values from the flat array of column origins
  // to each legendset
  columniseOrigins(cArray, lSetTotal, colTotal) {
    const result = []
    let counter = 0
    for (let iii = 0; iii < lSetTotal; iii++) {
      result.push(cArray[counter])
      if (counter < colTotal - 1) {
        counter++
      } else {
        counter = 0
      }
    }
    return result
  }
  // COLUMNISE ORIGINS ends

  // GET Y-TWEAKS BY COLUMNS
  // Called from tweakLegendSets to assemble an array of the
  // distances by which legendSets move down to allow for
  // turned lines
  // If sets are drawn by rows
  getYtweaksByRows(lSetClassRoot, lSetTotal, columnCount, rowMaxesArray) {
    const config = this.props.config
    const leading = config.prefs.textPrefs.leading
    // Loop through legendsets
    const yTweakArray = []
    // colCounter trips change of row
    // let colCounter = 0;
    // maxArrayCounter is index in array of max values
    // let maxArrayCounter = 0;
    // let lsCounter = 0;
    let tweak = 0
    // Loop by 'rows'
    for (let rowNo = 0; rowNo < rowMaxesArray.length; rowNo++) {
      // Apply current tweak to this row
      const start = rowNo * columnCount
      const end = start + columnCount
      for (let iii = start; iii < end; iii++) {
        yTweakArray.push(tweak)
      }
      // Number of extra lines of text along this row, as leading
      // to be applied to subsequent rows
      tweak += (rowMaxesArray[rowNo] - 1) * leading
    }
    return yTweakArray
  }
  // GET Y-TWEAKS BY COLUMNS ends

  // GET Y-TWEAKS BY ROWS
  // Called from tweakLegendSets to assemble an array of the
  // distances by which legendSets move down to allow for
  // turned lines
  // If sets are drawn by columns
  getYtweaksByColumns(lSetClassRoot, lSetTotal, rowTotal, rowMaxesArray) {
    const config = this.props.config
    const leading = config.prefs.textPrefs.leading
    // Loop through legendsets, but starting from 2nd row (1st row won't move)
    let rowCounter = 0
    // Initialise tweak value, by which legendsets will be moved down
    let tweak = 0
    const yTweakArray = []
    for (let lSetNo = 0; lSetNo < lSetTotal; lSetNo++) {
      // At the top of each 'column':
      if (lSetNo % rowTotal === 0) {
        rowCounter = 0
        tweak = 0
      } else {
        // Get leading for number of lines in PREVIOUS 'row'
        const lastRowLineCount = (rowMaxesArray[rowCounter - 1] - 1) * leading
        tweak += lastRowLineCount
      }
      // Adjust existing y-pos by tweak:
      yTweakArray.push(tweak)
      rowCounter++
    }
    return yTweakArray
  }
  // GET Y-TWEAKS BY ROWS ends

  // MOVE LEGEND SET
  // Called from tweakLegendSets to set new positions on keys
  moveLegendSet(lSetText, lSetKey, textCoords, keyCoords) {
    // Determine key type:
    let keyType = 'line'
    const keyId = lSetKey.attr('id')
    if (keyId !== null && typeof keyId !== 'undefined') {
      if (keyId.includes('rect')) {
        keyType = 'rect'
      } else if (keyId.includes('dot')) {
        keyType = 'dot'
      }
    }
    // Now reset vertical position:
    lSetText.attr('x', textCoords.x)
    lSetText.attr('y', textCoords.y)
    // But also have to set tspans
    const tSpans = lSetText.selectAll('tspan')
    const id = lSetText.attr('id')
    // Get leading from ID metadata:
    const leading = +id.match(/leading:\d*/)[0].split(':')[1]
    let tSpanCounter = 0
    tSpans.each(function() {
      const xAttr = this.getAttribute('x')
      if (xAttr !== null) {
        this.setAttribute('x', `${textCoords.x}px`)
      }
      const yAttr = this.getAttribute('y')
      let tspanY = +textCoords.y
      if (yAttr !== null) {
        tspanY += leading * tSpanCounter
        tSpanCounter++
        this.setAttribute('y', tspanY)
      }
    })
    if (keyType === 'rect') {
      lSetKey.attr('x', keyCoords.x)
      lSetKey.attr('y', keyCoords.y)
    } else if (keyType === 'line') {
      lSetKey.attr('x1', keyCoords.x1)
      lSetKey.attr('x2', keyCoords.x2)
      lSetKey.attr('y1', keyCoords.y1)
      lSetKey.attr('y2', keyCoords.y2)
    } else {
      lSetKey.attr('cx', keyCoords.cx)
      lSetKey.attr('cy', keyCoords.cy)
    }
  }
  // MOVE LEGEND SET

  // TWEAK LEGEND SETS
  // Called from afterLegendWrap, to move legend-sets down
  // to allow for multi-line key strings, and to move them
  // into columns with set gaps between columns
  // Params are the number of columns over which legends are arranged;
  // an array of the max number of lines in any legend in any one row;
  // and the total number of legendSets
  tweakLegendSets(columnCount, rowMaxesArray, lSetCount) {
    const config = this.props.config
    // Do legends exist? There's an edge case where the
    // user clicks quickly from Single/Mixed to Double and
    // by the time this function is called, the 'Double'
    // execution process has already killed the legends.
    // So look for the main legends group...
    const lName = `.legendkey-group-${config.index}`
    const outerLegendsGroup = d3.select(lName)
    if (outerLegendsGroup.empty()) {
      return
    }
    const rowTotal = rowMaxesArray.length
    // Get key type: line/rect/dot
    let keyType = 'line'
    // // Class name for parent legend-set group:
    const lSetClassRoot = this.getLegendSetClassRoot(config.index, keyType)
    // Original panel-left passed in by parent
    const left = config.prefs.absoluteLeft

    // Multiple loop-throughs seem inescapable. First I have
    // to go through all the on-page legend-sets and get
    // an array of COLUMN origins (one for each element),
    // based on column widths
    const colOrigins = this.getColumnOrigins(lSetClassRoot, lSetCount, rowTotal)
    // I need an array of values to which the y-pos of
    // each element is adjusted, to allow for wrapping
    // in the previous row
    let rowTweaks
    if (this.props.config.prefs.drawLeftToRight) {
      rowTweaks = this.getYtweaksByRows(
        lSetClassRoot,
        lSetCount,
        Math.max(columnCount, 1),
        rowMaxesArray
      )
    } else {
      rowTweaks = this.getYtweaksByColumns(
        lSetClassRoot,
        lSetCount,
        rowTotal,
        rowMaxesArray
      )
    }
    // For clarity:
    //  - colWidths is an array, one element per legendset,
    //    each being the on-page width of the previous column
    //  - rowTweaks is an array, one element per row,
    //    of amounts by which to adjust the y-position of
    //    each legend set in that row

    // Third and (hopefully!) final loop
    for (let lSetNo = 0; lSetNo < lSetCount; lSetNo++) {
      // Name of specific legendset group
      const lSetClassName = `${lSetClassRoot}-${lSetNo}`
      const thisSet = d3.select(lSetClassName)

      // Keys
      let lSetKey = null
      let keyOriginalX = 0
      let keyX = 0
      let keyCoords = {}
      const lSetLineKey = thisSet.select('line')
      const lSetRectKey = thisSet.select('rect')
      const lSetDotKey = thisSet.select('circle')
      if (!lSetRectKey.empty()) {
        keyOriginalX = Number(lSetRectKey.attr('x'))
        keyX = keyOriginalX
        if (columnCount > 0) {
          keyX = left + colOrigins[lSetNo]
        }
        keyCoords = {
          x: keyX,
          y: Number(lSetRectKey.attr('y')) + rowTweaks[lSetNo],
        }
        lSetKey = lSetRectKey
        keyType = 'rect'
      } else if (!lSetLineKey.empty()) {
        // Original x1
        keyOriginalX = +lSetLineKey.attr('x1')
        keyX = keyOriginalX
        let x2 = +lSetLineKey.attr('x2')
        // Width of key, assuming a horizontal line
        const keyWidth = x2 - keyOriginalX
        // If line is vertical (thermos), keyWidth is zero,
        // and we need to move by half stroke-width
        let vLineTweak = 0
        if (keyWidth === 0) {
          vLineTweak = parseFloat(lSetLineKey.style('stroke-width')) / 2
        }
        // Column adjustment
        // NOTE: could be better...
        if (columnCount > 0) {
          keyX = left + vLineTweak + colOrigins[lSetNo]
          x2 = left + vLineTweak + keyWidth + colOrigins[lSetNo]
        }
        keyCoords = {
          x1: keyX,
          x2,
          y1: Number(lSetLineKey.attr('y1')) + rowTweaks[lSetNo],
          y2: Number(lSetLineKey.attr('y2')) + rowTweaks[lSetNo],
        }
        lSetKey = lSetLineKey
        keyType = 'line'
      } else if (!lSetDotKey.empty()) {
        keyOriginalX = +lSetDotKey.attr('cx')
        keyX = keyOriginalX
        if (columnCount > 0) {
          keyX = left + colOrigins[lSetNo]
          keyX += +lSetDotKey.attr('r')
        }
        keyCoords = {
          cx: keyX,
          cy: Number(lSetDotKey.attr('cy')) + rowTweaks[lSetNo],
        }
        lSetKey = lSetDotKey
        keyType = 'circle'
      }
      // Text
      const lSetText = thisSet.select('text')
      // Default is legends outside chart, in which case
      // they don't move
      let textX = Number(lSetText.attr('x'))
      if (columnCount > 0) {
        // How far did keys move? Adjust text accordingly
        const keyMove = keyOriginalX - keyX
        textX -= keyMove
      }
      const textCoords = {
        x: textX,
        y: Number(lSetText.attr('y')) + rowTweaks[lSetNo],
      }
      // We need a moment...
      setTimeout(() => {
        this.moveLegendSet(lSetText, lSetKey, textCoords, keyCoords)
      }, this.props.moveLegendSetsTimeout)
    }
  }
  // TWEAK LEGEND SETS ends

  // AFTER LEGEND WRAP
  // Callback after legend strings have been wrapped.
  afterLegendWrap(globalThis, lineCountArray) {
    const config = globalThis.props.config
    const columnCount = config.prefs.columns
    const rowMaxesArray = globalThis.getRowMaxesArray(
      lineCountArray,
      columnCount
    )
    // So we have an array, by legend-rows, of max number of lines...
    // I have to adjust the positions of legendsets:
    const lSetCount = config.headers.length
    if (rowMaxesArray.length > 0) {
      // I need to wait for the update, so...
      setTimeout(() => {
        globalThis.tweakLegendSets(columnCount, rowMaxesArray, lSetCount)
      }, globalThis.props.tweakLegendSetsTimeout)
      // Then return the tweaks to the Inner Box to Chartwrapper
      globalThis.returnAdjustedInnerBox(config, rowMaxesArray)
    }
  }
  // AFTER LEGEND WRAP ends

  // MAKE LEGEND SET CONFIG
  // Called from updateAnyLegendType to assemble a config object
  // with all properties necessary to draw key and text
  makeLegendSetConfig(lData, lPrefs) {
    const config = this.props.config
    // Legend baseline is text baseline. So rect/line keys are vertically positioned
    // relative to half height of text...
    const verticalBase = lPrefs.innerbox.y
    // But what if there's a legend header...?
    const hString = config.mainHeader
    let hasHeader = false
    const padding = config.prefs.padding
    if (typeof hString !== 'undefined' && hString.length > 0) {
      // verticalBase += padding.belowHeader;
      hasHeader = true
    }
    // Initial left-position of keys:
    let left = lPrefs.innerbox.x
    // Columns:
    let colTotal = +lPrefs.columns
    // Rows
    let rows = Math.ceil(lData.length / colTotal)
    // Override for zero-columns, which pushes legend to right of chart
    const legendOutside = colTotal === 0
    if (legendOutside) {
      colTotal = 1
      left += lPrefs.chartWidth + padding.betweenKeys
      rows = 0
    }
    const colWidth = lPrefs.innerbox.width / colTotal
    // Max number of items in any column
    const colMax = Math.ceil(lData.length / colTotal)
    const legendSetConfig = {
      anchor: lPrefs.textPrefs.anchor,
      colMax,
      colourLookup: lPrefs.colourLookup,
      colTotal,
      colWidth,
      duration: lPrefs.duration,
      hasHeader,
      index: config.index,
      isMixed: lPrefs.isMixed,
      left,
      legendOutside,
      padding,
      rows,
      styles: lPrefs.keyStyleArray,
      textFill: lPrefs.textPrefs.fill,
      textHeight: lPrefs.textPrefs.size * lPrefs.emVal,
      verticalBase,
    }
    // Set keyWidth and keyHeight on legendSetConfig
    this.setOverallKeyWidthAndHeight(legendSetConfig, lPrefs.keyStyleArray)
    return legendSetConfig
  }
  // MAKE LEGEND SET CONFIG ends

  // RETURN ADJUSTED INNER BOX
  // Called from updateLegendLine/Rect to calculate adjustments to Inner Box
  // and return them to caller
  returnAdjustedInnerBox(config, rowLineCountArray) {
    // For 'rect' legends, it's the top padding, extra lines and the height of 1 rect:
    // NOTE: 'dots' will probably be the same, but line-keys will presumably
    // need to align to text baseline...
    // ...unless, of course, legends were drawn outside the chart
    let tweak = 0
    // So as of now, IB top is at baseline of either the header (if any)
    // or the first key...
    if (config.prefs.columns > 0) {
      // Legends are internal, but is there a header?
      // If so, add the gap between header and keys
      if (config.mainHeader.length > 0) {
        tweak += config.prefs.padding.belowHeader
      }
      // Now count rows...
      const padding = config.prefs.padding.betweenKeys
      const leading = config.prefs.textPrefs.leading
      for (let rCount = 0; rCount < rowLineCountArray.length; rCount++) {
        tweak += padding
        tweak += (rowLineCountArray[rCount] - 1) * leading
      }
      tweak -= padding
    }
    const obj = { tweak, index: config.index }
    this.props.onGetInnerBox(obj)
  }
  // RETURN ADJUSTED INNER BOX ends

  // SET OVERALL KEY WIDTH AND HEIGHT
  setOverallKeyWidthAndHeight(legendSetConfig, styleArray) {
    let keyWidth = 0
    let keyHeight = 0
    for (const style in styleArray) {
      const thisStyle = styleArray[style]
      if (thisStyle.width > keyWidth) {
        keyWidth = thisStyle.width
      }
      if (thisStyle.height > keyHeight) {
        keyHeight = thisStyle.height
      }
    }
    legendSetConfig.keyWidth = keyWidth
    legendSetConfig.keyHeight = keyHeight
  }
  // SET OVERALL KEY WIDTH AND HEIGHT ends

  // SERIES BINDING ENTER
  seriesBindingEnter(seriesBinding, config) {
    const enter = seriesBinding
      .enter()
      .append('g')
      .attr(
        'class',
        (ddd, iii) => `series-legend-pair-group-${config.index}-${iii}`
      )
      .attr('id', (ddd, iii) => `legend-${iii + 1}`)
      .attr('keyStyle', (ddd) => {
        const temp = ddd.keyStyle.style
        return temp
      })
    return enter
  }
  // SERIES BINDING ENTER ends

  // UPDATE ANY LEGEND TYPE
  // Called from updateLegend. Forks to series-specific
  // key styles (for mixed/double)
  updateAnyLegendType(lData) {
    const config = this.props.config
    const lPrefs = config.prefs
    // All properties for drawing the legend:
    const setConfig = this.makeLegendSetConfig(lData, lPrefs)
    // Context is the indexed legendset group, rendered below:
    const contextGroup = d3.select(`.legendkey-group-${config.index}`)
    // Bind by series
    // Each data point has properties:
    //   header
    //   colour (the colour name)
    //   keyStyle: style (line/dot/rect), width, height
    const seriesBinding = contextGroup.selectAll('g').data(lData)
    // ENTER
    const seriesLegendEnter = this.seriesBindingEnter(seriesBinding, config)
    // NOTE: what about double/mixed scales
    this.appendKey(seriesLegendEnter)
    if (!seriesBinding.select('line').empty()) {
      // this.improveSetConfig(setConfig, 'line');
      this.updateLine(seriesBinding, setConfig)
    }
    if (!seriesBinding.select('rect').empty()) {
      // this.improveSetConfig(setConfig, 'rect');
      this.updateRect(seriesBinding, setConfig)
    }
    if (!seriesBinding.select('circle').empty()) {
      // this.improveSetConfig(setConfig, 'dot');
      this.updateDot(seriesBinding, setConfig)
    }
    this.appendText(seriesLegendEnter, lPrefs)
    this.updateText(seriesBinding, setConfig, lPrefs)

    // EXIT
    seriesBinding.exit().remove()
    // Callback returns adjustments to Inner Box
    if (lData.length > 0) {
      // this.returnAdjustedInnerBox(setConfig);
    }
  }
  // UPDATE ANY LEGEND TYPE ends

  // UPDATE LEGEND
  // Called from mount/update.
  updateLegend() {
    const config = this.props.config
    const lPrefs = config.prefs
    const keyStyles = lPrefs.keyStyleArray
    // Colours scale
    const colours = config.colourMap
    // Data object: headers, colours and key style
    const lData = colours.domain().map((header, seriesNo) => {
      const obj = {
        header,
        colour: colours(header),
        keyStyle: keyStyles[seriesNo],
      }
      return obj
    })
    // Kill existing legend
    this.updateAnyLegendType([])
    // And recreate
    this.updateAnyLegendType(lData)
  }
  // UPDATE LEGEND ends

  // RENDER
  // Just render the svg groups. Outer group with children
  // for header, and keys
  // Everything else is appended from componentDidMount
  render() {
    const lNo = this.props.config.index
    const outerName = `legendset-group-${lNo}`
    const headName = `legendheader-group-${lNo}`
    const keyName = `legendkey-group-${lNo}`
    return (
      <g className={outerName} id={outerName}>
        <g className={headName} id={headName} />
        <g className={keyName} id={keyName} />
      </g>
    )
  }
}

SilverLegendSet.propTypes = {
  config: PropTypes.object,
  onGetInnerBox: PropTypes.func.isRequired,
  // initialTimeout: PropTypes.number,
  // Because it's a prop of the passed globalThis...
  // eslint-disable-next-line react/no-unused-prop-types
  tweakLegendSetsTimeout: PropTypes.number,
  moveLegendSetsTimeout: PropTypes.number,
}

export default SilverLegendSet
