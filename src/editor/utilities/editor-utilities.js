import globalAssets from '../assets/globalAssets';
// Series preferences:
// import * as SeriesPreferences from './series-preferences.js';

// OBJECTIFY DATA
// Called from EditorConfigUtilities.reconcileEdConfigPanelDataToConfig to convert array of arrays
// into array of objects, each object containing values as
// header-named properties. Returns an object containing that
// and other properties
export function objectifyData(allData) {
  const dataObjArray = [];
  // Isolate row of headers_
  const headers = allData[0];
  // _and category header
  const catHeader = headers[0];
  // Init array of cateogory strings:
  const categories = [];
  // Count (non-header) rows and (incl. cats) columns:
  const rLen = allData.length;
  const cLen = headers.length;
  // By row (omitting 1st header row)
  for (let rNo = 1; rNo < rLen; rNo++) {
    const thisRow = allData[rNo];
    // Four objects per 'row', for chart and blob data
    // Each needs a category value, from col 0
    const tempChartObj = { [catHeader]: thisRow[0] };
    categories.push(thisRow[0]);
    // Now by column, from 1, appending to row-object
    for (let cNo = 1; cNo < cLen; cNo++) {
      const seriesName = headers[cNo];
      tempChartObj[seriesName] = thisRow[cNo];
    }
    dataObjArray.push(tempChartObj);
  }
  // Count points, omitting headers
  const pointCount = rLen - 1;
  // Count number of columns of data (exclude cats);
  // get seriesCount and blobCount later
  const dataColCount = headers.length - 1;
  return { dataObjArray, headers, categories, pointCount, dataColCount };
}
// OBJECTIFY DATA ends

// FIT SCALES BASICS
// NOTE: =============================
// Hatchet job to get temp data working
export function fitScalesBasics(scalesObj) {
  const isMixed = false;
  const isDouble = false;
  const splitDataAtCol = 0;
  scalesObj.isMixed = isMixed;
  scalesObj.isDouble = isDouble;
  scalesObj.splitDataAtCol = splitDataAtCol;
  return scalesObj;
}

// GET SIDE
// Simple utility to return current scale 'side' for single/mixed charts
export function getSide(edConfig) {
  let side = 'left';
  if (edConfig.enableScale.right) {
    side = 'right';
  }
  return side;
}
// GET SIDE ends

// GET SCALE PROPS
// Called from Editor.reconcileEdConfigPanelScalesToConfig to extract
// properties for left/right scale
export function getScaleProps(edConfig, side) {
  const result = {};
  const mmi = { actual: {}, scale: {} };
  result.type = edConfig.chartType[side].type;
  result.stacked = edConfig.chartType[side].stacked;
  // LOG to come
  // Pull out props from edConfig:
  const edConfigSide = edConfig.scales[side];
  // Actual_
  const aMin = edConfigSide.actualMin;
  const aMax = edConfigSide.actualMax;
  mmi.actual.min = aMin;
  mmi.actual.max = aMax;
  // _and scale
  mmi.scale.min = edConfigSide.min;
  mmi.scale.max = edConfigSide.max;
  mmi.scale.increment = edConfigSide.increment;
  mmi.scale.tickValues = edConfigSide.tickValues;
  mmi.scale.tickDensity = edConfigSide.tickDensity;
  result.minMaxObj = mmi;
  result.factor = edConfigSide.factor;
  result.invert = edConfigSide.invert;
  result.log = edConfigSide.log;
  // Thermo dots
  result.thermoDots = edConfig.chartType[side].thermoDots;
  result.scatterLabels = edConfig.chartType[side].scatterLabels;
  result.scatterTrendline = edConfig.chartType[side].scatterTrendline;
  return result;
}
// GET SCALE PROPS ends

// GET BLOB VALUES ARRAY
export function getBlobValuesArray(dataArray, bCol) {
  const bArray = [];
  for (let rNo = 1; rNo < dataArray.length; rNo++) {
    bArray.push(dataArray[rNo][bCol]);
  }
  const min = Math.min(...bArray);
  const max = Math.max(...bArray);
  return {
    bArray,
    min,
    max,
  };
}
// GET BLOB VALUES ARRAY ends

// Called from Editor.resetActualScaleValuesFromNewPayload. Splits data array into
// x-left, y-right and (if relevant) z arrays, for calculating MMI values
// for scatter charts
export function splitScatterDataArray(dataArray, isSimple) {
  // From each row, I want element 0 (categories, for consistency),
  // then either 1,3,5... (simple) or 1,4,7... (sized)
  let seriesCols = 3;
  if (isSimple) {
    seriesCols = 2;
  }
  const leftArray = [];
  const rightArray = [];
  const zArray = [];
  // Filters: 'columns' of values by axis
  const getXvals = (value, index) => {
    return index === 0 || (index - 1) % seriesCols === 0;
  };
  const getYvals = (value, index) => {
    return index === 0 || (index - 2) % seriesCols === 0;
  };
  const getZvals = (value, index) => {
    return index % seriesCols === 0;
  };
  // Get x-left and y-right scale values as arrays:
  for (let iii = 0; iii < dataArray.length; iii++) {
    const row = dataArray[iii];
    leftArray.push(row.filter(getXvals));
    rightArray.push(row.filter(getYvals));
    if (!isSimple) {
      zArray.push(row.filter(getZvals));
    }
  }
  return { leftArray, rightArray, zArray };
}

// SPLIT DATA ARRAY
// Called from Editor.resetActualScaleValuesFromNewPayload to split dataArray
// for double scale charts
export function splitDataArray(dArray, splitAt) {
  const leftArray = [];
  const rightArray = [];
  for (let iii = 0; iii < dArray.length; iii++) {
    const row = dArray[iii];
    leftArray.push(row.slice(0, splitAt));
    // Right needs cats column too
    const tempArray = row.slice(splitAt);
    tempArray.unshift(row[0]);
    rightArray.push(tempArray);
  }
  return { leftArray, rightArray };
}
// SPLIT DATA ARRAY ends

// COUNT TICKS
export function countTicks(min, max, increment) {
  // Valid numbers?
  const checkArgs = min + max + increment;
  if (isNaN(checkArgs)) {
    return 0;
  }
  if (checkArgs === 0) {
    return 0;
  }
  // Factor everybody up until increment is an integer
  const ten = 10;
  while (!Number.isInteger(increment)) {
    min *= ten;
    max *= ten;
    increment *= ten;
  }
  const ticks = (max - min) / increment;
  return ticks + 1;
}
// COUNT TICKS ends

export function defaultLegendColumns(sCount) {
  const zero = 0;
  const one = 1;
  const two = 2;
  const three = 3;
  const lookUp = [zero, one, two, three, two, three, three];
  let lCols = three;
  if (sCount < lookUp.length) {
    lCols = lookUp[sCount];
  }
  return lCols;
}

// DATE OPTIONS FOR FILE NAMING

// IS THIS BAR CHART
// Called from EditorConfigDefaultUtils.revertPanelDefaultVals;
// Editor.makeSizeAndPresetConfig; EditorConfigUtils.payloadToEdConfigPanel
// (NOTE: are any of these calls redundant?)
// Returns true if this is a bar chart
export function isThisBarChart(activePanel) {
  let isBar = false;
  if (
    activePanel.enableScale.left &&
    activePanel.chartType.left.type.includes('bar')
  ) {
    isBar = true;
  } else if (
    activePanel.enableScale.right &&
    activePanel.chartType.right.type.includes('bar')
  ) {
    isBar = true;
  }
  return isBar;
}
// IS THIS BAR CHART ends

// GET CHART SCALE DEFAULT OBJECT
// Called from Editor.getNewChartObject and EditorConfigUtilities.reconcileEdConfigPanelScalesToConfig.
// Returns an object with left/right sub-objects defining default vals for the
// type of the chart that relates to the scale; MMI vals...
export function getChartScaleDefaultObject(defaults) {
  // Let's start with a default object
  const base = {
    factor: 1,
    invert: false,
    minMaxObj: {
      actual: {},
      scale: {
        min: 0,
        max: 0,
        increment: 0,
      },
    },
    type: defaults.type,
    stacked: defaults.stacked,
  };
  const obj = {
    left: Object.assign({}, base),
    right: Object.assign({}, base),
    isMixed: false,
    isDouble: false,
    isScatter: false,
    splitDataAtCol: 0,
  };
  return obj;
}
// GET CHART SCALE DEFAULT OBJECT ends

// GET NAMED COLOUR VALUES
// Get colour values for AXIS text fill and tick stroke
// Arg is axis definition object, by ref.
export function getNamedColourVals(axis) {
  // Lookup is:
  const colours = globalAssets.ColourLookup.colours;
  // Default text fill:
  let fill = axis.text.fill;
  let colNode = colours[fill];
  if (typeof colNode === 'undefined') {
    // Trouble? Use black.
    colNode = colours.black100;
  }
  axis.text.fillValue = colNode;
  // Double fills
  const dScale = axis.doubleScale;
  if (typeof dScale !== 'undefined') {
    fill = dScale.fill.left;
    dScale.fill.leftVal = colours[fill];
    fill = dScale.fill.right;
    dScale.fill.rightVal = colours[fill];
    // And line/column overrides
    fill = dScale.fill.linealone;
    dScale.fill.linealoneVal = colours[fill];
    fill = dScale.fill.columnalone;
    dScale.fill.columnaloneVal = colours[fill];
  }
  //  Tick stroke. We have to contend with chart type
  // default/bar/col...
  // ...then substyles <default>, baseline and zero (mixed/simple)
  const tList = Object.keys(axis.ticks);
  for (let iii = 0; iii < tList.length; iii++) {
    const tickNode = axis.ticks[tList[iii]];
    // Chart type: bar, column...
    // In each case, there's a default 'stroke':
    let stroke = tickNode.stroke;
    if (typeof stroke !== 'undefined') {
      tickNode.strokeValue = colours[stroke];
    }
    // A baseline:
    const baseNode = tickNode.baseline;
    if (typeof baseNode !== 'undefined') {
      stroke = baseNode.stroke;
      tickNode.baseline.strokeValue = colours[stroke];
    }
    // And zero ('simple' and 'mixed')
    const zeroNode = tickNode.zero;
    if (typeof zeroNode !== 'undefined') {
      stroke = zeroNode.simple;
      zeroNode.simpleValue = colours[stroke];
      stroke = zeroNode.mixed;
      zeroNode.mixedValue = colours[stroke];
    }
  }
  return axis;
}
// GET NAMED COLOUR VALUES

// DEEP MERGE
// Found on Stackoverflow. Will do a deep merge of source object into target
// I modded to overwrite rather than concatenate arrays
export function deepMerge(target, source) {
  // If not two objects, just return target unchanged
  if (typeof target !== 'object' || typeof source !== 'object') {
    return target;
  }
  // Loop by SOURCE properties
  for (const prop in source) {
    if (source.hasOwnProperty(prop)) {
      if (prop in target) {
        // Matching property exists in target.
        // Are they both objects?
        const bothObjects =
          typeof target[prop] === 'object' && typeof source[prop] === 'object';
        if (bothObjects) {
          // OK: both are objects.
          if (target[prop].concat && source[prop].concat) {
            // If both are arrays
            // Original concatenated, but I want to overwrite arrays, too
            // target[prop] = target[prop].concat(source[prop]);
            target[prop] = source[prop];
          } else {
            // No arrays, both are objects: so recurse.
            // But clone them:
            const targetObj = Object.assign({}, target[prop]);
            const sourceObj = Object.assign({}, source[prop]);
            target[prop] = deepMerge(targetObj, sourceObj);
          }
        } else {
          // Either target or source isn't an object or an array
          // So overwrite target with source, whatever it may be
          target[prop] = source[prop];
        }
      } else {
        // No target prop exists, so create from source
        target[prop] = source[prop];
      }
    }
  }
  return target;
}
// DEEP MERGE ends

// GET SPECIFIC PRESET PROPERTIES
// Called from getNewChartObject to extract non-global
// lookup properties from the current sub/preset
export function getSpecificPresetProps(presetsConfig) {
  // Isolate the user-specific sub-preset source node
  const pps = presetsConfig.userPresets;
  const psSource = pps[presetsConfig.presetName][presetsConfig.subpresetName];
  // OK: this gets inferential. Check potential nodes
  // Axes:
  // Reversion to default:
  // NOTE: I'm throwing Object.assign at all of this stuff in
  // the hope of preventing DPs from mutating. And this seems
  // necessary here, even though I'm also doing Object.assign in deepMerge.
  const defaultAxes = Object.assign({}, globalAssets.DefaultPreferences.axes);
  // Any preset props will be merged into x- and y-axis objects
  const mergedXaxis = Object.assign({}, defaultAxes.xAxis);
  const mergedYaxis = Object.assign({}, defaultAxes.yAxis);
  const mergedZaxis = Object.assign({}, defaultAxes.zAxis);
  let brokenScaleFactors = defaultAxes.brokenScaleFactors;
  // I'm looking for preset axis properties:
  const axesSource = psSource.axes;
  if (typeof axesSource !== 'undefined') {
    const xAxisSource = axesSource.xAxis;
    if (typeof xAxisSource !== 'undefined') {
      // const xAxisTarget = chart.xAxis;
      // const mergedXaxis = defaultAxes.xAxis;
      deepMerge(mergedXaxis, xAxisSource);
    }
    const yAxisSource = axesSource.yAxis;
    if (typeof yAxisSource !== 'undefined') {
      // const yAxisTarget = chart.yAxis;
      // const mergedYaxis = defaultAxes.yAxis;
      deepMerge(mergedYaxis, yAxisSource);
    }
    const zAxisSource = axesSource.zAxis;
    if (typeof zAxisSource !== 'undefined') {
      deepMerge(mergedZaxis, zAxisSource);
    }
    // Broken scale factoring added, Feb'22
    const ppBSF = axesSource.brokenScaleFactors;
    if (typeof ppBSF !== 'undefined') {
      brokenScaleFactors = ppBSF;
    }
  }

  // Blobs
  const mergedBlobs = Object.assign({}, globalAssets.DefaultPreferences.blobs);
  const ppBlobs = psSource.blobs;
  if (typeof ppBlobs !== 'undefined') {
    deepMerge(mergedBlobs, ppBlobs);
  }

  // Series are overwritten elsewhere, down the line...
  // But other properties may need adding here as preset styles develop...?
  return {
    xAxis: mergedXaxis,
    yAxis: mergedYaxis,
    zAxis: mergedZaxis,
    brokenScaleFactors,
    blobs: mergedBlobs,
  };
}
// GET SPECIFIC PRESET PROPERTIES ends

/*
Here's the problem, I think. When I go to a preset with no axes node, axesSource is
undefined at line 683... and nothing happens. So actually, if there's no preset node,
I have to fetch one in from DPs... or something.
I have to be careful about swapping one defined PP axis for another. In all cases,
I have to impose the DP axis, before overwriting with PP.
OK so I'm doing that: the 'target' object that goes into deepMerge is from DPs.
It's the condition that's the problem.
No: that's not it. If there's no PP object, I just return the unchanged DP node.
*/

// GET NEW CHART OBJECT
// Called from Editor.reconcileEditorToChartPanelConfig
// Creates a new chart data object of default chart-type
export function getNewChartObject(newPayload, presetsConfig) {
  // Decouple from base DPs:
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  // Series: default type, assuming 1 series...
  // Next 2 comm'd out 17.7.18, since they seem to go nowhere...
  // Axes:
  // Too early: DPs haven't been overwritten from PPs yet...
  // NOTE: take out call to getNamedColourVals here...?
  // const xAxis = getNamedColourVals(dps.axes.xAxis);
  // const yAxis = getNamedColourVals(dps.axes.yAxis);
  // Chart object:
  const newChart = {
    scales: getChartScaleDefaultObject(dps.metadata.defaults),
    panelheader: dps.panelAttributes.panelheader.default,
    // Some props packed into each chart (saves extracting later)
    duration: dps.other.duration,
    steplineSpur: Number(dps.other.steplineSpur),
    // defaultSource: dps.other.defaultSource,
    // emVal: dps.other.emVal,
    forceTurn: dps.other.forceTurn,
    idealMargin: dps.other.idealMargin,
    innerMargins: dps.background.outerbox.innerMargins,
    // Smallest possible inner chart area
    minimumBounds: dps.other.minimumBounds,
    // NOTE: blob metadata moves to global CO
    // Legend, panel-specific values only:
    legend: {
      value: dps.legend.columns.value,
      header: dps.legend.header,
    },
    // Chart data obj with empty arrays
    // chartData: { all: [], left: [], right: [] },
    chartData: { left: [], right: [] },
    // Blobs object
    blobs: {
      blobHeaders: [],
      blobState: Object.assign({}, dps.metadata.defaults.blobs),
      blobMeta: dps.blobs,
    },
    // Header and category arrays:
    headers: [],
    categories: [],
    minMaxObj: {
      // actual: {},
      // scale: {
      //   min: 0,
      //   max: 0,
      //   increment: 0,
      // },
      // NOTE: fix this -- blobs MMI should go into blobs.blobState
      blobs: {},
    },
    series: {
      // left: series,
      // right: series,
    },
    newPayload,
    rawData: '',
  };
  // Index dot props
  const iPrefs = dps.other.indexDot;
  // Define fillName for lookup
  const fillName = iPrefs.fill;
  newChart.indexDot = {
    radius: iPrefs.radius,
    fillName,
    fillValue: globalAssets.ColourLookup.colours[fillName],
    value: iPrefs.value,
  };
  // Broken scale props
  const bss = dps.other.brokenScale;
  newChart.brokenScaleSymbol = {
    points: bss.points,
    linejoin: bss.linejoin,
    noSymbol: bss.noSymbol,
    horizontalPaddingToXaxisLabel: bss.horizontalPaddingToXaxisLabel,
    strokeName: bss.stroke,
    strokeValue: globalAssets.ColourLookup.colours[bss.stroke],
    width: bss.width,
  };
  // Get any preset-specific props
  const specificPresetProps = getSpecificPresetProps(presetsConfig);
  newChart.xAxis = getNamedColourVals(specificPresetProps.xAxis);
  newChart.yAxis = getNamedColourVals(specificPresetProps.yAxis);
  // No colour vals for z-axis (so far...)
  newChart.zAxis = specificPresetProps.zAxis;
  // Broken scale factoring
  newChart.brokenScaleFactors = specificPresetProps.brokenScaleFactors;
  // Blobs
  newChart.blobs.blobMeta = specificPresetProps.blobs;
  // Fetch in margin below blobs from separate topPadding node
  newChart.blobs.blobMeta.belowBlobs =
    dps.background.topPadding.belowBlobBottom.default;
  return newChart;
}
// GET NEW CHART OBJECT ends

// MONTEUX DATA ARE VALID
// Called from Editor.handleMonteuxImportValues to check the data
// validity flags in panelArray
export function monteuxDataAreValid(mData) {
  // I'll check in all panels, but break on first problem
  const dataObj = {
    goodData: true,
    problematicData: false,
    dataMsg: '',
  };
  // Loop through each panel's data, looking for trouble. First
  // bad panel, squeak and break
  for (let pNo = 0; pNo < mData.panelArray.length; pNo++) {
    const myVals = mData.panelArray[pNo].rawData.values;
    if (!myVals.isValid) {
      // Prepend data sheet number to warning
      const doMsg = `Data for panel ${pNo + 1}: ${myVals.validityMsg}`;
      dataObj.dataMsg = doMsg;
      dataObj.goodData = false;
      break;
    } else if (myVals.isProblematic) {
      const doMsg = `Data for panel ${pNo + 1}: ${myVals.validityMsg}`;
      dataObj.dataMsg = doMsg;
      dataObj.problematicData = true;
    }
  }
  return dataObj;
}
// MONTEUX DATA ARE VALID ends

// GET ACTIVE PANEL
// Variously called. Returns the active editorConfig panel
export function getActivePanel(editorConfig) {
  const { chartIndex } = editorConfig.global;
  return editorConfig.panels[chartIndex];
}
// GET ACTIVE PANEL ends

// GET PAYLOAD PRESET AND SUB-PRESET IF ANY
// Called from Editor.handleMonteuxImportValues
// If 'values' has come from a data payload, there
// will be defined preset and subPreset. But if the
// data were pasted into the Advanced tab's text field,
// these don't exist
export function getPayloadPresetAndSubPresetIfAny(values) {
  const lookUp = values.global.values;
  let ppObj;
  if (typeof lookUp.preset !== 'undefined') {
    ppObj = {
      preset: lookUp.preset,
      subPreset: lookUp.subPreset,
    };
  }
  return ppObj;
}
// GET PAYLOAD PRESET AND SUB-PRESET IF ANY ends

// SMARTEN QUOTES
// Called from various points in Editor and from
// smartenArrayOfQuotes to convert straight to smart quotes
// Arg is a string
// NOTE: could be better, but leave like this until we're sure it works...
export function smartenQuotes(str) {
  // Failsafe (originally when axis headers were killed off)
  if (typeof str === 'undefined') {
    return '';
  }
  let smart = str;
  // Don't trip over numbers
  if (isNaN(str)) {
    // There's a special case: '000. Normally, an apostrope
    // after a space is an opener. But in this case it's
    // a closer. So, inferentially:
    smart = str.replace(/'000/g, '’000');
    // Replace doublequotes that start a line or follow spaces
    smart = smart.replace(/(^|\s)(")/g, '$1“');
    // Replace survivors with the back doublequote
    smart = smart.replace(/"/g, '”');
    // Ditto single
    smart = smart.replace(/(^|\s)(')/g, '$1‘');
    smart = smart.replace(/'/g, '’');
  }
  return smart;
}
// SMARTEN QUOTES ends

// SMARTEN ARRAY OF QUOTES
// Called from EditorConfigUtils.payloadToEdConfigRawData. Passed an array,
// calls smartenQuotes on each element
export function smartenArrayOfQuotes(qArray) {
  const smartenedArray = [];
  for (const item in qArray) {
    smartenedArray.push(smartenQuotes(qArray[item]));
  }
  return smartenedArray;
}
// SMARTEN ARRAY OF QUOTES ends
