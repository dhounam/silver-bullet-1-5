// Allow 'document'
// eslint-disable-next-line no-redeclare
/* global document: false */

import * as d3 from 'd3';

// GET MONTH LENGTH
// Called from getSecondaryAxisFilter. Returns number of days in month...
export function getMonthLength(date) {
  // This works by going to the start of the month *after* the target,
  // then falling back to the previous day, which is, of course,
  // the last day of the target month...
  // (Conveniently, if datePlusOne is 11:December, incrementing by 1
  // jumps to Jan of next year!)
  const datePlusOne = date.getMonth() + 1;
  return new Date(date.getFullYear(), datePlusOne, 1, -1).getDate();
}
// GET MONTH LENGTH ends

// GET COLOUR MAP
// Map colours by series
export function getColourMap(headers, colours) {
  // Args are series-headers (cat header has been removed) and colours
  // Both arrays
  const colourMap = d3.scale
    .ordinal()
    .domain(headers)
    .range(colours);
  return colourMap;
}
// GET COLOUR MAP ends

// GET TEXT ID
// Called from various d3 updates. Puts together an ID to pass
// colour and text-alignment metadata to Illustrator. Note that
// this doesn't include width, which is calculated by Joxer
export function getTextID(id, fill, justification, leading) {
  // I think the assumption is that there's ALWAYS metadata for text...
  let idStr = `${id}~~~`;
  if (typeof fill !== 'undefined') {
    idStr = `${idStr}fill:${fill},`;
  }
  if (typeof justification !== 'undefined') {
    idStr = `${idStr}justification:${justification},`;
  }
  if (typeof leading !== 'undefined') {
    idStr = `${idStr}leading:${leading},`;
  }
  // Strip trailing comma
  return idStr.replace(/,$/, '');
}
// GET TEXT ID ends

// GET COLOUR
// Called from various d3 updates. Passed the element data and
// the colours lookup, converts colour name to value for browser
export function getColour(ddd, colours, isFill) {
  // Stroke or fill?
  let colName = ddd.stroke;
  if (isFill) {
    colName = ddd.fill;
  }
  const colDef = colours[colName];
  // For argument's sake:
  let colVal = '#ccc';
  if (typeof colDef !== 'undefined') {
    colVal = colDef;
  }
  return colVal;
}
// GET COLOUR ends

// GET SILVER CHART WRAPPER STYLE
// Sets outerbox dimensions from config; and extends the 'window'
// width to include any external legends, blob headers or sized-scatter keys...
export function getSilverChartwrapperStyle(config) {
  // Start from existing dimensions
  const outerWidth = config.background.outerbox.dimensions.width;
  const wStyle = {
    height: config.background.outerbox.dimensions.height,
    width: outerWidth,
  };
  // We're going to loop by rows of panels
  const panels = config.metadata.panels;
  const pRows = panels.rows;
  const pCols = panels.total / pRows;
  let pCounter = 0;
  let overallWidthExtra = 0;
  for (let pRowNo = 0; pRowNo < pRows; pRowNo++) {
    // Set row defaults of tweaks for legends or blobs
    let legendExtra = 0;
    let blobExtra = 0;
    let ssKeyExtra = 0;
    for (let pColNo = 0; pColNo < pCols; pColNo++) {
      const pDef = config.panelArray[pCounter];
      // I need to know if it has external legend
      if (pDef.legend.value === 0) {
        legendExtra += outerWidth;
      }
      // Blobs
      if (pDef.blobs.blobState.column > 0) {
        blobExtra += 100;
      }
      // Key for sized scatter
      // NOTE: let's try to get overallChartType working, huh?
      // if (pDef.overallChartType === 'sizedscatter') {
      if (pDef.scales.right.type === 'sizedscatter') {
        ssKeyExtra += 100;
      }
      pCounter++;
    }
    overallWidthExtra = Math.max(
      overallWidthExtra,
      legendExtra,
      blobExtra,
      ssKeyExtra,
    );
  }
  wStyle.width += overallWidthExtra;
  return wStyle;
}
// GET SILVER CHART WRAPPER STYLE ends

// GET CHART KEYS
// Called from all chart type renders. Returns an object
// with all necessary element key strings
export function getKeysAndIds(cIndex) {
  return {
    mainGroupKey: `main-group-key-${cIndex}`,
    xAxisKey: `xaxis-${cIndex}`,
    yAxisKey: `yaxis-${cIndex}`,
    blobsKey: `blobs-key-${cIndex}`,
    barSeriesKey: `bar-series-${cIndex}`,
    colummnSeriesKey: `column-series-key-${cIndex}`,
    thermoSpindlesId: `thermo-spindles-group-${cIndex}`,
    thermoSeriesKey: `thermo-series-key-${cIndex}`,
    lineSeriesKey: `line-series-key-${cIndex}`,
    scatterSeriesKey: `scatter-series-key-${cIndex}`,
    pieSeriesKey: `pie-series-key-${cIndex}`,
    zeroId: `zeroline-group-${cIndex}`,
    contentId: `content-group-${cIndex}`,
  };
}
// GET CHART KEYS ends

// MAP SERIES DATA
// Called from bar/column-seres.updateBars/Columns
// NOTE: why not for for lines and other types...?
// For pies, colours mapped on categories,not headers
// But in either case, we map on *series*
export function mapSeriesData(config, isPie) {
  const colours = config.colourMap;
  let colourLookup = colours;
  // But pies set colours by category
  if (isPie) {
    const pieColours = config.catsColourMap;
    colourLookup = pieColours;
  }
  const chartData = config.chartData;
  const factor = config.factor;
  // First header string is key to category strings
  const catStr = config.catHead;
  // iii is series index
  const mappedData = colours.domain().map((header, iii) => {
    const objA = chartData.map(ddd => {
      let val = ddd[header];
      // Val may be an empty string. Number() would
      // turn it into zero, so...
      if (val !== '') {
        val = Number(val) / factor;
      }
      //
      let lookUp = header;
      if (isPie) {
        lookUp = ddd[catStr];
      }
      const objB = {
        // val is the x-val for columns, y-val for bars
        val,
        category: ddd[catStr],
        // Used for thermos as well as bars/cols, so fill and stroke
        // Pies colour by category; others by series
        fillName: colourLookup(lookUp),
        fill: config.colourLookup[colourLookup(lookUp)],
        strokeName: colourLookup(lookUp),
        stroke: config.colourLookup[colourLookup(lookUp)],
        header,
        seriesNo: iii,
      };
      return objB;
    });
    // No don't: if stacked, substitute zeroes for
    // missing values; otherwise delete
    const dataLen = objA.length - 1;
    for (let jjj = dataLen; jjj >= 0; jjj--) {
      if (objA[jjj].val === '') {
        if (config.accum) {
          objA[jjj].val = 0;
        } else {
          objA.splice(jjj, 1);
        }
      } else {
        // Survivors convert to number,
        objA[jjj].val = Number(objA[jjj].val);
      }
    }
    return objA;
  });
  return mappedData;
}
// MAP SERIES DATA ends

// MAP SCATTER SERIES DATA
// Using simple loops, for sanity's sake
export function mapScatterSeriesData(config) {
  const colours = config.colourMap;
  const chartData = config.chartData;
  // Factors for x and y vals
  const xFactor = config.xFactor;
  const yFactor = config.yFactor;
  const clusterNo = config.clusterNo;
  // NOTE: is next safe?
  const rowTotal = chartData.length;
  const colTotal = Object.keys(chartData[0]).length - 1;
  const mappedData = [];
  for (let colNo = 0; colNo < colTotal; colNo += clusterNo) {
    mappedData.push([]);
  }
  // I need to loop by columns, starting from first data column...
  const headerArray = config.headers;
  // Outer loop is by rows. Each row is an object with properties
  // named to headers
  for (let rowNo = 0; rowNo < rowTotal; rowNo++) {
    const thisRow = chartData[rowNo];
    // Series counter:
    let seriesCounter = 0;
    // Inner loop by 'cells' in 'row':
    for (let cNo = 0; cNo < colTotal; cNo += clusterNo) {
      const xHeader = headerArray[cNo];
      const yHeader = headerArray[cNo + 1];
      const xPoint = thisRow[xHeader];
      const yPoint = thisRow[yHeader];
      // Omit any empty datapoints (which would get set to zero)
      // And omit zeroes on logs
      let valOk = true;
      if (xPoint.length === 0 || yPoint.length === 0) {
        valOk = false;
      } else if (config.leftLog && +xPoint === 0) {
        valOk = false;
      } else if (config.rightLog && +yPoint === 0) {
        valOk = false;
      }
      if (valOk) {
        const valX = Number(xPoint) / xFactor;
        const valY = Number(yPoint) / yFactor;
        const pointObj = {
          valX,
          valY,
          category: thisRow[config.catHead],
          header: xHeader,
          fillName: colours(xHeader),
          fill: config.colourLookup[colours(xHeader)],
          strokeName: colours(xHeader),
          stroke: config.colourLookup[colours(xHeader)],
          seriesNo: seriesCounter,
        };
        if (config.isSized) {
          const zHeader = headerArray[cNo + 2];
          const zPoint = thisRow[zHeader];
          pointObj.valZ = Number(zPoint);
        }
        // The datapoint object has to be pushed to the series
        // array as an *array element*.
        mappedData[seriesCounter].push([pointObj]);
      }
      seriesCounter++;
    }
  }
  return mappedData;
}
// MAP SCATTER SERIES DATA

// GET SERIES BASE VALS
// For stacked charts
export function getSeriesBaseVals(pointCount) {
  const baseVals = [];
  for (let aPt = 0; aPt < pointCount; aPt++) {
    baseVals.push({
      negBase: 0,
      posBase: 0,
    });
  }
  return baseVals;
}
// GET SERIES BASE VALS ends

// MAKE BAR-COL SERIES GROUP BINDING
export function makeBarColSeriesGroupBinding(
  mainSeriesGroup,
  mappedData,
  duration,
  chartType,
) {
  const groupBinding = mainSeriesGroup
    .selectAll('.series-group')
    .data(mappedData);
  // Enter, appending class
  groupBinding
    .enter()
    .append('g')
    .attr('id', (ddd, iii) => `series-group series-${iii}`);
  // No update
  // Exit
  groupBinding
    .exit()
    .selectAll(`.d3-${chartType}-rect`)
    .transition()
    .duration(duration)
    .attr('width', 0);
  // Exit
  groupBinding
    .exit()
    .transition()
    .delay(duration)
    .remove();
  return groupBinding;
}
// MAKE BAR-COL SERIES GROUP BINDING ends

// EXTEND LAYER FILL
// Called from Lineseries.extendAllLayerFills to 'extend' layer cake
// fills to zero by prefixing and appending zero points to path
// In here to work round D3 'this' issue
export function extendLayerFill(fillPath, scaleZero, duration) {
  // Wait until transition is complete. I have to do this the
  // hard way: isolating the first and last elements in the svg path and
  // duplicating them with y-moves to scale-zero
  setTimeout(() => {
    const elem = document.getElementById(fillPath.attr('id'));
    let pathStr = elem.getAttribute('d');
    // Convert string to array
    const pathArray = pathStr.split('L');
    pathStr = pathStr.replace('M', 'L');
    // Drop initial 'M' (moveto). So now entire array is [x,y] vals
    pathArray[0] = pathArray[0].replace('M', '');
    // Get first point, set y-point to zero and prepend to path string
    const firstPt = pathArray[0].split(',');
    // x-coord: just the value
    firstPt[1] = scaleZero;
    // This is now the 'moveto':
    pathStr = `M ${firstPt.join()}${pathStr}`;
    // Ditto last point
    const paLen = pathArray.length - 1;
    const lastPt = pathArray[paLen].split(',');
    lastPt[1] = scaleZero;
    pathStr += `L ${lastPt.join()}`;
    // Reset entire path
    elem.setAttribute('d', pathStr);
    // And, now that the path is complete, make it visible
    elem.setAttribute('opacity', 1);
  }, duration);
}
// EXTEND LAYER FILL ends

// ADD STEPLINE SPUR
// Called from Lineseries.addAllSteplineSpurs to append the short
// horizontal spur at the end of a stepline that ends with a vertical
// In here to work round D3 'this' issue
export function addSteplineSpur(line, spur) {
  const elem = document.getElementById(line.attr('id'));
  let pathStr = elem.getAttribute('d');
  // Convert string to array
  const pathArray = pathStr.split('L');
  const paLen = pathArray.length - 1;
  // Get the last point two points:
  const ultPt = pathArray[paLen].split(',');
  const penUltPt = pathArray[paLen - 1].split(',');
  // If the ult y-value is different from the penult, we need a spur
  if (ultPt[1] !== penUltPt[1]) {
    // Increase x-coord and append to path string
    ultPt[0] = Number(ultPt[0]) + spur;
    pathStr += `L ${ultPt.join()}`;
    // Reset entire path
    elem.setAttribute('d', pathStr);
  }
}
// ADD STEPLINE SPUR ends

// GET SERIES CLUSTER WIDTH AND PADDING
// Called from:
//    ColumnChart.configSeriesColumns
//    MixedChart.configSeriesMixed
//    BarChart.configSeriesBars
// Returns revised clusterwidth and padding, after
// margins of IB have been adjusted for
// projecting elements
// FIXME: duplicates AxisUtils.getHalfClusterWidthForAxis
export function getSeriesClusterWidthAndPadding(config, isBars) {
  let lookup = config.series.column;
  let bound = config.innerBox.width;
  // But, if bar chart:
  if (isBars) {
    lookup = config.series.bar;
    bound = config.innerBox.height;
  }
  const pCountMinusOne = Math.max(config.pointCount - 1, 1);
  // -1 because series range will be one cluster wider than inner box
  // (half-cluster left and right). But mustn't be < 1 !!
  const defaultPadding = lookup.gap;
  // Add up total amount of default padding
  //
  const paddingTotal = pCountMinusOne * defaultPadding;
  let clusterWidth = (bound - paddingTotal) / pCountMinusOne;
  // But what if cluster is too narrow?
  const absoluteMinWidth = lookup.absoluteMinWidth;
  const minWidth = lookup.minWidth;
  const maxWidth = lookup.maxWidth;
  const narrowGap = lookup.narrowGap;
  let padding = defaultPadding;
  // Check for min/max column width...
  if (clusterWidth < absoluteMinWidth) {
    padding = 0;
    clusterWidth = bound / pCountMinusOne;
  } else if (clusterWidth < minWidth) {
    clusterWidth = bound / pCountMinusOne - narrowGap;
    padding = narrowGap;
  } else if (!isBars && clusterWidth > maxWidth) {
    // Max only applies to columns
    clusterWidth = maxWidth;
    const aggregateClusterWidth = clusterWidth * pCountMinusOne;
    padding = (bound - aggregateClusterWidth) / pCountMinusOne;
  }
  return {
    clusterWidth,
    padding,
  };
}
// GET SERIES CLUSTER WIDTH AND PADDING ends

// CHECK FOR FIXED INNER MARGINS
// Called from the various series components (linechart, etc.)
// Specific, as of May'25, to Online Video Landscape
// Checks for fixed inner margins, left and right and overrides
// default dynamic margins.
// Bar and h-thermo charts are an exception, flagged by 3rd arg
export function checkForFixedInnerMargins(innerBox, config, style) {
  const innerMargins = config.innerMargins;
  if (innerMargins.fixed) {
    const origIB = config.originalInnerBox;
    if (typeof style === 'undefined') {
      // So not a bar or hthermo chart
      innerBox.x = origIB.x + innerMargins.left;
      innerBox.width = origIB.width - (innerMargins.left + innerMargins.right);
    } else {
      // Don't override left
      // At right, use new innerbox width... with a tweak--
      // 'Normally', for bar/hthermo charts, the r/h margin is calc'd to
      // the end of the final x-axis label. In this (highly inferential!)
      // case, however, I think I am required to set the fixed margin
      // to the rightmost *tick*. So I need to allow for half the
      // width of the rightmost x-axis label:
      const origRight = origIB.x + origIB.width;
      const ibRight = innerBox.x + innerBox.width;
      const halfLastLabelWidth = origRight - ibRight;
      // So for width:
      innerBox.width -= innerMargins.right - halfLastLabelWidth;
    }
  }
  return innerBox;
}
// CHECK FOR FIXED INNER MARGINS ends
