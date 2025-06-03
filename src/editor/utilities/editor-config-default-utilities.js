import globalAssets from '../assets/globalAssets';
import * as ScaleCallbackUtils from './scale-callback-utilities';
import * as EditorUtils from './editor-utilities';
import * as MinMaxUtils from './editor-minmax-utilities';

// DEFAULT PROPERTY SUPPLIERS
export function getEdConfigDefaultSize() {
  const source = Object.assign(
    {},
    globalAssets.DefaultPreferences.background.outerbox.dimensions.default,
  );
  return {
    width: source.width,
    height: source.height,
    defaultRecommendedHeight: source.height,
    pngWidth: source.pngWidth,
  };
}
export function getEdConfigDefaultPanelVals() {
  const source = Object.assign(
    {},
    globalAssets.DefaultPreferences.metadata.defaults.panels,
  );
  return {
    active: source.active,
    total: source.total,
    rows: source.rows,
  };
}
export function getEdConfigDefaultChartType() {
  const source = Object.assign(
    {},
    globalAssets.DefaultPreferences.metadata.defaults,
  );
  return {
    left: {
      type: source.type,
      stacked: source.stacked,
      thermoDots: source.thermoDots,
      scatterLabels: source.scatterLabels,
      scatterTrendline: source.scatterTrendline,
    },
    right: {
      type: source.type,
      stacked: source.stacked,
      thermoDots: source.thermoDots,
      scatterLabels: source.scatterLabels,
      scatterTrendline: source.scatterTrendline,
    },
  };
}
export function getEdConfigDefaultOverallChartType() {
  const ocType = globalAssets.DefaultPreferences.metadata.defaults.type;
  return ocType;
}
export function getEdConfigDefaultBlobs() {
  const source = Object.assign(
    {},
    globalAssets.DefaultPreferences.metadata.defaults.blobs,
  );
  return {
    column: source.column,
    hasBlobs: false,
    header: source.header,
    isRect: source.isRect,
  };
}
export function getEdConfigDefaultLegend() {
  const source = Object.assign({}, globalAssets.DefaultPreferences.legend);
  return {
    max: source.columns.max,
    columns: source.columns.columns,
    header: source.header,
  };
}
export function getEdConfigDefaultData() {
  return {
    rawData: '',
    dataArray: [],
    validityMsg: '',
    radicalDataChange: true,
    isTable: false,
  };
}
export function getDefaultScaleSideProps() {
  return {
    max: 0,
    min: 0,
    increment: 0,
    factor: 1,
    log: false,
    invert: false,
    actualMin: 0,
    actualMax: 0,
    tickDensity: 0,
    tickValues: '',
  };
}
export function getEdConfigDefaultScales() {
  const source = Object.assign(
    {},
    globalAssets.DefaultPreferences.metadata.defaults,
  );
  const defaultScales = {
    mixed: Object.assign({}, source.mixedScale),
    double: Object.assign({}, source.doubleScale),
    scatter: Object.assign({}, source.scatter),
    left: Object.assign({}, getDefaultScaleSideProps()),
    right: Object.assign({}, getDefaultScaleSideProps()),
    z: Object.assign({}, getDefaultScaleSideProps()),
  };
  // Enablement: left and right
  // NO! Separate, root property
  // const enableSide = Object.assign({}, globalAssets.DefaultPreferences.axes.yAxis.orient[source.type]);
  // EditorUtils.enableScaleSides(defaultScales, source.type, enableSide);
  return defaultScales;
}
export function getEdConfigDefaultBackgroundStrings() {
  const source = Object.assign(
    {},
    globalAssets.DefaultPreferences.background.strings,
  );
  // Until Nov'23, editorConfig only needed basic string *content*
  // Update introduces the various 'special' source strings
  // for The Economist, EIU & Refinitiv
  return {
    title: source.title.content,
    subtitle: source.subtitle.content,
    subsubtitle: source.subsubtitle.content,
    source: source.source.content,
    footnote: source.footnote.content,
    numberBox: source.numberBox.content,
    specialSourceStrings: source.source.specialStrings,
    footnoteSymbols: source.footnote.footnoteSymbols,
  };
}
export function getEdConfigDefaultPanelHeader() {
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  return dps.panelAttributes.panelheader.default;
}
export function getEdConfigDefaultEnableScale() {
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  const source = Object.assign({}, dps.metadata.defaults);
  const isDouble = source.doubleScale.isDouble;
  // According to default chart type, set left/right emablement
  const side = dps.axes.yAxis.orient[source.type];
  const enable = ScaleCallbackUtils.enableScaleSides(
    isDouble,
    source.type,
    side,
  );
  return enable;
}
export function getEdConfigDefaultChartIndex() {
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  return dps.metadata.defaults.chartIndex;
}
export function getEdConfigDefaultPanelSize() {
  return {};
}
export function getEdConfigDefaultIndexed() {
  return {
    indexCat: '',
    indexFlag: false,
    indexPoint: -1,
  };
}
export function getEdConfigDefaultAxisHeaders() {
  return {
    xaxis: '',
    yaxisleft: '',
    yaxisright: '',
    zaxis: '',
  };
}
// DEFAULT PROPERTY SUPPLIERS end

// IS ROW INDEXABLE
// Called from getIndexedPoint. Returns true if all
// elements in an array (row) are 100
export function isRowIndexable(aRow) {
  // Flag is on by default
  let rowFlag = true;
  // Loop by 'columns' (omit cats)
  for (let cNo = 1; cNo < aRow.length; cNo++) {
    // If any 'cell' in the row is not 100, break
    if (parseInt(aRow[cNo], 10) !== 100) {
      rowFlag = false;
      break;
    }
  }
  // Row result: true if all 'cells' are 100
  return rowFlag;
}

// GET INDEXED POINT
// Called from runIndexedCheck and ScaleCallbackUtils.setSharedIndexedStatus
// Args are the 'indexed' object, the complete data array,
// the blob col (excluded) and a flag indicating caller
//  updates 'indexed' by ref.
// For a possible index, all values in one 'row' must = 100
// If we're sharing a scale, index flag is forced on
export function getIndexedPoint(iObj, dArray, blobCol, sharingScale) {
  let canIndex = false;
  let pointNo = 0;
  let iCat = '';
  // Outer loop by 'rows' (omit headers)
  for (let rNo = 1; rNo < dArray.length; rNo++) {
    // Exclude blobs
    const aRow = Object.assign([], dArray[rNo]);
    if (blobCol > 0) {
      aRow.splice(blobCol, 1);
    }
    // Check one 'row'
    if (isRowIndexable(aRow)) {
      pointNo = rNo;
      iCat = aRow[0];
      canIndex = true;
      break;
    }
  }
  if (canIndex) {
    iObj.indexCat = iCat;
    iObj.indexPoint = pointNo;
    // Only set index flag on, if sharing scale
    if (sharingScale) {
      iObj.indexFlag = true;
    }
  } else {
    // No 'all-100':
    iObj.indexCat = '';
    iObj.indexFlag = false;
    iObj.indexPoint = -1;
  }
}
// GET INDEXED POINT ends

// RUN INDEXED CHECK
// Called from revertPanelDefaultVals
// Args are edConfigPanel and double/mixed flags
// By ref, update edConfigPanel with
// properties indexPoint, indexCat, indexFlag
export function runIndexedCheck(edConfigPanel, isDouble, isMixed) {
  // Isolate data array
  let indexAllowed = true;
  if (isDouble || isMixed) {
    indexAllowed = false;
  } else {
    // Get side
    if (
      edConfigPanel.enableScale.left &&
      edConfigPanel.chartType.left.type !== 'line'
    ) {
      // NOTE: but I'm not checking for stacked...
      indexAllowed = false;
    }
    if (
      edConfigPanel.enableScale.right &&
      edConfigPanel.chartType.right.type !== 'line'
    ) {
      indexAllowed = false;
    }
  }
  // NOTE: keep an eye on this
  // Set indexed object back to 'off' defaults.
  edConfigPanel.indexed = getEdConfigDefaultIndexed();
  if (indexAllowed) {
    // Look for a point at which all series = 100
    // (excluding blobs col)
    const blobCol = edConfigPanel.blobs.column;
    const { dataArray } = edConfigPanel.chartData;
    getIndexedPoint(edConfigPanel.indexed, dataArray, blobCol, false);
  }
}
// RUN INDEXED CHECK ends

// RESET DEFAULTS FOR RAW DATA FROM ADVANCED FOLD
// Called by revertPanelDefaultVals if new data have arrived from
// the textarea on the Advanced fold (shouldn't happen once we're
// talking to Monteux, but left as failsafe).
// Just resets blob and scale defaults...
export function resetDefaultsForRawDataFromAdvancedFold(edConfigPanel) {
  edConfigPanel.blobs = getEdConfigDefaultBlobs();
  edConfigPanel.scales = getEdConfigDefaultScales();
}
// RESET DEFAULTS FOR RAW DATA FROM ADVANCED FOLD ends

// RESET SCALE INVERSION
// Called from revertPanelDefaultVals. If chart type !== line,
// force inverted scale off
export function resetScaleInversion(myPanel) {
  const leftType = myPanel.chartType.left.type;
  const leftInverts = leftType.includes('line');
  const rightType = myPanel.chartType.right.type;
  const rightInverts = rightType.includes('line');
  if (!leftInverts) {
    myPanel.scales.left.invert = false;
  }
  if (!rightInverts) {
    myPanel.scales.right.invert = false;
  }
  //
  //
  // But there's also an issue with mixed scales, where I want the
  // 'inactive' scale to align to the active...
  if (myPanel.scales.mixed.isMixed) {
    if (!myPanel.enableScale.left) {
      myPanel.scales.left.invert = myPanel.scales.right.invert;
    } else if (!myPanel.enableScale.right) {
      myPanel.scales.right.invert = myPanel.scales.left.invert;
    }
  }
}
// RESET SCALE INVERSION ends

// IS THIS TABLE
// Called from revertPanelDefaultVals
export function isThisTable(myPanel) {
  let isTable = false;
  const overallChartType = myPanel.overallChartType;
  if (typeof overallChartType !== 'undefined') {
    isTable = overallChartType.includes('Table');
  }
  return isTable;
}
// IS THIS TABLE ends

// REVERT PANEL DEFAULT VALS
// Called from subcomponent callback handlers, to reset the editorConfig
// to new values. Args are the panel-specific editorConfig object and a
// string indicating new values are data, double-scale, log... whatever...?
export function revertPanelDefaultVals(
  editorConfig,
  source,
  chartType,
  newPayload,
) {
  const myPanel = EditorUtils.getActivePanel(editorConfig);
  // Array of raw data
  const { dataArray } = myPanel.chartData;
  // If this has been called from the data values handler,
  // reset some defaults
  if (source === 'data') {
    resetDefaultsForRawDataFromAdvancedFold(myPanel);
  }
  const { isDouble } = myPanel.scales.double;
  const { isMixed } = myPanel.scales.mixed;
  const isScatter = chartType.includes('scatter');
  // INDEXED -- is option compatible with double/mixed scale
  // or with data (100s)
  if (source === 'double' || source === 'data' || source === 'blobs') {
    runIndexedCheck(myPanel, isDouble, isMixed);
  }
  // Defaults (for non-double only)
  let side = 'left';
  let splitDataAtCol = 0;
  // Let the real work begin...
  if (isDouble || isMixed) {
    // Get 'column' at which data split
    if (isDouble) {
      splitDataAtCol = myPanel.scales.double.splitDataAtCol;
    } else {
      splitDataAtCol = myPanel.scales.mixed.splitDataAtCol;
    }
    if (splitDataAtCol > 0) {
      // Default: mixed calculate scale with ALL data; same MMI left and right
      let leftArray = Object.assign([], dataArray);
      let rightArray = Object.assign([], dataArray);
      if (isDouble) {
        // But double scales split data into 'left' and 'right'
        const splitArray = EditorUtils.splitDataArray(
          dataArray,
          splitDataAtCol + 1,
        );
        leftArray = splitArray.leftArray;
        rightArray = splitArray.rightArray;
      }
      // Set left and right scales
      MinMaxUtils.setScaleSideMinMax(leftArray, editorConfig, 'left');
      MinMaxUtils.setScaleSideMinMax(rightArray, editorConfig, 'right');
    }
  } else if (isScatter) {
    // NOTE: this may duplicate EditorConfigUtils.resetActualScaleValuesFromNewPayload
    // The flow here follows a user gesture
    // Left is 'x' axis; right is 'y' axis
    const { isSimple } = myPanel.scales.scatter;
    const splitArray = EditorUtils.splitScatterDataArray(dataArray, isSimple);
    // So splitArray is an object with 'left', 'right' and 'z' properties
    MinMaxUtils.setScaleSideMinMax(splitArray.leftArray, editorConfig, 'left');
    MinMaxUtils.setScaleSideMinMax(
      splitArray.rightArray,
      editorConfig,
      'right',
    );
    if (!isSimple) {
      MinMaxUtils.setZScaleMinMax(splitArray.zArray, myPanel);
    }
  } else {
    // Single (log or non-log)
    // So which side is scale?
    side = EditorUtils.getSide(myPanel);
    MinMaxUtils.setScaleSideMinMax(dataArray, editorConfig, side);
  }
  //
  // LEGEND: if new raw data, set default legend columns
  if (newPayload) {
    const seriesCount = myPanel.chartData.dataArray[0].length - 1;
    const legendCols = EditorUtils.defaultLegendColumns(seriesCount);
    myPanel.legend.columns = legendCols;
  }
  // INVERTED SCALE: force off if chart type !== line
  // and scale is log
  resetScaleInversion(myPanel);
}
// REVERT PANEL DEFAULT VALS ends
