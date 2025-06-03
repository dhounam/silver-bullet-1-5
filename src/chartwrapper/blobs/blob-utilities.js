// Anything shared by x- and y-axis blobs...
//    updateBlobHeader draws the blob header
//    configXBlobs draws x-axis (line/column chart) blobs
//    configYBlobs is to come for bar chart blobs

import * as d3 from 'd3';
import * as ChartUtilities from '../chart-utilities';

// GET BLOB-HEAD RECT SIZE
// Called from updateBlobHeader. Returns an object with
// rect height and width, and width of header string
export function getBlobHeadRectSize(config) {
  const blobMeta = config.blobs.blobMeta;
  const headerProps = blobMeta.header;
  const bhObj = {
    height: headerProps.rectHeight,
  };
  // Put header on page to get width
  // Identify the group
  const className = `blob-header-group-${config.chartIndex}`;
  const contextGroup = d3.select(`.${className}`);
  // Put down test text
  const testText = contextGroup
    .append('text')
    .attr('id', 'testText')
    .style({
      'font-family': headerProps.font,
      'font-size': `${headerProps.size}px`,
      leading: headerProps.leading,
    });
  // Actual string
  const hString = config.blobs.blobState.header;
  testText.text(hString);
  const textWidth = testText.node().getComputedTextLength();
  bhObj.width = textWidth + blobMeta.background.padding.horizontal * 2;
  bhObj.textWidth = textWidth;
  testText.remove();
  return bhObj;
}
// GET BLOB-HEAD RECT SIZE ends

// UPDATE BLOB HEADER
// Draws blob header at top right
export function updateBlobHeader(config) {
  const blobMeta = config.blobs.blobMeta;
  const headerProps = blobMeta.header;
  // Actual string
  const hString = config.blobs.blobState.header;
  // Rect height and width, and text width:
  const rectSizeProps = getBlobHeadRectSize(config);
  const textHeight = blobMeta.text.size * blobMeta.text.emVal;
  // Mar'20: move headers outside chart, stacked from top
  let top = -config.bounds.y;
  top += config.chartIndex * rectSizeProps.height;
  const left = config.outerWidth - config.bounds.x;
  const origin = {
    top,
    left,
  };
  // Arrayify the string
  // (If we're here, the header must, I think, exist...)
  const headArray = [hString];
  // Bind to group rendered at bottom:
  const className = `blob-header-group-${config.chartIndex}`;
  const contextGroup = d3.select(`.${className}`);
  const boundHeadGroup = contextGroup
    .selectAll('.blob-header-subgroup')
    .data(headArray);
  // Enter appends subgroup for rect and text
  const bhgEnter = boundHeadGroup
    .enter()
    .append('g')
    .attr({
      class: 'blob-header-subgroup',
      id: 'blob-header-subgroup',
    });

  bhgEnter.append('rect').style({
    fill: () => {
      const fillName = blobMeta.background.fill;
      return config.colourLookup[fillName];
    },
    stroke: () => {
      const sName = blobMeta.background.stroke;
      let stroke = 'none';
      if (sName !== 'none') {
        stroke = config.colourLookup[sName];
      }
      return stroke;
    },
    'stroke-width': blobMeta.background.strokewidth,
    opacity: blobMeta.background.opacity,
  });
  // NOTE: CHECK ANCHOR WORKS
  bhgEnter.append('text').style({
    'font-family': headerProps.font,
    'font-size': `${headerProps.size}px`,
    'text-anchor': headerProps.anchor,
    leading: headerProps.leading,
    fill: () => {
      const fillName = blobMeta.text.fill;
      return config.colourLookup[fillName];
    },
  });

  boundHeadGroup.select('rect').attr({
    x: origin.left,
    y: origin.top,
    width: rectSizeProps.width,
    height: rectSizeProps.height,
    id: () => {
      let bID = 'blob-header-rect~~~';
      const bFill = config.blobs.blobMeta.background.fill;
      bID = `${bID}fill: ${bFill},`;
      const bStr = config.blobs.blobMeta.background.stroke;
      bID = `${bID}stroke: ${bStr},`;
      const bWid = config.blobs.blobMeta.background.strokewidth;
      bID = `${bID}strokewidth: ${bWid}`;
      return bID;
    },
  });

  boundHeadGroup
    .select('text')
    .text(ddd => ddd)
    .transition()
    .duration(config.duration)
    .attr({
      x: origin.left + rectSizeProps.width / 2,
      y: () => {
        let yPos = origin.top + rectSizeProps.height;
        yPos -= (rectSizeProps.height - textHeight) / 2;
        return yPos;
      },
      id: () => {
        let tID = 'blob-header-text';
        tID = `${tID}~~~fill:${blobMeta.text.fill}`;
        tID = `${tID}, justification: center, `;
        tID = `${tID}width: ${rectSizeProps.textWidth}, `;
        tID = `${tID}leading: ${headerProps.leading}`;
        return tID;
      },
    });
  return boundHeadGroup;
}
// UPDATE BLOB HEADER ends

// CONFIG X-BLOBS
// Returns config object for x-axis blobs (line and column charts)
// Params are chart CO, inner box, test flag and side (left/right)
export function configXBlobs(
  chartConfig,
  bounds,
  postYaxisBounds,
  testFlag,
  side,
) {
  const blobs = chartConfig.blobs;
  const chartType = chartConfig.scales[side].type;
  const padding = chartConfig.series[chartType].gap;
  const accum = chartConfig.scales[side].stacked;
  const pointCount = chartConfig.pointCount;
  const gap = chartConfig.series[chartType].gap;
  // Assemble the config object with basic props
  const config = {
    accum,
    bounds,
    blobData: chartConfig.chartData,
    blobs,
    chartIndex: chartConfig.chartIndex,
    chartType,
    colourLookup: chartConfig.colourLookup,
    duration: chartConfig.duration,
    gap,
    groupName: `blob-group-${chartConfig.chartIndex}`,
    indexed: chartConfig.indexDot,
    originalBounds: chartConfig.originalInnerBox,
    outerWidth: chartConfig.outerWidth,
    padding,
    pointCount,
    postYaxisBounds,
    seriesCount: chartConfig.seriesCount,
    testFlag,
  };
  // And append emVal for text:
  config.blobs.blobMeta.text.emVal = chartConfig.emVal;
  // HEADERS:
  // NOTE: this is all dup'd in barchart.js...
  // and there's redundancy in header-extraction, too...
  // Separate first (category) column header from subsequent headers:
  // NOTE: do I really need these?
  const actualHeaders = chartConfig.headers.slice();
  config.catHead = actualHeaders.shift();
  config.seriesHeads = actualHeaders;
  // NOTE ends

  // So, to be clear, the config obj includes properties--
  //      catHead: the category column header
  //      seriesHeads: all subsequent (col 2 etc...) header strings
  //      colourMap: a D3 scale object that maps headers to series colours
  // X-SCALE:
  const xDomain = chartConfig.categories;
  // Line/thermo or column?
  // if (chartType === 'column' || chartType.includes('thermo')) {
  if (chartType === 'column') {
    // Cluster width & padding
    const cwp = ChartUtilities.getSeriesClusterWidthAndPadding(
      chartConfig,
      false,
    );
    const halfClusterWidth = cwp.clusterWidth / 2;
    config.halfClusterWidth = halfClusterWidth;
    config.padding = cwp.padding;
    // On the use of 'padding' here, see columnchart.js > configSeriesColumns
    // Main scale (by data point)
    // config.xMainScale = d3.scale
    //   .ordinal()
    //   .rangeBands([0, config.bounds.width + padding, 0, 0])
    //   .domain(xDomain);
    config.xMainScale = d3.scale
      .ordinal()
      .rangeBands(
        [
          0 - halfClusterWidth,
          config.bounds.width + halfClusterWidth + config.padding,
        ],
        0,
        0,
      )
      .domain(xDomain);
  } else {
    config.xMainScale = d3.scale
      .ordinal()
      .rangePoints([0, config.bounds.width], 0, 0)
      // .rangePoints([0, config.bounds.width, 0, 0])
      .domain(xDomain);
  }
  return config;
}

// CONFIG X-BLOBS ends

// FORMAT BLOB VALUE
// NOTE: dup of AxisUtils.scaleNumberFormat
export function formatBlobVal(val) {
  const valAsArray = val.toString().split('.');
  let format = ',';
  if (valAsArray.length > 1) {
    format = `,.${valAsArray[1].length}f`;
  }
  return format;
}
// FORMAT BLOB VALUE
