/*

*/

// Functions called from specifySeriesPrefs return an
// object with default styling for chart type...
// BAR
export function getBarProps(barProps, seriesCount) {
  return {
    colours: barProps.colours[seriesCount],
    cluster: barProps.cluster,
    gap: barProps.gap,
    absoluteMinWidth: barProps.absoluteMinWidth,
    minWidth: barProps.minWidth,
    maxWidth: barProps.maxWidth,
    narrowGap: barProps.narrowGap,
    stroke: barProps.stroke,
  };
}
// STACKED BAR
export function getStackedBarProps(sProps, seriesCount) {
  // Stacked bars use some 'bar' props; so arg 1 is
  // a level 'back'
  return {
    colours: sProps.stackedbar.colours[seriesCount],
    cluster: sProps.bar.cluster,
    gap: sProps.bar.gap,
    absoluteMinWidth: sProps.bar.absoluteMinWidth,
    minWidth: sProps.bar.minWidth,
    maxWidth: sProps.bar.maxWidth,
    narrowGap: sProps.bar.narrowGap,
    stroke: sProps.bar.stroke,
  };
}
// COLUMN
export function getColumnProps(colProps, seriesCount) {
  return {
    colours: colProps.colours[seriesCount],
    cluster: colProps.cluster,
    gap: colProps.gap,
    absoluteMinWidth: colProps.absoluteMinWidth,
    minWidth: colProps.minWidth,
    maxWidth: colProps.maxWidth,
    narrowGap: colProps.narrowGap,
    stroke: colProps.stroke,
  };
}
// STACKED COLUMN
export function getStackedColumnProps(sProps, seriesCount) {
  // Stacked columns use 'bar' and 'stackedbar' props
  // So arg 1 is a level 'back'
  return {
    colours: sProps.stackedbar.colours[seriesCount],
    // Use bar vals for now, at least...
    cluster: sProps.bar.cluster,
    gap: sProps.bar.gap,
    absoluteMinWidth: sProps.bar.absoluteMinWidth,
    minWidth: sProps.bar.minWidth,
    maxWidth: sProps.bar.maxWidth,
    narrowGap: sProps.bar.narrowGap,
    stroke: sProps.bar.stroke,
  };
}
// THERMOMETER (vert or horiz)
export function getThermometerProps(tProps, seriesCount) {
  return {
    colours: tProps.colours[seriesCount],
    dot: tProps.dot,
    line: tProps.line,
    spindle: tProps.spindle,
    gap: tProps.gap,
  };
}
// LINE
export function getLineProps(lineProps, seriesCount) {
  return {
    colours: lineProps.colours[seriesCount],
    stroke: lineProps.stroke,
    // Gap is for blobs
    gap: lineProps.blobGap,
    indexDotFactor: lineProps.indexDotFactor,
  };
}
// LAYERCAKE
export function getLayerCakeProps(lcProps, seriesCount) {
  return {
    colours: lcProps.colours[seriesCount],
    stroke: lcProps.stroke,
    // Gap is for blobs
    gap: lcProps.blobGap,
  };
}
// STEP LINE
export function getStepLineProps(stepProps, seriesCount) {
  return {
    colours: stepProps.colours[seriesCount],
    stroke: stepProps.stroke,
    // Gap is for blobs
    gap: stepProps.blobGap,
    indexDotFactor: stepProps.indexDotFactor,
  };
}
// POINT LINE
export function getPointLineProps(pointProps, seriesCount) {
  return {
    colours: pointProps.colours[seriesCount],
    stroke: pointProps.stroke,
    // Gap is for blobs
    gap: pointProps.blobGap,
    radius: pointProps.radius,
    indexDotFactor: pointProps.indexDotFactor,
  };
}
// SCATTER
export function getScatterProps(scatterProps, seriesCount) {
  return {
    colours: scatterProps.colours[seriesCount],
    dots: scatterProps.dots,
    labelMarker: scatterProps.labelMarker,
    links: scatterProps.links,
    text: scatterProps.text,
    trendline: scatterProps.trendline,
    zkey: scatterProps.zkey,
  };
}
// PIE
export function getPieProps(pieProps, seriesCount) {
  return {
    colours: pieProps.colours[seriesCount],
    wedges: pieProps.wedges,
    links: pieProps.links,
    labels: pieProps.labels,
    header: pieProps.header,
  };
}
// TABLE
// Not called
export function getTableProps(tableProps) {
  return {
    headers: tableProps.headers,
    content: tableProps.content,
  };
}
// MIXED
export function getMixedProps(sProps, seriesCount) {
  return {
    // Codge-up from various sources:
    colours: sProps.stackedbar.colours[seriesCount],
    cluster: sProps.bar.cluster,
    gap: sProps.bar.gap,
    minWidth: sProps.bar.minWidth,
    narrowGap: sProps.bar.narrowGap,
    stroke: sProps.line.stroke,
  };
}

// SPECIFY SERIES PREFS
// Called from EditorConfigUtils.reconcileEdConfigPanelSeriesToConfig
// to set series prefs according to chart type
// Params are chart type; series lookup object; and the number of series
export function specifySeriesPrefs(type, seriesDefaults, seriesCount) {
  // 'Sanity' defaults when there's no data
  if (typeof type === 'undefined') {
    type = 'bar';
  }
  if (typeof seriesCount === 'undefined') {
    seriesCount = 1;
  }
  // I need next for appending extra colour names beyond the maxSeries limit
  const completeSeriesCount = seriesCount;
  // Limit seriesCount to the number of coloursets I've defined
  // All types (should!) have the same number of colours defined:
  const maxSeries = seriesDefaults.bar.colours.length;
  seriesCount = Math.min(seriesCount, maxSeries);
  // Align series count to array-indexing
  seriesCount--;
  // Object whose properties are the type-specific functions above
  const typeCheck = {
    bar: getBarProps(seriesDefaults.bar, seriesCount),
    stackedbar: getStackedBarProps(seriesDefaults, seriesCount),
    thermohorizontal: getThermometerProps(
      seriesDefaults.thermometer,
      seriesCount,
    ),
    column: getColumnProps(seriesDefaults.bar, seriesCount),
    stackedcolumn: getStackedColumnProps(seriesDefaults, seriesCount),
    thermovertical: getThermometerProps(
      seriesDefaults.thermometer,
      seriesCount,
    ),
    line: getLineProps(seriesDefaults.line, seriesCount),
    stepline: getStepLineProps(seriesDefaults.stepline, seriesCount),
    pointline: getPointLineProps(seriesDefaults.pointline, seriesCount),
    layercake: getLayerCakeProps(seriesDefaults.layercake, seriesCount),
    steplayercake: getLayerCakeProps(seriesDefaults.layercake, seriesCount),
    // Does this option ever get used?
    mixed: getMixedProps(seriesDefaults, seriesCount),
    scatter: getScatterProps(seriesDefaults.scatter, seriesCount),
    sizedscatter: getScatterProps(seriesDefaults.scatter, seriesCount),
    pie: getPieProps(seriesDefaults.pie, seriesCount),
    halfpie: getPieProps(seriesDefaults.pie, seriesCount),
    // Not that it should get called:
    table: getTableProps(seriesDefaults.table),
  };
  // Default:
  let ssPrefs = typeCheck.line;
  if (typeCheck.hasOwnProperty(type)) {
    // Now I have to do a subpreset-specific override (e.g. of colours)
    ssPrefs = typeCheck[type];
  }
  addExtraColourNames(ssPrefs, completeSeriesCount);
  return ssPrefs;
}
// SPECIFY SERIES PREFS ends

// ADD EXTRA COLOUR NAMES
// Called from specifySeriesPrefs. If there are fewer defined colours than
// there are series, appends 'extra-n' names to the array of colour names
export function addExtraColourNames(ssPrefs, sCount) {
  let rNo = 1;
  while (ssPrefs.colours.length < sCount) {
    ssPrefs.colours.push(`extra${rNo}`);
    rNo++;
  }
}
// ADD EXTRA COLOUR NAMES ends
