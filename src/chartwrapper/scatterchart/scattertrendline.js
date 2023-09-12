// Called from ScatterSeries to add trendlines

// ADD TRENDLINE GROUP
// Called from controlTrendlines to create group
export function addTrendlineGroup(parentGroup, grpIndex) {
  const trendlineGroup = parentGroup.append('g').attr({
    id: `trendline-group-${grpIndex}`,
    className: `trendline-group-${grpIndex}`,
  })
  return trendlineGroup
}
// ADD TRENDLINE GROUP ends

// LEAST SQUARES COEFFICIENT
// Called from getTrendData
// Lifted from: https://www.mathsisfun.com/data/least-squares-regression.html
export function leastSquares(vals) {
  const pointCount = vals.length
  // Step 1: For each (x,y) calculate x**2 and x*y
  // forming array of objects
  const step1 = vals.map((point) => {
    return {
      x: point[0],
      y: point[1],
      xSq: point[0] ** 2,
      xy: point[0] * point[1],
    }
  })
  // Step 2: Sum x, y, x**2 and x*y
  const reducer = (accum, current) => {
    const x = accum.x + current.x
    const y = accum.y + current.y
    const xSq = accum.xSq + current.xSq
    const xy = accum.xy + current.xy
    const iam = { x, y, xSq, xy }
    return iam
  }
  const sumUp = step1.reduce(reducer, {
    x: 0,
    y: 0,
    xSq: 0,
    xy: 0,
  })
  // Calculate slope
  const numer = pointCount * sumUp.xy - sumUp.x * sumUp.y
  const denom = pointCount * sumUp.xSq - sumUp.x ** 2
  const slope = numer / denom
  // Intercept
  const intercept = (sumUp.y - slope * sumUp.x) / pointCount
  // Formula is y = slope * x + intercept
  const result = vals.map((point) => {
    const yVal = slope * point[0] + intercept
    return [point[0], yVal]
  })
  return result
}
// LEAST SQUARES COEFFICIENT ends

// GET TREND DATA
// Called from appendTrendLine to dig out the start
// and end points for the trendline
export function getTrendData(chartData, tHeaders, xFactor, yFactor) {
  const { xHead, yHead } = tHeaders
  // Values as numbers, arrayifing points, filtering out blanks
  const valsArray = chartData
    .filter((point) => {
      return point[xHead].length > 0 && point[yHead].length > 0
    })
    .map((point) => {
      // Apply any factor to values:
      return [+point[xHead] / xFactor, +point[yHead] / yFactor]
    })
  // Sort
  valsArray.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
  // Get complete array of regression point values
  const leastSquaresCoeff = leastSquares(valsArray)
  const lscLen = leastSquaresCoeff.length
  // Array as x1, y1, x2, y2
  // Use first and last elements only, and wrap
  // the array inside an array, for D3
  return [
    // [
    leastSquaresCoeff[0][0],
    leastSquaresCoeff[0][1],
    leastSquaresCoeff[lscLen - 1][0],
    leastSquaresCoeff[lscLen - 1][1],
    // ],
  ]
}
// GET TREND DATA ends

// UPDATE TREND-LINES
// Called from appendAllTrendlines to draw lines
// Args are the config object; the data array to bind,
// and the group to bind to
export function updateTrendlines(config, tDataArray, trendlineGroup) {
  const xScale = config.xScale
  const yScale = config.yScale
  const tlProps = config.seriesPrefs.trendline
  const trendLines = trendlineGroup.selectAll('line').data(tDataArray)
  trendLines
    .enter()
    .append('line')
    .attr({
      class: 'trendline',
      x1: (ddd) => xScale(ddd.tData[0]),
      y1: (ddd) => yScale(ddd.tData[1]),
      x2: (ddd) => xScale(ddd.tData[2]),
      y2: (ddd) => yScale(ddd.tData[3]),
      id: (ddd, iii) => {
        let idStr = `scatter-trendline-${iii}`
        idStr = `${idStr}~~~stroke:${ddd.tColour}`
        return idStr
      },
    })
    .style({
      stroke: (ddd) => config.colourLookup[ddd.tColour],
      'stroke-width': tlProps.strokewidth,
      'stroke-dasharray': tlProps.dash,
    })
}
// UPDATE TREND-LINES ends

// GET HEADERS ARRAY
// Called from appendAllTrendlines to assemble an
// array of x/y header pairs
export function getHeadersArray(config) {
  const clusterNo = config.clusterNo
  const headers = config.headers
  const trendHeadArray = []
  for (let hNo = 0; hNo < headers.length; hNo += clusterNo) {
    trendHeadArray.push({
      xHead: headers[hNo],
      yHead: headers[hNo + 1],
    })
  }
  return trendHeadArray
}
// GET HEADERS ARRAY ends

// APPEND ALL TRENDLINES
// Called from controlTrendlines
export function appendAllTrendlines(config, trendlineGroup) {
  // Get an array of x/y headers for each series
  const trendHeadArray = getHeadersArray(config)
  // Assemble array of series-specific trendline data
  const tDataArray = trendHeadArray.map((tHeads, tNo) => {
    return {
      tColour: config.seriesPrefs.colours[tNo],
      // Calculate coords for trendline
      tData: getTrendData(
        config.chartData,
        tHeads,
        config.xFactor,
        config.yFactor
      ),
    }
  })
  // Draw trendlines
  updateTrendlines(config, tDataArray, trendlineGroup)
}
// APPEND ALL TRENDLINES ends

// CONTROL TRENDLINES
// Called from scatterSeries.updateScatter
export function controlTrendlines(config, outerGroup) {
  const trendlineGroup = addTrendlineGroup(outerGroup, config.chartIndex)
  appendAllTrendlines(config, trendlineGroup)
}
// CONTROL TRENDLINES ends
