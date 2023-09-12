// Called from ScatterSeries to add z-axis
// header, if there is one

import * as d3 from 'd3'
import * as TextWrapping from '../chartside-utilities/text-wrapping'

// ADD KEY GROUP
// Called from addZHead to create header group
export function addKeyGroup() {
  // Append to parent content group:
  const id = 'content-group-0'
  const parentGroup = d3.select(`#${id}`)
  const keyGroup = parentGroup.append('g').attr({
    id: 'zaxis-header-group',
    className: 'zaxis-header-group',
  })
  return keyGroup
}
// ADD KEY GROUP ends

// TWEAK T-SPANS
// Called directly from appendText to move header tSpans
// 'move' is leading. This process is usually done via a
// callback, through text-wrapping; but here it has to be direct
export function tweakTspans(headText, move) {
  const myHead = headText[0][0]
  const childCount = myHead.children.length
  for (let cNo = 1; cNo < childCount; cNo++) {
    const child = myHead.children[cNo]
    const cPos = +child.getAttribute('y') + move
    child.setAttribute('y', cPos)
  }
}
// TWEAK T-SPANS ends

// APPEND TEXT
export function appendText(config, location, keyGroup) {
  // Content is z column header from first cluster
  // const hStr = config.headers[2];
  const hStr = config.zAxisHeader
  const tPrefs = config.seriesPrefs.zkey
  //
  // Positions
  const rad = tPrefs.dotRadius
  const gap = tPrefs.gap
  const xPos = location.x + rad + gap
  const halfTextHeight = (config.emVal * tPrefs.fontSize) / 2
  let yPos = location.y + halfTextHeight
  yPos += config.chartIndex * (rad * 3)
  // Text format
  const fillName = tPrefs.textFill
  const fillVals = config.colourLookup[fillName]
  const headText = keyGroup
    .append('text')
    .attr({
      x: xPos,
      y: yPos,
    })
    // NOTE: anchor was originall set in DPs, but is
    // hard-wired now that the key is drifting arbitrarily
    // around the place...
    .style({
      'text-anchor': 'start',
      'font-family': tPrefs.font,
      'font-size': `${tPrefs.fontSize}px`,
      leading: tPrefs.leading,
      fill: fillVals,
    })
    .text(hStr)
  headText.attr({
    id: () => {
      let tID = 'zaxis-header-string~~~'
      tID = `${tID}fill:${fillName}`
      tID = `${tID}, leading:${tPrefs.leading}`
      tID = `${tID}, justification: start`
      return tID
    },
  })
  // Text-wrapping, with callback to tweak tSpans
  const wtConfig = {
    wWidth: 1000,
    forceTurn: config.forceTurn,
  }
  // Text wrapping (no callback, etc.)
  headText.call(TextWrapping.wrapAllTextElements, wtConfig)
  // Handle tSpans after a timeOut to allow TextWrapping
  // to create tSpans
  setTimeout(() => {
    tweakTspans(headText, tPrefs.leading)
  }, 50)
}
// APPEND TEXT ends

// APPEND DOT
export function appendDot(config, location, keyGroup) {
  const kPrefs = config.seriesPrefs.zkey
  const dotRad = kPrefs.dotRadius
  const dotStrokeWidth = kPrefs.dotStrokeWidth
  const dotStrokeName = kPrefs.dotStroke
  const dotStroke = config.colourLookup[dotStrokeName]
  const dotFill = kPrefs.dotFill
  // Inherited position is top right of chart
  const dotX = location.x
  let dotY = location.y
  dotY += config.chartIndex * (dotRad * 3)
  keyGroup
    .append('circle')
    .attr({
      id: () => {
        let id = 'zaxis-header-dot~~~'
        const fill = dotFill
        id = `${id}fill: ${fill},`
        const sName = dotStrokeName
        id = `${id}stroke: ${sName}`
        return id
      },
      cx: dotX,
      cy: dotY,
      r: dotRad,
    })
    .style({
      fill: dotFill,
      'stroke-width': dotStrokeWidth,
      stroke: dotStroke,
    })
}
// APPEND DOT ends

// GET KEY LOCATION
// Origin for key
export function getKeyLocation(config) {
  const bounds = config.originalBounds
  // This is pretty arbitrary
  const x = config.outerWidth + 5
  const y = Math.max(5, 0 - bounds.y)
  return { x, y }
}
// GET KEY LOCATION

// ADD Z KEY
// Called from scatterSeries.updateScatter
export function addZKey(config, outerGroup) {
  const keyGroup = addKeyGroup(outerGroup)
  const keyLocation = getKeyLocation(config)
  appendDot(config, keyLocation, keyGroup)
  appendText(config, keyLocation, keyGroup)
}
// ADD Z KEY ends

// GET SIZED DOT SCALE
// Called from ScatterSeries.appendDot to map z-axis
// values to scale range
export function getSizedDotScale(config) {
  // const rangeMin = config.zAxisBounds.min;
  const rangeMin = 0
  const rangeMax = config.zAxisBounds.max
  const dotRange = [rangeMin, rangeMax]
  // const minVal = config.minZval;
  const minVal = 0
  const maxVal = config.maxZval
  const dotDomain = [minVal, maxVal]
  return d3.scale
    .sqrt()
    .domain(dotDomain)
    .range(dotRange)
}
/*
The way scales work in D3 is that they map input values 
(defined by .domain()) to output values (defined by .range()). So
  d3.scale.sqrt().domain([1, 100]).range([10, 39])
maps values from 1 to 100 to the 10 to 39 range. 
That is, 1 corresponds to 10 and 100 to 39.
*/
// GET SIZED DOT SCALE ends

export function getMinXandZvalues(chartData, headers) {
  const myData = JSON.parse(JSON.stringify(chartData))
  const clusterNo = 3
  // Isolate the x- and y-headers
  const headArray = []
  for (let hNo = 1; hNo < headers.length; hNo += clusterNo) {
    headArray.push({
      x: headers[hNo],
      z: headers[hNo + 2],
    })
  }
  // Get default x min from first point
  let xMin = +myData[0][headers[1]]
  // let zMax = +myData[0][headers[3]];
  //
  const pointCount = myData.length
  // const seriesLen = myData[0].length;
  let rowsWithMinXval = []
  // So we're looping through, point by point
  for (let pNo = 0; pNo < pointCount; pNo++) {
    const thisPoint = myData[pNo]
    // Now check x-mins
    // (there may be several series)
    const xMinArray = []
    for (const head in headArray) {
      const thisHead = headArray[head].x
      xMinArray.push(+thisPoint[thisHead])
    }
    const rowMin = Math.min(...xMinArray)
    if (rowMin < xMin) {
      rowsWithMinXval = [thisPoint]
      xMin = rowMin
    } else if (rowMin === xMin) {
      rowsWithMinXval.push(thisPoint)
    }
  }
  // So we should emerge with an array of points
  // that have a min x-val in at least 1 series
  // However, each point may have vals for >1 series...
  const zMaxes = []
  for (const aPoint in rowsWithMinXval) {
    const thisRow = rowsWithMinXval[aPoint]
    for (const head in headArray) {
      const xHead = headArray[head].x
      const zHead = headArray[head].z
      if (+thisRow[xHead] === xMin) {
        zMaxes.push(thisRow[zHead])
        // zMax = thisRow[zHead];
      }
    }
  }
  // z could be < 0; trap downstream
  return {
    x: xMin,
    z: Math.max(...zMaxes),
  }
}
