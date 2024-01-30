/* eslint-disable no-invalid-this, func-names */
/* eslint-disable */
/* global document: false */

import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

// Utilities modules
import * as ChartUtilities from '../chart-utilities'

class SilverSeriesLine extends Component {
  static get defaultProps() {
    return {
      elementNames: {
        outerGroup: 'all-line-series-outer-group',
        seriesGroup: 'line-series-group',
        pointsGroup: 'line-points-group',
        line: 'line-path',
        topLine: 'top-line-path',
        fill: 'fill-path',
        dot: 'line-point',
      },
    }
  }

  constructor(props) {
    super(props)
    // LINE FCN to draw trace
    this.lineFcn = d3.svg
      .line()
      .x((ddd) => props.config.xMainScale(ddd.category))
      .y((ddd) => props.config.yScale(ddd.val))
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    this.updateLines()
    this.updateIndexDot()
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    this.updateLines()
    this.updateIndexDot()
  }

  // ======= Event handler ======

  // LINE CLICK
  // Handles line click event. Params are data (cat and value)
  // and index in overall data.
  // NOTE: This event currently gets passed back up to
  // LineChart, where I do a console.log. Long-term, I might
  // use this to set 'emphasis' on the line... or something.
  // And NOTE that index is series-index (i.e. not point)
  // Comm'd out until this does something useful (e.g. setting date markers)
  // lineClick(pointData) {
  //   this.props.onPassLineClick(pointData);
  // }
  // LINE CLICK ends

  updateIndexDot() {
    const config = this.props.config
    const indexed = config.indexed
    if (indexed.indexFlag) {
      let className = this.props.elementNames.outerGroup
      const cIndex = config.chartIndex
      className = `${className}-${cIndex}`
      const iGrp = d3.select(`#${className}`)
      iGrp.append('circle').attr({
        fill: indexed.fillValue,
        'stroke-width': 0,
        r: indexed.radius,
        id: () => {
          let dId = `index-dot-${config.chartIndex}~~~`
          dId = `${dId}fill: ${indexed.fillName}`
          return dId
        },
        cx: config.xMainScale(indexed.indexCat),
        cy: config.yScale(indexed.value),
      })
    }
  }

  // UPDATE LINE POINTS
  // Called from updateLines to append groups for
  // point-line dots.
  updateLinePoints(asBinding) {
    const globalThis = this
    const className = this.props.elementNames.pointsGroup
    // By series
    asBinding.each(function() {
      const thisPointGroup = d3.select(this)
      // Append group
      const pg = thisPointGroup
        .append('g')
        .attr({ class: className })
        .selectAll('circle')
        .data((ddd) => ddd)
        .enter()
      // Append dots
      globalThis.updateCircles(pg)
    })
  }
  // UPDATE LINE POINTS ends

  // UPDATE CIRCLES
  // Called from updateLinePoints,to draw individual
  // dots on pointline series
  updateCircles(pGroup) {
    const config = this.props.config
    const radius = config.pointRadius
    const dotName = this.props.elementNames.dot
    pGroup
      .append('circle')
      .attr({
        class: dotName,
        id: (ddd, iii) => {
          let idStr = `${dotName}-${iii}`
          idStr = `${idStr}~~~fill:${ddd.strokeName}`
          return idStr
        },
        r: radius,
        cx: (ddd) => {
          const xPos = config.xMainScale(ddd.category)
          return xPos
        },
        cy: (ddd) => {
          const yPos = config.yScale(ddd.val)
          return yPos
        },
      })
      .style({
        fill: (ddd) => ddd.stroke,
      })
  }
  // UPDATE CIRCLES ends

  // ENTER ALL SERIES BINDING
  // Called from updateLines to bind data to series groups, with
  // enter and exit
  enterAllSeriesBinding(outerWrapper, mappedData) {
    const config = this.props.config
    const sgClass = this.props.elementNames.seriesGroup
    const cIndex = config.chartIndex
    const sgID = `${sgClass}-${cIndex}`
    const groupBinding = outerWrapper.selectAll('g').data(mappedData)
    groupBinding
      .enter()
      .append('g')
      .attr({
        class: sgClass,
        // ID suffixed with chartIndex + seriesIndex
        id: (ddd, iii) => `${sgID}-${iii}`,
      })
    // No update
    // Exit
    groupBinding.exit().remove()
    return groupBinding
  }
  // ENTER ALL SERIES BINDING ends

  // MAP LINE SERIES DATA
  mapLineSeriesData(config) {
    // Factor
    const factor = config.factor
    // Data
    const chartData = config.chartData
    // First header string is key to category strings
    const catStr = config.catHead
    // Colours
    const colours = config.colourMap
    // As far as I can see, the data is in the right format:
    // an array of objects with header:value properties
    // Map data (iii is a series index):
    const mappedData = colours.domain().map((header, iii) => {
      const objA = chartData.map((ddd) => {
        const objB = {
          val: ddd[header],
          category: ddd[catStr],
          strokeName: colours(header),
          stroke: config.colourLookup[colours(header)],
          header,
          seriesNo: iii,
        }
        return objB
      })
      // Originally:
      //    unstacked line series remove null values from the series
      //    layer cakes set them to zero
      // But that's idiotic: all missing points now skipped
      const dataLen = objA.length - 1
      for (let jjj = dataLen; jjj >= 0; jjj--) {
        if (objA[jjj].val === '') {
          if (config.accum && config.hasHoles) {
            objA[jjj].val = 0
          } else {
            objA.splice(jjj, 1)
          }
        } else {
          // Survivors convert to number,
          // which is divided by the scale factor
          // (factors were disabled, Oct'20; but anyway...)
          objA[jjj].val = Number(objA[jjj].val) / factor
        }
      }
      // Stepline duplicates each point, except last, setting
      // category to that of next point (final horizontal spur
      // is appended below)
      if (config.isStepline) {
        // Get filtered length
        const filteredLen = objA.length - 1
        for (let jjj = filteredLen - 1; jjj >= 0; jjj--) {
          const newItem = Object.assign([], objA[jjj])
          const nextJ = jjj + 1
          newItem.category = objA[nextJ].category
          objA.splice(nextJ, 0, newItem)
        }
      }
      return objA
    })
    // Unstacked line series in reverse order: modded Jan'24
    if (!config.accum) {
      return mappedData.reverse();
    }
    return mappedData
  }
  // MAP LINE SERIES DATA ends

  // APPEND FILL
  appendFill(asBinding) {
    const className = this.props.elementNames.fill
    asBinding.each(function() {
      const thisSeries = d3.select(this)
      thisSeries
        .append('path')
        .attr({ class: className })
        .style('stroke-width', 0)
    })
  }
  // APPEND FILL ends

  // APPEND LINE
  appendLine(asBinding) {
    const className = this.props.elementNames.line
    asBinding.each(function() {
      const thisSeries = d3.select(this)
      thisSeries
        .append('path')
        .attr({ class: className })
        .style('stroke-width', 0)
    })
  }
  // APPEND LINE ends

  // UPDATE FILL
  updateFill(fBinding, config) {
    const className = this.props.elementNames.fill
    fBinding
      .select(`.${className}`)
      .attr({
        id: (ddd, iii) =>
          `${className}-${config.chartIndex}-${iii}~~~fill:${ddd[0].strokeName}`,
        d: (ddd) => this.lineFcn(ddd),
        opacity: 0,
      })
      .style({
        'stroke-width': 0,
        // Layercake fills use the lineseries 'stroke' property
        fill: (ddd) => ddd[0].stroke,
      })
  }
  // UPDATE FILL ends

  // UPDATE LINE
  // Called from updateLines
  updateLine(lBinding, config, topLineIndex) {
    const className = this.props.elementNames.line
    const stroke = config.stroke
    lBinding
      .select(`.${className}`)
      .attr({
        d: (ddd) => this.lineFcn(ddd),
        // ID uses stroke-name of first item in points array
        id: (ddd, iii) => {
          // By default, use colour for unstacked series
          let sName = ddd[0].strokeName
          // But if stacked:
          if (config.accum) {
            if (iii === topLineIndex.pos || iii === topLineIndex.neg) {
              // Top line
              sName = stroke.topcolour
              sName += ',topline:true'
            } else {
              // Separator
              sName = stroke.defaultcolour
            }
          }
          return `${className}-${config.chartIndex}-${iii}~~~stroke:${sName}`
          // return `${className}-${iii}~~~stroke:${sName}`
        },
      })
      .style({
        stroke: (ddd, iii) => {
          // Default is series-specific line stroke-colour
          let stk = ddd[0].stroke
          if (config.accum) {
            stk = config.colourLookup[stroke.defaultcolour]
            if (iii === topLineIndex.pos || iii === topLineIndex.neg) {
              stk = config.colourLookup[stroke.topcolour]
            }
          }
          return stk
        },
        'stroke-width': (ddd, iii) => {
          // Default is series-specific line stroke-width
          let stw = stroke.width
          if (config.accum) {
            stw = stroke.width
            if (iii === topLineIndex.pos || iii === topLineIndex.neg) {
              stw = stroke.topwidth
            }
          }
          return stw
        },
        'stroke-linecap': stroke.linecap,
        'stroke-linejoin': stroke.linejoin,
        'stroke-miterlimit': stroke.miterlimit,
        fill: 'none',
      })
  }
  // UPDATE LINE ends

  // ACCUMULATE DATA
  // Called from updateLines to accumulate positive and negative
  // values for layer cakes
  accumulateData(mappedLineData) {
    // Array consists of 1 element per point. Each element is an object
    // with props posBase and negBase, each set to zero by default.
    // (Blobbed series has been excluded by now)
    // NOTE: assumption is that stacked line data can have
    // gaps (all series missing a val for one point), but
    // not holes (one series missing a val for one point)
    // Count points:
    const pLen = mappedLineData[0].length
    const baseArray = ChartUtilities.getSeriesBaseVals(pLen)
    for (let sCount = 0; sCount < mappedLineData.length; sCount++) {
      const series = mappedLineData[sCount]
      const hasNeg = series.some((point) => point.val < 0)
      let lookup = 'posBase'
      if (hasNeg) {
        lookup = 'negBase'
      }
      for (let pCount = 0; pCount < pLen; pCount++) {
        mappedLineData[sCount][pCount].val += baseArray[pCount][lookup]
        baseArray[pCount][lookup] = mappedLineData[sCount][pCount].val
      }
    }
  }
  // ACCUMULATE DATA ends

  // EXTEND ALL LAYER FILLS
  // Called from updateLines. Loops through all series groups,
  // isolates fills and calls fcn to extend them to zero baseline
  extendAllLayerFills(allSeriesBinding, config) {
    const className = this.props.elementNames.fill
    const scaleZero = config.yScale(0)
    allSeriesBinding.each(function() {
      const seriesGrp = d3.select(this)
      // This is the fill in the series group:
      const fill = seriesGrp.select(`.${className}`)
      // In ChartUtilities to work round D3-this
      ChartUtilities.extendLayerFill(fill, scaleZero, config.duration)
    })
  }
  // EXTEND ALL LAYER FILLS ends

  // ADD ALL STEPLINE SPURS
  // Called from updateLines. Loops through all series groups,
  // isolates steplines/fills and calls fcn to append spur at end
  addAllSteplineSpurs(allSeriesBinding, spur, accum) {
    const lineName = this.props.elementNames.line
    const fillName = this.props.elementNames.fill
    allSeriesBinding.each(function() {
      const seriesGrp = d3.select(this)
      // This is the line in the series group:
      const line = seriesGrp.select(`.${lineName}`)
      // In ChartUtilities to work round D3-this
      ChartUtilities.addSteplineSpur(line, spur)
      // Fills if stacked
      if (accum) {
        const fill = seriesGrp.select(`.${fillName}`)
        ChartUtilities.addSteplineSpur(fill, spur)
      }
    })
  }
  // ADD ALL STEPLINE SPURS ends

  // MOVE TOP LINE TO FRONT
  // Called from updateLines. Since the layers of the cake have been
  // restacked in reverse order, the top line must be moved to front
  // (so that, if there's a zero value, it eclipses other lines)
  moveTopLineToFront(asb) {
    const lineName = this.props.elementNames.line
    const topLineName = this.props.elementNames.topLine
    const config = this.props.config
    // Series ID: name + chartIndex + seriesIndex
    const cIndex = config.chartIndex
    // Last series is 'top'. Can't use seriesCount, in case
    // blobs have eaten a series. But count series headers.
    const sIndex = config.seriesHeads.length - 1
    let sgID = this.props.elementNames.seriesGroup
    sgID = `${sgID}-${cIndex}-${sIndex}`
    let myPath
    asb.each(function() {
      const seriesGrp = d3.select(this)
      if (seriesGrp.attr('id') === sgID) {
        // Line (i.e. not fill) of layer
        myPath = seriesGrp.select(`.${lineName}`)
      }
    })
    // Duplicate to front
    const myNode = myPath.node()
    const dupNode = d3.select(
      myNode.parentNode.parentNode.insertBefore(
        myNode.cloneNode(true),
        myNode.nextSibling
      )
    )
    // ID changes: first part changes, but colour name retained
    // for Joxer
    const oldId = dupNode.attr('id')
    dupNode.attr({
      id: () => {
        const splitId = oldId.split('~~~')
        let newId = topLineName
        newId = `${newId}~~~${splitId[1]}`
        return newId
      },
    })
    // Delete the original path
    myPath.remove()
  }
  // MOVE TOP LINE TO FRONT ends

  // INVERT LAYER CAKE
  // Called from updateLines to invert layer cake stacking, so that lower
  // layers are in front...
  invertLayerCake(className, seriesCount) {
    const parent = document.getElementById(className)
    const kids = parent.children
    const kidsCount = kids.length
    for (let iii = kidsCount - 1; iii >= 0; iii--) {
      parent.appendChild(kids[iii])
    }
    // This may no longer (Jun'21) be relevant, but in the past a
    // double-render from Monteux was leaving us with duplicates. This isn't
    // anything to do with this function, as far as I can make out; but
    // it seems like as good a place as any to catch it...
    if (kidsCount > seriesCount) {
      for (let iii = kidsCount - 1; iii >= seriesCount; iii--) {
        parent.childNodes[iii].remove()
      }
    }
  }
  // INVERT LAYER CAKE ends

  // GET TOP LINE INDEX
  // Called from updateLines. Returns indices of top and (if neg) bottom series
  getTopLineIndex(mappedLineData) {
    const getSum = (total, oneVal) => total + oneVal
    // Default
    const topLineObj = {
      pos: -1,
      neg: -1,
    }
    let posVal = 0
    let negVal = 0
    // Loop through series. I add up all vals in the series. The series
    // with the highest or lowest accum'd total are the top and bottom.
    for (let serNo = 0; serNo < mappedLineData.length; serNo++) {
      const thisSer = mappedLineData[serNo]
      // Add up all vals for this series
      const serTotal = thisSer.map((ser) => ser.val).reduce(getSum)
      if (serTotal >= posVal) {
        topLineObj.pos = serNo
        posVal = serTotal
      }
      if (serTotal <= negVal) {
        topLineObj.neg = serNo
        negVal = serTotal
      }
    }
    return topLineObj
  }
  // GET TOP LINE INDEX ends

  // UPDATE LINES
  updateLines() {
    const config = this.props.config
    // Context:
    // Outer line-series group, created in render
    // Use ID, which is numbered by chartIndex
    let gID = `#${this.props.elementNames.outerGroup}-${config.chartIndex}`
    // And append left/right marker for mixed/double
    gID = `${gID}${config.mixedID}`
    const outerWrapper = d3.select(gID)
    // Style options
    const accum = config.accum
    const isPointline = config.isPointline
    const isStepline = config.isStepline
    // Map the actual series data:
    // As far as I can see, the data is in the right format:
    // an array of objects with header:value properties
    const mappedLineData = this.mapLineSeriesData(config)
    // mappedData is an array of arrays, each of which represents a series
    // Each series sub-array consists of <pointCount> objects
    // defining one data point and with properties...
    //    category: the category string
    //    fill: fill colour
    //    val: the 'internal', *unscaled*, *unstacked* value of THIS point
    // For layer cakes, I'd have to prefix first and last elements to
    // each sub-array, with zero values...

    // Accumulate values for layer cake
    // (NOTE: may need revisit if actual values are required...
    // ...in which case I'd need a separate 'accumVal' property)
    let topLineIndex = {}
    if (accum) {
      this.accumulateData(mappedLineData)
      // I need to know which are the top lines (+/-)
      topLineIndex = this.getTopLineIndex(mappedLineData)
    }
    // Bind data to outer group
    const allSeriesBinding = this.enterAllSeriesBinding(
      outerWrapper,
      mappedLineData
    )

    if (accum) {
      this.appendFill(allSeriesBinding)
      this.updateFill(allSeriesBinding, config)
      this.appendLine(allSeriesBinding)
      this.updateLine(allSeriesBinding, config, topLineIndex)
    } else if (isPointline) {
      this.appendLine(allSeriesBinding)
      this.updateLine(allSeriesBinding, config, topLineIndex)
      this.updateLinePoints(allSeriesBinding)
    } else {
      this.appendLine(allSeriesBinding)
      this.updateLine(allSeriesBinding, config, topLineIndex)
    }
    // Steplines: extra points were added when data was mapped

    // Steplines add a horizontal spur at the end
    if (isStepline) {
      const spur = config.steplineSpur
      // So I can turn off spur by setting to zero in DPs
      // (which is the case, Jun'21)
      if (spur > 0) {
        this.addAllSteplineSpurs(allSeriesBinding, spur, accum)
      }
    }

    // Layer cake tweaks need a moment for everything to draw...
    if (accum) {
      setTimeout(() => {
        this.tweakLayerCake(allSeriesBinding)
      }, 100)
    }
  }
  // UPDATE LINES ends

  // TWEAK LAYER CAKE
  // Called from updateLines. Layer cake:
  //      inverts stacking;
  //      extends fills to zero line;
  //      moves top line to front
  tweakLayerCake(asBinding) {
    const config = this.props.config
    let className = this.props.elementNames.outerGroup
    className = `${className}-${config.chartIndex}${config.mixedID}`
    this.invertLayerCake(className, config.seriesCount)
    this.extendAllLayerFills(asBinding, config)
    this.moveTopLineToFront(asBinding)
  }
  // TWEAK LAYER CAKE ends

  // MAKE SERIES JSX
  // Called from render to assemble JSX for the
  // line series outer wrapper
  // Other elements are appended on the fly
  makeSeriesJSX(config) {
    const eNames = this.props.elementNames
    const outerGroupClass = eNames.outerGroup
    const cIndex = config.chartIndex
    let outerGroupId = `${eNames.outerGroup}-${cIndex}`
    outerGroupId = `${outerGroupId}${config.mixedID}`
    return <g className={outerGroupClass} id={outerGroupId} />
  }

  // RENDER
  render() {
    const config = this.props.config
    const jsx = this.makeSeriesJSX(config)
    return jsx
  }
}
// MAKE SERIES JSX

SilverSeriesLine.propTypes = {
  config: PropTypes.object,
  elementNames: PropTypes.object,
  // onPassLineClick is never tripped, but may return...
  // onPassLineClick: PropTypes.func,
}

export default SilverSeriesLine
