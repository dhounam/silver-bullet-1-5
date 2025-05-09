// Contains the chain of functions that assemble a virgin
// editorConfig object. And random colour generation for series.
// Main entry is via initiateNewEditorConfig, which is called
// from Editor.componentWillMount...

// Default preferences ( complete set of style definitions):
import globalAssets from '../assets/globalAssets';
import * as EditorUtils from './editor-utilities';
import * as EditorConfigDefaultUtils from './editor-config-default-utilities';
import * as MinMaxUtils from './editor-minmax-utilities';
import * as OtherUtils from './other-utilities';
import * as SeriesPreferences from './series-preferences';
import * as Filename from './filename';
import * as PartyUtils from './party-utilities';

// GET PUB DATE
// Called from getDatesObject
// Returns next publication day (Saturday) in ms
export function getPubDate(pDay) {
  // Arg is publication day as numbered
  const wLen = 7;
  const aDate = new Date();
  // From time now, work out *immediate* next pub date
  const pubDate = aDate.setDate(
    aDate.getDate() + ((pDay + wLen - aDate.getDay()) % wLen),
  );
  return pubDate;
}
// GET PUB DATE ends

// GET EIU DATES OBJECT
// Called from getEdConfigDefaultDates to return dates lists for file naming
export function getEiuDatesObject() {
  // Start from current month
  const timeNow = new Date();
  let monthNo = timeNow.getMonth();
  const yearNo = timeNow.getFullYear();
  const datesMd = [];
  const datesYmd = [];
  const mList = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  // End date
  let endYear = yearNo + 1;
  if (monthNo > 9) {
    endYear++;
  }
  const endMonth = 11;
  for (let y = yearNo; y <= endYear; y++) {
    for (let m = monthNo; m <= endMonth; m++) {
      let month = String(m + 1);
      if (month.length === 1) {
        month = `0${month}`;
      }
      datesYmd.push(`${y}${month}`);
      datesMd.push(`${mList[m]} ${y}`);
    }
    monthNo = 0;
  }
  return {
    datesMd,
    datesYmd,
    dateIndex: 0,
  };
}
// GET EIU DATES OBJECT ends

// GET ECO DATES OBJECT
// Called from getEdConfigDefaultDates to return dates lists for file naming
export function getEcoDatesObject(pDay, oneDay) {
  // Args are number of publication day, and one day as ms
  let toNextWeek = 0;
  const seven = 7;
  const six = 6;
  // Get immediate next Saturday, in ms
  const pubDate = getPubDate(pDay);
  // Are we pre-threshold?
  const timeNow = new Date();
  const dayNow = timeNow.getDay();
  const hourNow = timeNow.getHours();
  // Threshold is 6pm, Thursday
  const thresholdHour = 18;
  const thresholdDay = 4;
  // I want to compare now with threshold
  // First: is 'today' before thresholdDay?
  if (dayNow > thresholdDay) {
    toNextWeek = seven;
  } else if (dayNow === thresholdDay && hourNow >= thresholdHour) {
    toNextWeek = seven;
  }
  // Adjust to Sat+ ...?
  const addTo = toNextWeek * oneDay;
  const initialDate = pubDate + addTo;
  const datesMd = [];
  const datesYmd = [];
  const aWeek = oneDay * seven;
  const mList = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  for (let www = 0; www < six; www++) {
    const thisDate = new Date(initialDate + www * aWeek);
    const dStr = `${mList[thisDate.getMonth()]} ${thisDate.getDate()}`;
    datesMd.push(dStr);
    let dNo = thisDate.getFullYear();
    // Month as 'mm'
    let month = String(thisDate.getMonth() + 1);
    if (month.length === 1) {
      month = `0${month}`;
    }
    // Date as 'dd'
    let day = String(thisDate.getDate());
    if (day.length === 1) {
      day = `0${day}`;
    }
    dNo = `${dNo}${month}${day}`;
    datesYmd.push(dNo);
  }
  return {
    datesMd,
    datesYmd,
    dateIndex: 0,
  };
}
// GET ECO DATES OBJECT ends

// GET ED CONFIG DEFAULT SECTIONS
// Called from getEdConfigFilenameProperties, returns a list
// of sections.
export function getEdConfigDefaultSections(defaultPrefs, presetsConfig) {
  // I need stuff from PresetPreferences, but first I need to know
  // which the default PPs are!
  const defaults = defaultPrefs.metadata.defaults;
  const user = presetsConfig.user;
  const presetName = presetsConfig.presetName;
  const subPresetName = presetsConfig.subpresetName;
  const pps = presetsConfig.userPresets;
  // Fetch in sections object, setting default as 'active' section
  // Can't use spread operator cos it generates an unexpected token fatal error
  // Get preset; if not found use default
  let preset = pps[presetName];
  if (typeof preset === 'undefined') {
    preset = pps[defaults.preset[user]];
  }
  // Ditto sub-preset
  let subPreset = preset[subPresetName];
  if (typeof subPreset === 'undefined') {
    subPreset = preset[defaults.subPreset[user]];
  }
  // Check subpreset for sections. If none of its own,
  // use the general preset sections list
  let lookUpSections = subPreset.sections;
  if (typeof lookUpSections === 'undefined') {
    lookUpSections = preset.sections;
  }
  const sections = JSON.parse(JSON.stringify(lookUpSections));
  // Index of default, by code
  sections.index = sections.list.findIndex(
    item => item.code === sections.default,
  );
  return sections;
}
// GET ED CONFIG DEFAULT SECTIONS ends

// GET ED CONFIG CURRENT SECTIONS
// Called from payloadToEditorConfigGlobalProps. Passed the current global.values from the
// Monteux payload, returns section name and options for dropdown
export function getEdConfigCurrentSections(payloadGVals, presetsConfig) {
  // I need stuff from PresetPreferences, but first I need to know
  // which the default PPs are!
  const preset = presetsConfig.presetName;
  const subPreset = presetsConfig.subpresetName;
  const pps = presetsConfig.userPresets;
  // I need to isolate the current section from the filename:
  const fnameString = payloadGVals.name.split('_')[1];
  // So I should have something like 'FNC123'. I'm only interested
  // in the first 2 characters
  const sectionName = fnameString.substr(0, 2);
  // Fetch in sections object, setting default as 'active' section
  // Can't use spread operator cos it generates an unexpected token fatal error
  // Look first in subpreset. If it has no sections list of its own,
  // use the general preset sections list
  let lookUp = pps[preset][subPreset];
  if (typeof lookUp.sections === 'undefined') {
    lookUp = pps[preset];
  }
  const lookUpSections = lookUp.sections;
  const sections = JSON.parse(JSON.stringify(lookUpSections));
  // Index of code
  sections.index = sections.list.findIndex(item => item.code === sectionName);
  // if for any reason sectionName (coming from the spreadsheet global data tab)
  // is not found, use index of default section
  if (sections.index === -1)
    sections.index = sections.list.findIndex(
      item => item.code === sections.default,
    );
  return sections;
}
// GET ED CONFIG CURRENT SECTIONS

// GET ED CONFIG DEFAULT DATES
// Called from getEdConfigFilenameProperties
export function getEdConfigDefaultDates(pDay, user) {
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  const dInMs = dps.other.dayInMilliSeconds;
  let datesObject = {};
  if (user === 'economist') {
    datesObject = getEcoDatesObject(pDay, dInMs);
  } else if (user === 'eiu') {
    datesObject = getEiuDatesObject();
  }
  return datesObject;
}
// GET ED CONFIG DEFAULT DATES ends

// GET ED CONFIG FILENAME PROPERTIES
// Called from initiateNewEdConfig. Returns a default filename.
// editorConfig.global has a 'fileName' object with section, date
// fileName properties...
// 2nd arg may be an actual file name (from Monteux), or the string 'false'
export function getEdConfigFilenameProperties(presetsConfig, fName, fNumber) {
  if (typeof fName === 'undefined') {
    fName = 'false';
  }
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  // Get default section details: list, default and (default) 'active'
  const fnObj = {};
  fnObj.sections = getEdConfigDefaultSections(dps, presetsConfig);
  // Get a list of potential dates. First I need publication day:
  const pDay = dps.other.publicationDay;
  fnObj.dates = getEdConfigDefaultDates(pDay, presetsConfig.user);
  fnObj.number = fNumber;
  // If no Monteux-supplied filename, make one up
  if (fName.toLowerCase() === 'false') {
    fName = Filename.buildNewFileName(fnObj, presetsConfig.user);
  }
  fnObj.name = fName;
  return fnObj;
}
// GET ED CONFIG FILENAME PROPERTIES ends

// NEW ED CONFIG PANEL ELEMENT
// Called from initiateNewEdConfig; adds a new
// panel definition object to editorConfig's panels array
export function newEdConfigPanelElement() {
  return {
    // No: these are in the root 'monteux' node
    // metadataId: 'Panel metadata sheet ID',
    // dataId: 'Panel data sheet ID',
    blobs: EditorConfigDefaultUtils.getEdConfigDefaultBlobs(),
    chartData: EditorConfigDefaultUtils.getEdConfigDefaultData(),
    chartType: EditorConfigDefaultUtils.getEdConfigDefaultChartType(),
    enableScale: EditorConfigDefaultUtils.getEdConfigDefaultEnableScale(),
    indexed: EditorConfigDefaultUtils.getEdConfigDefaultIndexed(),
    legend: EditorConfigDefaultUtils.getEdConfigDefaultLegend(),
    panelSize: EditorConfigDefaultUtils.getEdConfigDefaultPanelSize(),
    scales: EditorConfigDefaultUtils.getEdConfigDefaultScales(),
    panelHeader: EditorConfigDefaultUtils.getEdConfigDefaultPanelHeader(),
    axisHeaders: EditorConfigDefaultUtils.getEdConfigDefaultAxisHeaders(),
    // Set overall chart type to default
    overallChartType: EditorConfigDefaultUtils.getEdConfigDefaultOverallChartType(),
  };
}
// NEW ED CONFIG PANEL ELEMENT ends

// INITIATE NEW ED CONFIG
// Called from Editor.componentWillMount
// Args are user-specific PPs, filename, number of panels and file number
export function initiateNewEdConfig(presetsConfig, name, pTotal, fileNumber) {
  // The editorConfig object has 2 nodes: background and panels
  const fileNameObj = getEdConfigFilenameProperties(
    presetsConfig,
    name,
    fileNumber,
  );
  // No longer look directly to default presets; take them
  // from param presetsConfig
  const presets = {
    preset: presetsConfig.presetName,
    subPreset: presetsConfig.subpresetName,
  };
  const editorConfig = {
    // Ids of sheet and tabs
    monteux: {
      sheetId: '',
      globalId: '',
      panels: [{ metadataId: 'To come', dataId: 'To come' }],
    },
    global: {
      chartIndex: EditorConfigDefaultUtils.getEdConfigDefaultChartIndex(),
      fileName: fileNameObj,
      // ...and this will be global tab's id
      globalId: 'Global tab ID',
      panelVals: EditorConfigDefaultUtils.getEdConfigDefaultPanelVals(),
      presets,
      size: EditorConfigDefaultUtils.getEdConfigDefaultSize(),
      strings: EditorConfigDefaultUtils.getEdConfigDefaultBackgroundStrings(),
      user: presetsConfig.user,
    },
    // Initially, panels is an empty array. First element is
    // inserted at startup. Others, as panels are added to the data
    panels: [newEdConfigPanelElement()],
  };
  // Default content for panel 1
  if (pTotal > 1) {
    for (let pNo = 1; pNo < pTotal; pNo++) {
      editorConfig.panels.push(newEdConfigPanelElement());
    }
  }
  // Set global colour space
  setIllustratorColourSpace(editorConfig.global, presetsConfig);
  // Scaling (for responsive DCs). Needs timeout until
  // scaled div exists
  setTimeout(() => {
    OtherUtils.setChartWrapperScaleClass(presetsConfig);
  }, 500);
  return editorConfig;
}
// INITIATE NEW ED CONFIG ends

// ***** TRANSFER DATA FROM PAYLOAD TO EDITOR CONFIG *****

// PAYLOAD TO ED CONFIG RAW DATA
// Transfers data array for one panel
export function payloadToEdConfigRawData(
  edConfigChartData,
  payloadRawDataVals,
) {
  edConfigChartData.dataArray = smartenQuotesInDataArray(
    payloadRawDataVals.dataArray,
    payloadRawDataVals.isTable,
  );
  edConfigChartData.isTable = payloadRawDataVals.isTable;
  edConfigChartData.isValid = payloadRawDataVals.isValid;
  edConfigChartData.validityMsg = payloadRawDataVals.validityMsg;
  // Categories and headers have already been isolated from complete array
  // of raw data and need to be handled separately. In the best
  // of all possible worlds, I'd sort this out...
  edConfigChartData.categories = EditorUtils.smartenArrayOfQuotes(
    payloadRawDataVals.categories,
  );
  edConfigChartData.headers = EditorUtils.smartenArrayOfQuotes(
    payloadRawDataVals.headers,
  );
  edConfigChartData.timeFormats = payloadRawDataVals.timeFormats;
  edConfigChartData.categoryType = payloadRawDataVals.categoryType;
  edConfigChartData.yearsAdjustedBy = payloadRawDataVals.yearsAdjustedBy;
}

// SMARTEN QUOTES IN DATA ARRAY
// Called from payloadToEdConfigRawData to do quote-smartening
// throughout the complete raw data array
export function smartenQuotesInDataArray(dArray, isTable) {
  // If it's a table, I want to check everything
  // If not, I'm only interested in:
  //  - 1st row (headers)
  //  - item[0] of subsequent rows
  const smartenedData = dArray.map((dataRow, iii) => {
    let smartenedRow;
    if (iii === 0) {
      // Headers
      smartenedRow = EditorUtils.smartenArrayOfQuotes(dataRow);
    } else if (isTable) {
      smartenedRow = EditorUtils.smartenArrayOfQuotes(dataRow);
    } else {
      // If not a table, only smarten category
      smartenedRow = dataRow;
      smartenedRow[0] = EditorUtils.smartenQuotes(smartenedRow[0]);
    }
    return smartenedRow;
  });
  return smartenedData;
}
// SMARTEN QUOTES IN DATA ARRAY

// IS DOUBLE MIXED SPLIT VALID
// Called from transferAllMetadataSets. This is designed to trap an edge
// case where user has changed a double/mixed scale to 2 panels and
// the split-point has broken the series-count.
export function isDoubleMixedSplitValid(vals, seriesCount) {
  const doubleSplit = vals.scales_double_splitDataAtCol;
  const mixedSplit = vals.scales_mixed_splitDataAtCol;
  const splitAt = Math.max(mixedSplit, doubleSplit);
  return splitAt < seriesCount;
}
// IS DOUBLE MIXED SPLIT VALID ends

// TRANSER ONE METADATA SET
// editorConfig and payload metadata properties are 'parallel'...
// except that while editorConfig has a nested-object structure, payload uses
// simple underscore-delimited strings.
// Thus: editorConfig.chartType.left.type corresponds to
// loadVals.chartType_left_type
// 'topic' is an underline-delimited string representing the 'path' down the object...
export function transferOneMetadataSet(edConfigPanel, loadVals, topic) {
  // topic is a string of '_' delimited object nodes
  // Arrayify...
  const tArray = topic.split('_');
  // To dig down into the object structure...
  const getNestedObject = (nestedObj, myArr) => {
    return myArr.reduce((parent, child) => {
      let result = null;
      if (typeof parent === 'object' && typeof parent[child] === 'object') {
        result = parent[child];
      }
      return result;
    }, nestedObj);
  };
  // Pass in object structure as array elements
  const target = getNestedObject(edConfigPanel, tArray);
  // Now move props from source to target
  for (const key in target) {
    const sourceName = `${topic}_${key}`;
    const sourceNode = loadVals[sourceName];
    if (typeof sourceNode === 'undefined') {
      target[key] = '';
    } else {
      target[key] = sourceNode;
    }
  }
}
// TRANSER ONE METADATA SET ends

// GET SPLIT DATA COL NUMBER
// Called from resetActualScaleValuesFromNewPayload, returns
// number of column at which double/mixed data split
export function getSplitDataColNumber(scales) {
  let splitCol = 0;
  if (scales.double.isDouble) {
    splitCol = scales.double.splitDataAtCol;
  } else if (scales.mixed.isMixed) {
    splitCol = scales.mixed.splitDataAtCol;
  }
  return splitCol;
}
// GET SPLIT DATA COL NUMBER ends

// RESET ACTUAL SCALE VALUES FROM NEW PAYLOAD
// Called from payloadToEdConfigPanel
export function resetActualScaleValuesFromNewPayload(edConfigPanel) {
  // Extract required properties:
  const dataArray = Object.assign([], edConfigPanel.chartData.dataArray);
  const leftStacked = edConfigPanel.chartType.left.stacked;
  const rightStacked = edConfigPanel.chartType.right.stacked;
  const leftEnabled = edConfigPanel.enableScale.left;
  const scales = edConfigPanel.scales;
  const splitDataAtCol = getSplitDataColNumber(scales);
  // Blob status:
  const blobCol = edConfigPanel.blobs.column;
  // Scatter?
  const isScatter = edConfigPanel.chartType.left.type.includes('scatter');
  // Next: each side, do actual max and min break the scale boundaries
  // So I need to get left and right.
  let leftActualMinMax = '';
  let rightActualMinMax = '';
  // Now I have to isolate the relevant data areas. I'm calling a function
  // that expects a single, coherent data array (i.e., it can't cope with
  // data separated for double scales).
  // So if it's a double scale...
  // NOTE: this isn't making any allowance yet for scatters. This just gets
  // more and more intricate...
  // Another NOTE: I should eventually compare this with
  // payloadToEdConfigPanel, and how it deals with side on
  // non-double scale...
  if (scales.double.isDouble) {
    const splitData = EditorUtils.splitDataArray(dataArray, splitDataAtCol + 1);
    leftActualMinMax = MinMaxUtils.newMinMaxFcn(
      splitData.leftArray,
      leftStacked,
      blobCol,
    );
    rightActualMinMax = MinMaxUtils.newMinMaxFcn(
      splitData.rightArray,
      leftStacked,
      blobCol,
    );
  } else if (isScatter) {
    // Left is 'x' axis; right is 'y' axis (FIXME: !!)
    const isSimple = !edConfigPanel.chartType.left.type.includes('sized');
    const splitArray = EditorUtils.splitScatterDataArray(dataArray, isSimple);
    // So splitArray is an object with 'left', 'right' and 'z' properties
    leftActualMinMax = MinMaxUtils.newMinMaxFcn(splitArray.leftArray, false, 0);
    rightActualMinMax = MinMaxUtils.newMinMaxFcn(
      splitArray.rightArray,
      false,
      0,
    );
    // Ignore z-scatter; see note below
  } else if (leftEnabled) {
    // Single scale, left
    leftActualMinMax = MinMaxUtils.newMinMaxFcn(
      dataArray,
      leftStacked,
      blobCol,
    );
  } else {
    // Single scale, right
    rightActualMinMax = MinMaxUtils.newMinMaxFcn(
      dataArray,
      rightStacked,
      blobCol,
    );
  }
  // NOTE: Nov'19-- previously, this function proceeded to calculate
  // *plotted* MMI values from actual. As of now, we want the actual values,
  // but we don't recalculate the plotted values. So I've killed the
  // override of plotted MMI, but update the scales object(s) with actual
  // min and max, left/right
  if (typeof leftActualMinMax === 'object') {
    scales.left.actualMin = leftActualMinMax.min;
    scales.left.actualMax = leftActualMinMax.max;
  }
  if (typeof rightActualMinMax === 'object') {
    scales.right.actualMin = rightActualMinMax.min;
    scales.right.actualMax = rightActualMinMax.max;
  }
}
// RESET ACTUAL SCALE VALUES FROM NEW PAYLOAD ends

// DO INFERENTIAL FIXES FOR OLD DATA FILES
// Called from transferAllMetadataSets to fix property name anomalies
// in old data files
export function doInferentialFixesForOldDataFiles(edConfigPanel) {
  if (edConfigPanel.chartType.left.type === 'blobscatter') {
    edConfigPanel.chartType.left.type = 'sizedscatter';
  }
  if (edConfigPanel.chartType.right.type === 'blobscatter') {
    edConfigPanel.chartType.right.type = 'sizedscatter';
  }
}
// DO INFERENTIAL FIXES FOR OLD DATA FILES ends

// TRANSFER ALL METADATA SETS
// Called from payloadToEdConfigPanel. Triages transfers by topic
export function transferAllMetadataSets(edConfigPanel, loadVals) {
  // Check for the double/mixed to panels anomaly
  // NOTE: this can be improved upon, but it does seem to
  // work (sort of) and time is tight...
  const seriesCount = edConfigPanel.chartData.headers.length - 1;
  const noDoubleScaleAnomaly = isDoubleMixedSplitValid(loadVals, seriesCount);
  if (!noDoubleScaleAnomaly) {
    return;
  }
  transferOneMetadataSet(edConfigPanel, loadVals, 'indexed');
  transferOneMetadataSet(edConfigPanel, loadVals, 'legend');
  transferOneMetadataSet(edConfigPanel, loadVals, 'scales_z');
  transferOneMetadataSet(edConfigPanel, loadVals, 'enableScale');
  transferOneMetadataSet(edConfigPanel, loadVals, 'blobs');
  transferOneMetadataSet(edConfigPanel, loadVals, 'chartType_left');
  transferOneMetadataSet(edConfigPanel, loadVals, 'chartType_right');
  transferOneMetadataSet(edConfigPanel, loadVals, 'scales_double');
  transferOneMetadataSet(edConfigPanel, loadVals, 'scales_mixed');
  transferOneMetadataSet(edConfigPanel, loadVals, 'scales_left');
  transferOneMetadataSet(edConfigPanel, loadVals, 'scales_right');
  // Next comm'd out Sep'20, when we 'recoupled' axis headers to series headers
  // Restored Feb'21 (x-axis header only)
  transferOneMetadataSet(edConfigPanel, loadVals, 'axisHeaders');
  // Over time, some property names have changed, so old data files
  // may cause trouble down the line...
  doInferentialFixesForOldDataFiles(edConfigPanel);
}
// TRANSFER ALL METADATA SETS ends

// SET AXIS HEADERS FROM SERIES HEADERS
// Called from payloadToEdConfigPanel. According to chart type,
// assigns raw series headers to axis headers
export function setAxisHeadersFromSeriesHeaders(pConfig) {
  const target = pConfig.axisHeaders;
  const chartType = pConfig.overallChartType;
  const { isDouble, splitDataAtCol } = pConfig.scales.double;
  const headers = pConfig.chartData.headers;
  if (chartType.includes('scatter')) {
    target.xaxis = headers[1];
    target.yaxisright = headers[2];
    target.zaxis = headers[3];
  } else if (isDouble) {
    target.yaxisleft = headers[1];
    target.yaxisright = headers[splitDataAtCol + 1];
    // Overcautious?
    if (typeof target.yaxisright === 'undefined') {
      target.yaxisright = headers[headers.length - 1];
    }
  }
}
// SET AXIS HEADERS FROM SERIES HEADERS

// SET LEGEND COLUMN DEFAULT
// Called from payloadToEdConfigPanel, on 'new' raw data
// If line chart, default legend outside chart
// If table, legend columns val is zero, so no space taken
export function setLegendColumnDefault(legend, chartType) {
  if (chartType.includes('line') || chartType.includes('table')) {
    legend.columns = 0;
  }
}
// SET LEGEND COLUMN DEFAULT ends

// DO SCATTER INSURANCE
// If chart type was scatter and user added a column of data, we get stuck
// out of step. So if existing chart type is scatter, align exact type
// ('sized' or not) to number of columns of data. If number of colums is
// incompatible with either scatter type, default to line
export function doScatterInsurance(edConfigPanel, side) {
  // NOTE: this must eventually change to match left/right/top/bottom options
  // if I ever get around to implementing them
  let otherSide = 'left';
  if (side === 'left') {
    otherSide = 'right';
  }
  let activeType = edConfigPanel.chartType[side].type;
  // NOTE: assumption that left. and right.type are the same for scatters
  if (activeType.includes('scatter')) {
    // How many data columns?
    const dataColCount = edConfigPanel.chartData.headers.length - 1;
    if (dataColCount % 2 === 0) {
      activeType = 'scatter';
    } else if (dataColCount % 3 === 0) {
      activeType = 'sizedscatter';
    } else {
      activeType = 'line';
    }
    // Fix up:
    if (activeType === 'line') {
      edConfigPanel.chartType[side].type = 'line';
      edConfigPanel.chartType[otherSide].type = 'none';
    } else {
      edConfigPanel.chartType[side].type = activeType;
      edConfigPanel.chartType[otherSide].type = activeType;
    }
  }
}
// DO SCATTER INSURANCE ends

// PAYLOAD TO ED CONFIG PANEL
// Called from payloadToEdConfigMaster to oversee transfer of
// rawData and metadata for one panel
export function payloadToEdConfigPanel(edConfigPanel, payloadP, existingChart) {
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  // Data
  payloadToEdConfigRawData(edConfigPanel.chartData, payloadP.rawData.values);
  // Metadata
  const loadVals = payloadP.metaData.values;
  // Handler moves all properties of one 'set'
  // The editorConfig is in a 'default' state. But there are certain
  // properties that overwrite from an existing panel in Monteux...
  // ...**IF** that panel has metadata
  const overwriteDefaultPanelMetadata =
    existingChart && Object.keys(loadVals).length > 0;
  let isStacked = false;
  let side = 'left';
  // Raw data, as an array:
  const dArray = Object.assign([], edConfigPanel.chartData.dataArray);
  let blobCol = 0;
  if (overwriteDefaultPanelMetadata) {
    // Chart has existing metadata;
    // do all the obvious data transfers
    transferAllMetadataSets(edConfigPanel, loadVals);
    // But overwrite string values that must arrayify
    // NOTE: egregious duplication
    let tVals = loadVals.scales_left_tickValues;
    edConfigPanel.scales.left.tickValues = [];
    if (typeof tVals !== 'undefined' && tVals.length > 0) {
      // edConfigPanel.scales.left.tickValues = tVals.split(',');
      const leftArray = tVals.split(';');
      edConfigPanel.scales.left.tickValues = leftArray.map(val => Number(val));
    }
    tVals = loadVals.scales_right_tickValues;
    edConfigPanel.scales.right.tickValues = [];
    if (typeof tVals !== 'undefined' && tVals.length > 0) {
      const rightArray = tVals.split(';');
      edConfigPanel.scales.right.tickValues = rightArray.map(val =>
        Number(val),
      );
    }
    // And specifics:
    edConfigPanel.panelHeader = loadVals.panelHeader;
    // Added Jan'19: is this a good place to check that data and
    // scales are still in alignment? Maybe, but as of Nov'19, I
    // no longer update *plotted* MMI (just actual min/max)
    resetActualScaleValuesFromNewPayload(edConfigPanel);
    side = EditorUtils.getSide(edConfigPanel);
    isStacked = edConfigPanel.chartType[side].stacked;
    // Scatters can get confused, so...
    doScatterInsurance(edConfigPanel, side);
    // Overall chart type (line/bar/scatter/table/mixed/double...)
    // Panel object default is 'line', FWIW...
    let ocType = loadVals.overallChartType;
    // Old files don't define overallChartType, or
    // use an outdated value
    if (typeof ocType === 'undefined') {
      ocType = edConfigPanel.chartType[side].type;
    } else if (ocType === 'blobscatter') {
      ocType = 'sizedscatter';
    }
    edConfigPanel.overallChartType = ocType;
    // If a series has been deleted, legend can go askew, so:
    if (edConfigPanel.chartData.headers.length < 3) {
      edConfigPanel.legend.value = 0;
      edConfigPanel.legend.header = '';
    }
    // Now we know everything we need to know, populate axis headers
    // for scatters or doublescale
    setAxisHeadersFromSeriesHeaders(edConfigPanel);
  } else {
    // New chart, or new panel has been added, with no metadata.
    // FIXME: I'm slipping in the Table option; but this function
    // deffo needs refactoring so that human beings can understand it.
    // I originally set overallChartType to '' here; but
    // now it's already set to DPs default
    let chartType = dps.metadata.defaults.type;
    if (payloadP.rawData.values.isTable) {
      // Table-specific
      edConfigPanel.chartType.left.type = 'table';
      edConfigPanel.chartType.right.type = 'table';
      chartType = 'table';
    } else {
      // I want to leave the editorConfig in its default
      // state... but I need to extract scale values for the raw data
      // and check whether data are indexable...
      // Side as string: 'left' or 'right'
      side = EditorUtils.getSide(edConfigPanel);
      // NOTE: prev is wrong... unless I've set editorConfig.enableScale in default editorConfig...
      // Default side enablement
      edConfigPanel.enableScale.left = false;
      edConfigPanel.enableScale.right = false;
      // Whatever, there may be an override to default chart type: if
      // categories are strings, set to bar
      if (payloadP.rawData.values.categoryType.includes('string')) {
        chartType = 'bar';
        edConfigPanel.overallChartType = 'bar';
        // Default 'side' (left=top, right=bottom) for bar charts
        side = 'left';
        edConfigPanel.chartType[side].type = chartType;
      }
      // NOTE: serious duplication of Editor.handleValuesFromDataFold: at
      // some point I need to revisit these processes
      // Now set 'active' side on
      edConfigPanel.enableScale[side] = true;
      isStacked = edConfigPanel.chartType[side].stacked;
      const actualMinMax = MinMaxUtils.newMinMaxFcn(dArray, isStacked, blobCol);
      const factor = edConfigPanel.scales[side].factor;
      const invert = edConfigPanel.scales[side].invert;
      // Now get recommended default min/max vals in an object
      const recommendedMinMax = MinMaxUtils.getRecommendedMinMaxIncr(
        actualMinMax,
        dps.axes.general,
        factor,
      );
      // _which gets set as the active side's scales object
      edConfigPanel.scales[side] = recommendedMinMax;
      // And put back factor and invert
      edConfigPanel.scales[side].factor = factor;
      edConfigPanel.scales[side].invert = invert;
    }
    // Legend default
    setLegendColumnDefault(edConfigPanel.legend, chartType);
    // Is chart 'indexable'?
    // Pass current editorConfig index object and data array
    // and the blob column, if any
    if (typeof edConfigPanel.blobs.column !== 'undefined') {
      blobCol = edConfigPanel.blobs.column;
    }
  }
  // Index check is outside the condition, since we're verifying whether there's
  // an *indexable* point, and existing data may have changed
  EditorConfigDefaultUtils.getIndexedPoint(
    edConfigPanel.indexed,
    dArray,
    blobCol,
  );
}
// PAYLOAD TO ED CONFIG PANEL ends

// VERIFY PAYLOAD PRESET
// Called from payloadToEdConfigGlobalProps. If synced
// chart's sub/preset aren't found in Sibyl's lookup,
// substitutes defaults
export function verifyPayloadPreset(pVals, presetsConfig) {
  // 'Incoming' values
  let preset = pVals.preset;
  let subPreset = pVals.subPreset;
  // If either is undefined, use defaults:
  const useDefault =
    typeof presetsConfig.userPresets[preset] === 'undefined' ||
    typeof presetsConfig.userPresets[preset][subPreset] === 'undefined';
  if (useDefault) {
    const dps = globalAssets.DefaultPreferences.metadata.defaults;
    preset = dps.preset[presetsConfig.user];
    subPreset = dps.subPreset[presetsConfig.user];
    // Update payload, too:
    pVals.preset = dps.preset;
    pVals.subPreset = dps.subPreset;
  }
  return { preset, subPreset };
}
// VERIFY PAYLOAD PRESET ends

// PAYLOAD TO EDITOR CONFIG PROPS
// Called from payloadToEdConfigMaster to transfer global props
export function payloadToEditorConfigGlobalProps(
  edConfigGlobal,
  payloadGVals,
  presetsConfig,
) {
  // Check that sub/preset exist
  const verifiedPresets = verifyPayloadPreset(payloadGVals, presetsConfig);
  edConfigGlobal.presets.preset = verifiedPresets.preset;
  edConfigGlobal.presets.subPreset = verifiedPresets.subPreset;
  edConfigGlobal.size.height = payloadGVals.height;
  edConfigGlobal.size.width = payloadGVals.width;
  edConfigGlobal.strings.title = payloadGVals.title;
  edConfigGlobal.strings.subtitle = payloadGVals.subtitle;
  edConfigGlobal.strings.subsubtitle = payloadGVals.subSubtitle;
  edConfigGlobal.strings.footnote = payloadGVals.footnote;
  edConfigGlobal.strings.source = payloadGVals.source;
  if (typeof payloadGVals.numberBox !== 'undefined') {
    // Because not defined in old datasets
    edConfigGlobal.strings.numberBox = payloadGVals.numberBox;
  }
  edConfigGlobal.chartIndex = payloadGVals.chartIndex;
  edConfigGlobal.fileName.name = payloadGVals.name;
  edConfigGlobal.fileName.number = payloadGVals.chartNumber;
  edConfigGlobal.fileName.sections = getEdConfigCurrentSections(
    payloadGVals,
    presetsConfig,
  );
}
// PAYLOAD TO EDITOR CONFIG GLOBAL PROPS ends

// PAYLOAD TO ED-CONFIG MONTEUX PROPS
// Called from payloadToEdConfigMaster to transfer Google sheet/tab ids
export function payloadToEdConfigMonteuxProps(editorConfig, payload) {
  editorConfig.monteux = {
    sheetId: payload.sheetId,
    globalTabId: payload.global.globalId,
  };
  const payloadPanels = payload.panelArray;
  editorConfig.monteux.panels = payloadPanels.map(oneP => ({
    dataTabId: oneP.rawData.id,
    metadataTabId: oneP.metaData.id,
  }));
}
// PAYLOAD TO ED-CONFIG MONTEUX PROPS ends

// PAYLOAD TO ED-CONFIG MASTER
// Called from updateEdConfigWithNewPayload. Controls specific
// payload-to-editorConfig transfers
export function payloadToEdConfigMaster(editorConfig, payload, presetsConfig) {
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  // Always transfer overall sheet id:
  editorConfig.global.sheetId = payload.global.values.sheetId;
  // and sheet and tab id:
  payloadToEdConfigMonteuxProps(editorConfig, payload, dps);
  // Remaining props only transfer if we're reloading an
  // existing chart. The editorConfig's fileName object has already
  // been updated, so I go back to the payload to check whether
  // this is a new chart. Monteux initially sends the filename as an
  // empty string...
  // Transfer global prefs for a reloaded chart:
  const existingChart = editorConfig.global.existingChart;
  if (existingChart) {
    // Global props
    payloadToEditorConfigGlobalProps(
      editorConfig.global,
      payload.global.values,
      presetsConfig,
    );
  }
  // By default, editorConfig panel settings are 1 active out of 1 total on 1 row
  // Count incoming panels and update total. But I have to
  // handle panels added or deleted, so...
  const actualPanelTotal = payload.panelArray.length;
  const recordedPanelTotal = payload.global.values.panelTotal;
  // Always use the actual number of datasets
  editorConfig.global.panelVals.total = actualPanelTotal;
  // Get prev'y-exported rowcount and chartIndex
  let panelRows = payload.global.values.panelRows;
  let chartIndex = payload.global.values.chartIndex;
  if (actualPanelTotal !== recordedPanelTotal) {
    // Panel count has changed; force one row;
    // first panel is active
    panelRows = 1;
    chartIndex = 0;
  }
  editorConfig.global.panelVals.rows = panelRows;
  editorConfig.global.panelVals.active = chartIndex;
  editorConfig.global.chartIndex = chartIndex;
  // Now loop by panels
  for (let pNo = 0; pNo < actualPanelTotal; pNo++) {
    const activePanel = editorConfig.panels[pNo];
    const payloadPanel = payload.panelArray[pNo];
    payloadToEdConfigPanel(activePanel, payloadPanel, existingChart);
  }
}
// PAYLOAD TO ED-CONFIG MASTER ends

// UPDATE ED-CONFIG WITH NEW PAYLOAD
// Called from Editor.handleMonteuxImportValues to create a new
// editorConfig, then overlay with values from Monteux.
// Args: Monteux payload, presets, and an array of
// existing panel headers
export function updateEdConfigWithNewPayload(payload, presetsConfig) {
  // The first thing is to get a new editorConfig...
  // ...for which I need to know whether this is a new chart
  // that needs a filename (in which case, fileName is
  // a boolean false, which needs to be stringified!)
  // As of Dec'18, Monteux sends filename for a new data sheet as
  // an empty string, but still trapping undefined...
  let fileName = payload.global.values.name;
  // And we need file number:
  const fileNumber = payload.global.values.chartNumber;
  // Flag for a resync of an existing chart
  // Set true for first sync of completely new data
  // Never reset hereafter. Passed into EdConfig
  // by child handler payloadToEdConfigMaster
  let existingChart = false;
  if (typeof fileName === 'undefined') {
    fileName = 'false';
    // No: fileNumber is sorted downstream
    // fileNumber = '000';
  } else if (fileName.length === 0) {
    fileName = 'false';
    // fileNumber = '000';
  } else {
    fileName = fileName.toString();
    existingChart = true;
  }
  // Before we can create a new editorConfig, we need to know how many panels...
  const panelNo = payload.panelArray.length;
  const newEdConfig = initiateNewEdConfig(
    presetsConfig,
    fileName,
    panelNo,
    fileNumber,
  );
  newEdConfig.global.existingChart = existingChart;
  // newPayload indicates that the event chain is precipitated by
  // the arrival of a new payload, rather than an edit in Sibyl
  // It can be reset further along the process
  newEdConfig.global.newPayload = true;
  // Now overwrite, by ref, with values from payload.
  // A sub-handler controls specific transfers...
  payloadToEdConfigMaster(newEdConfig, payload, presetsConfig);
  // To force through...
  newEdConfig.goodPayload = true;
  return newEdConfig;
}
// UPDATE ED-CONFIG WITH NEW PAYLOAD ends

// ***** ***** FUNCTIONS TO TRANSFER DATA FROM ED CONFIG TO CONFIG OBJECT ***** *****

// FIND NODE DOWN CHAIN
// Called from findPreferencesNode to dig down a chain of nodes in a
// Preferences file. Args are the top-level of DPs or PPs. Chain is a
// descending hierarchy of nodes to step carefully down as far as they lead...
export function findNodeDownChain(topNode, chain) {
  let node = JSON.parse(JSON.stringify(topNode));
  for (let link = 0; link < chain.length; link++) {
    node = node[chain[link]];
    // In case of error:
    if (typeof node === 'undefined') {
      break;
    }
  }
  return node;
}
// FIND NODE DOWN CHAIN ends

// FIND PREFERENCES NODE
// Function returns a complete preferences node. It clones the (hopefully
// complete!) default definition as its base. Then it scrabbles around,
// by preset and section, for a specific node. If a specific node is
// found, it overwrites the default with whatever properties exist.
// Args are: preset id; section id; and an array of subnodes that
// constitute a sort of 'chain' down to the node I'm looking for...
// NOTE: this chain structure must be consistent across all prefs presets,
// sections, etc. And the 'end-of-chain' node must exist in the
// default prefs...
// Pass in user for PPs economist/eiu
export function findPreferencesNode(presetsConfig, chain) {
  const dps = JSON.parse(JSON.stringify(globalAssets.DefaultPreferences));
  const defaultNode = findNodeDownChain(dps, chain);
  if (typeof defaultNode === 'undefined') {
    return defaultNode;
  }
  // So now (in theory, at least) defaultNode is the target node
  // in the default preferences...
  // Clone it:
  // NOTE: overdoing the cloning!
  const returnNode = JSON.parse(JSON.stringify(defaultNode));
  // That's the complete default node which (in theory at least!)
  // includes all the properties that could exist...
  // Now: are there any specific preset/subPreset overwrites?
  const presetNode = presetsConfig.userPresets[presetsConfig.presetName];
  if (typeof presetNode === 'undefined') {
    // No specific preset definition found (shouldn't happen, but still...)
    return returnNode;
  }
  // Now narrow preset down to subPreset:
  let specificNode = presetNode[presetsConfig.subpresetName];
  // let specificNode = presetNode[subPreset];
  if (typeof specificNode === 'undefined') {
    // No specific subPreset node: return default
    // NOTE: what happens as a result?
    return returnNode;
  }
  // Now look down the chain. If it breaks, return the default node
  specificNode = findNodeDownChain(specificNode, chain);
  if (typeof specificNode !== 'undefined') {
    // Overwrite deltas
    Object.assign(returnNode, specificNode);
  }
  return returnNode;
}
// FIND PREFERENCES NODE ends

// SET BACKGROUND PROPERTIES
// Called from Editor.getDefaultChartConfigProperties
// Args are editorConfig object and preset strings.
// Background is updated by ref.
// The way this works is that I look for a specific node, in preset
// prefs or, failing that, default prefs...
// But for dimensions I look for a subPreset node and, if that doesn't exist,
// fall back to the original node's 'default' property...
export function setBackgroundProperties(config, presetsConfig, startUp) {
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  // DIMENSIONS
  let chain = ['background', 'outerbox', 'dimensions'];
  const myNode = findPreferencesNode(presetsConfig, chain);
  // NOTE: I used to have error-trapping for node not found...
  // Previous versions checked for a preset-specific 'forceHeight' property
  // But I think this changes now: if this fcn has been called, there
  // has been a preset change and both height and width are forced
  // (or it's startup)
  config.background.outerbox.dimensions = {
    height: myNode.height,
    width: myNode.width,
    defaultRecommendedHeight: myNode.height,
  };
  // I have a defaultRecommendedHeight, which is the original
  // height to which any chart is set initially or upon change
  // of preset. It can overriden.
  // OUTER MARGINS
  chain = ['background', 'outerbox', 'outerMargins'];
  const outerMargins = findPreferencesNode(presetsConfig, chain);
  config.background.outerMargins = outerMargins;
  // INNER MARGINS
  // I added this property May'25 to allow fixed inner margins for Online Video Landscape charts
  // It's all a desperate kludge (and this property really isn't in the right place)
  chain = ['background', 'outerbox', 'innerMargins'];
  const innerMargins = findPreferencesNode(presetsConfig, chain);
  config.background.innerMargins = innerMargins;
  // SHAPES (convert object to array)
  const shapeKeys = Object.keys(dps.background.shapes);
  const shapeArray = [];
  for (let iii = 0; iii < shapeKeys.length; iii++) {
    chain = ['background', 'shapes', shapeKeys[iii]];
    const oneShape = findPreferencesNode(presetsConfig, chain);
    shapeArray.push(oneShape);
  }
  config.background.shapes = shapeArray;
  // Strings, like shapes, have to be individually accessed...
  // and, unlike shapes, string props are objects.
  // Nov'20 added Number boxes
  // NOTE: this injects default string content only. 'Actual' content
  // is transferred by reconcileEdConfigBackgroundStringsToConfig
  const stringKeys = Object.keys(dps.background.strings);
  const stringObj = {};
  for (let iii = 0; iii < stringKeys.length; iii++) {
    const thisKey = stringKeys[iii];
    chain = ['background', 'strings', thisKey];
    const oneString = findPreferencesNode(presetsConfig, chain);
    // But if we're not starting up, fetch in existing content:
    if (!startUp) {
      oneString.content = config.background.strings[thisKey].content;
    }
    stringObj[thisKey] = oneString;
  }
  config.background.strings = stringObj;
  // Panel attributes
  // const pAtts = findPreferencesNode(presetsConfig, ['panelAttributes']);
  const pAtts = getAllPanelAttributes(dps, presetsConfig);
  config.panelAttributes = pAtts;
  // debugger;
  // Legend
  config.legend = findPreferencesNode(presetsConfig, ['legend']);
  // The legends node contains some individual properties, but also
  // a sub-node, headerText. Unless PP definitions of headerText contain
  // all properties, I need to handle deltas (if I simply read the
  // headerText node, any properties that it doesn't explicitly define
  // get omitted [so, e.g. no font was being defined]). So anyway, I
  // have to loop through the legends node item by item to handle
  // headerText properly.
  const legendKeys = Object.keys(dps.legend);
  const legendObj = {};
  for (let iii = 0; iii < legendKeys.length; iii++) {
    const keyName = legendKeys[iii];
    chain = ['legend', keyName];
    const oneLegend = findPreferencesNode(presetsConfig, chain);
    legendObj[keyName] = oneLegend;
  }
  config.legend = legendObj;
  // Chart padding:
  // NOTE: only needed for 'below' property now. Above is replaced
  // by gapBelowStrings... which is, in turn, replace: see below...
  chain = ['chart', 'padding'];
  config.background.chartPadding = findPreferencesNode(presetsConfig, chain);
  // Top padding (title cluster, keys, blobs...)
  // See legendKeys, above
  const paddingKeys = Object.keys(dps.background.topPadding);
  const paddingObj = {};
  for (let iii = 0; iii < paddingKeys.length; iii++) {
    const keyName = paddingKeys[iii];
    chain = ['background', 'topPadding', keyName];
    const onePadding = findPreferencesNode(presetsConfig, chain);
    paddingObj[keyName] = onePadding;
  }
  config.background.topPadding = paddingObj;
}
// SET BACKGROUND PROPERTIES ends

//  RECONCILE ED-CONFIG PANEL SCALES TO CONFIG
// Called from reconcileEdConfigPanelToConfig. Creates a new 'scales' object to
// go into the CO
export function reconcileEdConfigPanelScalesToConfig(activePanel) {
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  const configScales = EditorUtils.getChartScaleDefaultObject(
    dps.metadata.defaults,
  );
  // Left and/or right...
  const checkScale = Object.assign({}, activePanel.enableScale);
  // NOTE: kludge for mixed scales forces both sides on
  // NOTE: this looks... bizarre! Revisit!
  if (activePanel.scales.mixed.isMixed) {
    checkScale.left = true;
    checkScale.right = true;
  }
  if (checkScale.left) {
    configScales.left = EditorUtils.getScaleProps(activePanel, 'left');
  }
  if (checkScale.right) {
    configScales.right = EditorUtils.getScaleProps(activePanel, 'right');
  }
  // Pass axis-side flags to CO:
  configScales.enableScale = activePanel.enableScale;
  // Double/mixed?
  const isDouble = activePanel.scales.double.isDouble;
  const isMixed = activePanel.scales.mixed.isMixed;
  configScales.isDouble = isDouble;
  configScales.isMixed = isMixed;
  // Side: left or right. Default, for double scales:
  let side = '';
  if (!isDouble) {
    side = EditorUtils.getSide(activePanel);
  }
  // Split point (zero default for single)
  let splitAt = 0;
  if (isDouble) {
    splitAt = activePanel.scales.double.splitDataAtCol;
  } else if (isMixed) {
    splitAt = activePanel.scales.mixed.splitDataAtCol;
    // If scale is mixed, I have to override a setting about
    // 15 lines above and align the subsidiary
    // side's MMI to the (default) dominant
    let otherSide = 'left';
    if (side === 'left') {
      otherSide = 'right';
    }
    configScales[otherSide].minMaxObj = configScales[side].minMaxObj;
  }
  configScales.splitDataAtCol = splitAt;
  // Scatter z-scale, if any
  configScales.z = {};
  if (typeof activePanel.scales.z !== 'undefined') {
    configScales.z = activePanel.scales.z;
  }
  return configScales;
}
//  RECONCILE ED-CONFIG PANEL SCALES TO CONFIG ends

// WILL DATA LAYER CAKE
// Checks whether data are compatible with a layer cake
// Called from Editor.handleValuesFromDataFold, and from
// reconcileEdConfigPanelDataToConfig. chartDataObj is
// the entire 'chartData' object. I check the array of series-arrays,
// to determine whether I can layer-cake these data
export function willDataLayerCake(chartDataObj) {
  let canLayer = true;
  const dArray = chartDataObj.dataArray;
  // The data array is structured by rows (categories), so it's all
  // a bit topsy-turvy...
  const pointCount = dArray.length;
  const seriesCount = dArray[0].length;
  // I check for mixed +/- values in one series...
  // (Prev'y also checked for blanks, in the belief that layer cakes must have
  // zeroes for missing vals. I changed my mind about this: blanks are allowed
  // and Sibyl will turn them into zeroes as necessary)
  // Outer loop is by points
  // NOTE: does this allow for blobs?
  for (let sNo = 1; sNo < seriesCount; sNo++) {
    let posCount = 0;
    let negCount = 0;
    for (let pNo = 1; pNo < pointCount; pNo++) {
      const point = parseFloat(dArray[pNo][sNo]);
      if (point < 0) {
        negCount++;
      } else if (point > 0) {
        posCount++;
      }
    }
    // Is series +/- consistent?
    canLayer = posCount === 0 || negCount === 0;
    if (!canLayer) {
      break;
    }
  }
  chartDataObj.canLayerCake = canLayer;
  if (canLayer) {
    // Check for holes (as opposed to gaps across all series)
    chartDataObj.hasHoles = checkForHoles(dArray);
  }
}
// WILL DATA LAYER CAKE ends

// CHECK FOR HOLES
// Called from willDataLayerCake. Checks through data for 'rows'
// that have isolated missing values. This is for
// layer cakes...
// NOTE: if data are ever organised in columns, that would
// be a better point of intervention
export function checkForHoles(dArray) {
  // Counts occurrences of a val in an array
  // From: https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-70.php
  const countOccurrences = (arr, val) =>
    arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
  const hole = '';
  let result = false;
  // Number of values (no. of cols - 1)
  const vLen = dArray[0].length - 1;
  // Omit headers
  for (let rNo = 1; rNo < dArray.length; rNo++) {
    const thisRow = dArray[rNo];
    const holeCount = countOccurrences(thisRow, hole);
    // 'Normal' is either no or all missing values
    if (holeCount !== 0 && holeCount < vLen) {
      result = true;
      break;
    }
  }
  return result;
}
// CHECK FOR HOLES ends

//  RECONCILE ED CONFIG PANEL DATA TO CONFIG
// Called from reconcileEdConfigPanelToConfig to pass data over,
// with consequent properties
export function reconcileEdConfigPanelDataToConfig(activePanel, configPanel) {
  // Data array from editorConfig:
  const dataArray = activePanel.chartData.dataArray;
  // I did have a trap for no data, but this should be handled upstream...
  //
  // Restructure into D3-friendly array of objects, each
  // representing a row of data named for headers. The
  // returned object also has properties for
  // headers, categories, seriesCount and pointCount...
  // NOTE: this encompasses ALL data, including blobs
  // so some tweaks have to be made subsequently...
  const dataObject = EditorUtils.objectifyData(dataArray);
  // dataObject has props:
  //    dataObjArray: an array of objects, each with properties keyed
  //      as raw data headers
  //    headers: an array of the raw data headers
  //    categories: array of categories
  //    pointCount: number of points per series
  //    dataColCount: number of cols of data (excl categories)
  // Parcel these properties out to the config obj:
  configPanel.chartData = dataObject.dataObjArray;
  // Set the calLayerCake flag on the data
  willDataLayerCake(activePanel.chartData);
  configPanel.dataColCount = dataObject.dataColCount;
  configPanel.pointCount = dataObject.pointCount;
  configPanel.headers = dataObject.headers;
  configPanel.categories = dataObject.categories;
  configPanel.timeFormats = activePanel.chartData.timeFormats;
  configPanel.yearsAdjustedBy = activePanel.chartData.yearsAdjustedBy;
  configPanel.categoryType = activePanel.chartData.categoryType;
  configPanel.hasHoles = activePanel.chartData.hasHoles;
}
//  RECONCILE ED CONFIG PANEL DATA TO CONFIG ends

//  RECONCILE ED CONFIG PANEL BLOBS TO CONFIG
// Called from reconcileEdConfigPanelToConfig to pass blobs across
export function reconcileEdConfigPanelBlobsToConfig(myBlobs, dataArray) {
  // Get a default blobs object
  const blobState = EditorConfigDefaultUtils.getEdConfigDefaultBlobs();
  // Now verify that the blobs col is within the series range
  // (i.e. that nobody's deleted a column in the raw data)
  const seriesCount = dataArray[0].length;
  if (myBlobs.column < seriesCount) {
    // Overwrite with incoming props
    const bCol = myBlobs.column;
    blobState.column = bCol;
    // Reset important blobs-off vals in CO blobState:
    blobState.valsArray = [];
    // Then overwrite if there are blobs...
    if (bCol > 0) {
      // Get min and max values
      const blobValues = EditorUtils.getBlobValuesArray(dataArray, bCol);
      blobState.valsArray = blobValues.bArray;
      blobState.min = blobValues.min;
      blobState.max = blobValues.max;
      // There's an edge case where user has changed name of blobs column,
      // which confuses Sibyl, so grab blob header from data headers:
      blobState.header = dataArray[0][bCol];
      if (blobValues.min < 0) {
        // Negative blob vals force rectangular blobs
        blobState.isRect = true;
      } else {
        blobState.isRect = myBlobs.isRect;
      }
    }
  }
  return blobState;
}
//  RECONCILE ED-CONFIG PANEL BLOBS TO CONFIG ends

//  RECONCILE ED-CONFIG PANEL LEGEND TO CONFIG
// Called from reconcileEdConfigPanelToConfig to handle legend
export function reconcileEdConfigPanelLegendToConfig(edConfigLegend) {
  return {
    value: edConfigLegend.columns,
    header: edConfigLegend.header,
  };
}
//  RECONCILE ED-CONFIG PANEL LEGEND TO CONFIG ends

export function getChartSideTypes(activePanel, isDouble, isMixed) {
  const sideTypes = {
    left: {},
    right: {},
  };
  let side = '';
  if (!isDouble) {
    side = EditorUtils.getSide(activePanel);
  }
  if (isDouble || isMixed) {
    sideTypes.left = {
      type: activePanel.chartType.left.type,
      stacked: activePanel.chartType.left.stacked,
      thermoDots: activePanel.chartType.left.thermoDots,
      scatterLabels: activePanel.chartType.left.scatterLabels,
      scatterTrendline: activePanel.chartType.left.scatterTrendline,
    };
    sideTypes.right = {
      type: activePanel.chartType.right.type,
      stacked: activePanel.chartType.right.stacked,
      thermoDots: activePanel.chartType.right.thermoDots,
      scatterLabels: activePanel.chartType.right.scatterLabels,
      scatterTrendline: activePanel.chartType.right.scatterTrendline,
    };
  } else if (side === 'left') {
    sideTypes.left = {
      type: activePanel.chartType.left.type,
      stacked: activePanel.chartType.left.stacked,
      thermoDots: activePanel.chartType.left.thermoDots,
      scatterLabels: activePanel.chartType.left.scatterLabels,
      scatterTrendline: activePanel.chartType.left.scatterTrendline,
    };
  } else {
    sideTypes.right = {
      type: activePanel.chartType.right.type,
      stacked: activePanel.chartType.right.stacked,
      thermoDots: activePanel.chartType.right.thermoDots,
      scatterLabels: activePanel.chartType.right.scatterLabels,
      scatterTrendline: activePanel.chartType.right.scatterTrendline,
    };
  }
  return sideTypes;
}

// GET SPECIFIC CHART TYPE
// Gets name for stacked step/line, bar and column charts
export function getSpecificChartType(type, isStacked) {
  let specific = type;
  if (isStacked) {
    if (specific === 'line') {
      specific = 'layercake';
    } else if (specific === 'stepline') {
      specific = 'steplayercake';
    } else if (specific === 'column') {
      specific = 'stackedbar';
    } else if (specific === 'column') {
      specific = 'stackedcolumn';
    }
  }
  return specific;
}
// GET SPECIFIC CHART TYPE ends

// DECIDE DOUBLE COLOUR SETS
// Called from reconcileEdConfigPanelSeriesToConfig.  Determines which double-
// scale colour definitions to use for series (left/right or line/column)
export function decideDoubleColourSets(leftType, rightType, doubleColours) {
  // By default, assume that both sides are the same chart type,
  // and set side-specific colours
  const colourSets = {
    left: doubleColours.left,
    right: doubleColours.right,
  };
  const leftLine = leftType.includes('line');
  const rightLine = rightType.includes('line');
  if (leftLine !== rightLine) {
    // Different chart types; overwrite with type-specific colours
    if (leftLine) {
      colourSets.left = doubleColours.linealone;
      colourSets.right = doubleColours.columnalone;
    } else {
      colourSets.left = doubleColours.columnalone;
      colourSets.right = doubleColours.linealone;
    }
  }
  return colourSets;
}
// DECIDE DOUBLE COLOUR SETS ends

//  RECONCILE ED CONFIG PANEL SERIES TO CONFIG
// Called from reconcileEdConfigPanelToConfig to handle series props
export function reconcileEdConfigPanelSeriesToConfig(
  activePanel,
  colourCount,
  splitAt,
  presetsConfig,
) {
  const configSeries = {};
  // I have to allow for separate series attributes
  // on double and mixed scale charts.
  // I have scales.double/mixed.isDouble/Mixed
  // and chartType.left/right.type
  // First, let's have a couple of objects
  let seriesLeft = {};
  let seriesRight = {};
  let leftType = '';
  let rightType = '';
  configSeries.colours = [];
  const isDouble = activePanel.scales.double.isDouble;
  const isMixed = activePanel.scales.mixed.isMixed;
  // Is this a UK/US parties chart?
  const headers = activePanel.chartData.headers;
  const ukParties = PartyUtils.checkForParties(headers, true);
  const usParties = PartyUtils.checkForParties(headers, false);
  // Send these chartside, so that legends know to use
  // party colours for strings
  // (Actually, the fcn currently forces both to false)
  PartyUtils.passPartyColoursFlagToConfigObject(
    configSeries,
    ukParties,
    usParties,
  );
  // Clone DP series
  // let defaultSeries = Object.assign({}, globalAssets.DefaultPreferences.series);
  let defaultSeries = JSON.parse(
    JSON.stringify(globalAssets.DefaultPreferences.series),
  );
  // Are there any preset-specific series prefs?
  const pps = presetsConfig.userPresets;
  const preset = presetsConfig.presetName;
  const subpreset = presetsConfig.subpresetName;
  const presetSeries = pps[preset][subpreset].series;
  if (typeof presetSeries !== 'undefined') {
    defaultSeries = EditorUtils.deepMerge(defaultSeries, presetSeries);
  }
  const sideTypes = getChartSideTypes(activePanel, isDouble, isMixed);
  leftType = sideTypes.left.type;
  rightType = sideTypes.right.type;
  let doubleColourSets = {};
  if (isDouble) {
    doubleColourSets = decideDoubleColourSets(
      leftType,
      rightType,
      defaultSeries.double.colours,
    );
  }
  // So now I have 1 (single-scale) or 2 chart types
  if (typeof leftType !== 'undefined') {
    // And I need sub-type (eg 'layercake')
    const leftSpecificType = getSpecificChartType(
      leftType,
      sideTypes.left.stacked,
    );
    seriesLeft = SeriesPreferences.specifySeriesPrefs(
      leftSpecificType,
      defaultSeries,
      colourCount,
    );
    if (ukParties) {
      PartyUtils.applyPartyColours(seriesLeft.colours, headers, true);
    } else if (usParties) {
      PartyUtils.applyPartyColours(seriesLeft.colours, headers, false);
    }
    // Set as series.left...
    configSeries[leftType] = seriesLeft;
    // But (Feb 2018) there's a kludgy overwrite of colours for double scale...
    for (let colNo = 0; colNo < splitAt; colNo++) {
      if (isMixed) {
        // Use colours up to split point
        configSeries.colours.push(seriesLeft.colours[colNo]);
      } else if (isDouble) {
        // configSeries.colours.push(defaultSeries.double.colours.left[colNo]);
        configSeries.colours.push(doubleColourSets.left[colNo]);
      }
    }
  }
  if (typeof rightType !== 'undefined') {
    // Sub-type (eg 'layercake')
    const rightSpecificType = getSpecificChartType(
      rightType,
      sideTypes.right.stacked,
    );
    seriesRight = SeriesPreferences.specifySeriesPrefs(
      rightSpecificType,
      defaultSeries,
      colourCount,
    );
    if (ukParties) {
      PartyUtils.applyPartyColours(seriesRight.colours, headers, true);
    } else if (usParties) {
      PartyUtils.applyPartyColours(seriesRight.colours, headers, false);
    }
    configSeries[rightType] = seriesRight;
    // Use colours FROM split point -- unless isDouble,
    // in which case start from zero, so that we use the
    // complete set of r/hand colours as defined in DPs
    let start = splitAt;
    let end = seriesRight.colours.length;
    if (isDouble) {
      end -= start;
      start = 0;
    }
    for (let colNo = start; colNo < end; colNo++) {
      if (isMixed) {
        // Use colours up to split point
        configSeries.colours.push(seriesRight.colours[colNo]);
      } else if (isDouble) {
        // Double uses specific set
        configSeries.colours.push(doubleColourSets.right[colNo]);
      }
    }
  }
  return configSeries;
}
//  RECONCILE ED CONFIG PANEL SERIES TO CONFIG ends

// RECONCILE ED CONFIG BACKGROUND STRINGS TO CONFIG
// Called from reconcileEdConfigGlobalToConfig to transfer background strings
// Args are editorConfig's global strings object, and the complete CO
// NOTE: doesn't handle panel headers, which are TO COME, anyway
export function reconcileEdConfigBackgroundStringsToConfig(
  edConfigStrings,
  allConfig,
) {
  const coBackStrings = allConfig.background.strings;
  coBackStrings.title.content = edConfigStrings.title;
  coBackStrings.subtitle.content = edConfigStrings.subtitle;
  coBackStrings.subsubtitle.content = edConfigStrings.subsubtitle;
  coBackStrings.source.content = edConfigStrings.source;
  coBackStrings.footnote.content = edConfigStrings.footnote;
  coBackStrings.numberBox.content = edConfigStrings.numberBox;
  allConfig.background.footnoteCount = edConfigStrings.footnoteCount;
  // Source wrapwidth depends upon whether there are footnotes
  if (edConfigStrings.footnote.length > 0) {
    coBackStrings.source.wrapwidth =
      coBackStrings.source.wrapoptions.hasfootnote;
  }
}
//  RECONCILE ED CONFIG BACKGROUND STRINGS TO CONFIG ends

// RECONCILE EDITOR TO CHART PANEL CONFIG
// Called from Editor.reconcileEditorToChartConfig, to transfer properties
// by ref for one panel
export function reconcileEditorToChartPanelConfig(activePanel, presetsConfig) {
  const configPanel = EditorUtils.getNewChartObject(false, presetsConfig);
  // PANEL HEADER rattles around on its own:
  configPanel.panelheader = activePanel.panelHeader;
  // SCALES
  configPanel.scales = reconcileEdConfigPanelScalesToConfig(activePanel);
  // Now we've got scales, for mixed or double, we need to know if there are columns...
  const typeStr = `${configPanel.scales.left.type}${
    configPanel.scales.right.type
  }`;
  configPanel.hasColumns = typeStr.includes('column');
  // Indexed
  configPanel.indexDot.indexCat = activePanel.indexed.indexCat;
  configPanel.indexDot.indexFlag = activePanel.indexed.indexFlag;
  configPanel.indexDot.indexPoint = activePanel.indexed.indexPoint;
  // DATA
  reconcileEdConfigPanelDataToConfig(activePanel, configPanel);
  // BLOBS
  const dataArray = activePanel.chartData.dataArray;
  configPanel.blobs.blobState = reconcileEdConfigPanelBlobsToConfig(
    activePanel.blobs,
    dataArray,
  );
  // And overall blobs flag
  configPanel.blobs.hasBlobs = configPanel.blobs.blobState.column > 0;
  // AXIS HEADERS
  configPanel.axisHeaders = activePanel.axisHeaders;
  // LEGEND
  configPanel.legend = reconcileEdConfigPanelLegendToConfig(activePanel.legend);
  // Now that we know how many blob columns there are, we can get a
  // SERIES count
  // NOTE: this could presumably move inside configPanel.series...
  // ...and I seem to have 2 props that do the same job...
  configPanel.seriesCount = configPanel.dataColCount;
  // SERIES
  // NOTE: it's annoying, the way I have to keep dragging properties back out
  // of configPanel...
  // Colour sets vary according to number of series...
  let colourCount = configPanel.seriesCount;
  // ...except pies, which use number of points per series
  const bothTypes = `${activePanel.chartType.left.type}.
    ${activePanel.chartType.right.type}.`;
  if (bothTypes.includes('pie')) {
    colourCount = configPanel.pointCount;
  }
  // Don't try to set series props on a table
  // FIXME: my use of left and right types to determine overall chart type
  // is stupid. For now, I'm doing a crude table check, but it needs
  // fixing to use overallType. Also, I've long played fast-and-loose
  // with setting left. and right.type. I shouldn't by writing
  // crap like this!
  const isTable =
    activePanel.chartType.left.type.includes('table') &&
    activePanel.chartType.right.type.includes('table');
  if (isTable) {
    injectTablePropsIntoConfig(configPanel, presetsConfig);
  } else {
    configPanel.series = reconcileEdConfigPanelSeriesToConfig(
      activePanel,
      colourCount,
      configPanel.scales.splitDataAtCol,
      presetsConfig,
    );
    // FIXME: kludge to get scatter y-axis side into config
    configPanel.scatterYaxisSide = activePanel.scales.scatter.yAxisSide;
    // FIXME: overallChartType looks ahead to the day when
    // I get around to refactoring data structure. Meanwhile...
    // Overall chart type (includes Mixed/Double/Table)
    const ocType = activePanel.overallChartType;
    if (typeof ocType === 'undefined') {
      configPanel.overallChartType = '';
    } else {
      configPanel.overallChartType = ocType;
    }
  }
  reconcileEdConfigOtherPropsToConfig(configPanel, presetsConfig);
  return configPanel;
}
// RECONCILE EDITOR TO CHART PANEL CONFIG ends

// RECONCILE ED CONFIG OTHER PROPS TO CONFIG
// Added Apr'24
// Called from reconcileEditorToChartPanelConfig
// to pull in properties from PP 'other' node
export function reconcileEdConfigOtherPropsToConfig(
  configPanel,
  presetsConfig,
) {
  const preset = presetsConfig.presetName;
  const subpreset = presetsConfig.subpresetName;
  const pps = presetsConfig.userPresets;
  const specificOtherProps = pps[preset][subpreset].other;
  // Have to be specific:
  if (
    specificOtherProps &&
    specificOtherProps.indexDot &&
    specificOtherProps.indexDot.fill
  ) {
    const fill = specificOtherProps.indexDot.fill;
    configPanel.indexDot.fillName = fill;
    configPanel.indexDot.fillValue = globalAssets.ColourLookup.colours[fill];
  }
  if (
    specificOtherProps &&
    specificOtherProps.indexDot &&
    specificOtherProps.indexDot.radius
  ) {
    configPanel.indexDot.radius = specificOtherProps.indexDot.radius;
  }
  if (
    specificOtherProps &&
    specificOtherProps.brokenScale &&
    specificOtherProps.brokenScale.stroke
  ) {
    const stroke = specificOtherProps.brokenScale.stroke;
    configPanel.brokenScaleSymbol.strokeName = stroke;
    configPanel.brokenScaleSymbol.strokeValue =
      globalAssets.ColourLookup.colours[stroke];
  }

  // if (typeof specificOtherProps !== 'undefined') {
  //   const idProps = specificOtherProps.indexDot;
  //   if (typeof idProps !== 'undefined') {
  //     configPanel.indexDot.fillName = idProps.fill;
  //     configPanel.indexDot.fillValue = globalAssets.ColourLookup.colours[idProps.fill];
  //     configPanel.indexDot.radius = idProps.radius;
  //   }
  //   const bsProps = specificOtherProps.brokenScale;
  //   if (typeof bsProps !== 'undefined') {
  //     configPanel.brokenScaleSymbol.strokeName = bsProps.stroke;
  //     configPanel.brokenScaleSymbol.strokeValue =
  //       globalAssets.ColourLookup.colours[bsProps.stroke];
  //   }
  // }
}
// RECONCILE ED CONFIG OTHER PROPS TO CONFIG ends

// INJECT TABLE PROPS INTO CONFIG
export function injectTablePropsIntoConfig(configPanel, presetsConfig) {
  // First get default table properties. These will be used if there
  // are no specific PP.series.table props to overwrite
  const tableProps = JSON.parse(
    JSON.stringify(globalAssets.DefaultPreferences.series.table),
  );
  // Look for table props for sub/preset
  const preset = presetsConfig.presetName;
  const subpreset = presetsConfig.subpresetName;
  const pps = presetsConfig.userPresets;
  // Sadly, optional chaining isn't available
  // const testObj = pps[preset][subpreset].series?.table;
  // So we do it the hard way:
  let specificTableProps = pps[preset][subpreset].series;
  if (typeof specificTableProps !== 'undefined') {
    specificTableProps = specificTableProps.table;
    if (typeof specificTableProps !== 'undefined') {
      // So if there IS a 'table' node, merge its deltas into
      // the default props
      EditorUtils.deepMerge(tableProps, specificTableProps);
      // tableProps = JSON.parse(JSON.stringify(specificTableProps));
    }
  }
  // Pass either default or specific (if they exist) table props to config
  configPanel.tableProperties = tableProps;
  // Prior to Jan'24, we used the default for all tables
  // These lines can delete in due course
  // configPanel.tableProperties = Object.assign(
  //   {},
  //   globalAssets.DefaultPreferences.series.table,
  // );
  configPanel.overallChartType = 'table';
}
// INJECT TABLE PROPS INTO CONFIG ends

// RECONCILE EDITOR TO CHART GLOBAL CONFIG
// Called from Editor.reconcileEditorToChartConfig, to transfer global properties by ref
// Args are editorConfig.global and the complete chartConfig
export function reconcileEditorToChartGlobalConfig(
  editorConfigGlobal,
  chartConfig,
  presetsConfig,
) {
  // PRESET/SUBPRESET
  const preset = presetsConfig.presetName;
  const subPreset = presetsConfig.subpresetName;
  chartConfig.metadata.platform = preset;
  chartConfig.metadata.subplatform = subPreset;
  // Panels
  chartConfig.metadata.panels.active = editorConfigGlobal.panelVals.active;
  chartConfig.metadata.panels.total = editorConfigGlobal.panelVals.total;
  chartConfig.metadata.panels.rows = editorConfigGlobal.panelVals.rows;
  // BACKGROUND
  setBackgroundProperties(chartConfig, presetsConfig, false);
  // But overwrite height and width
  // (often redundant, but probably easier just to do it)
  const coDims = chartConfig.background.outerbox.dimensions;
  coDims.width = editorConfigGlobal.size.width;
  coDims.height = editorConfigGlobal.size.height;
  // Global (chart backgroud) strings
  reconcileEdConfigBackgroundStringsToConfig(
    editorConfigGlobal.strings,
    chartConfig,
  );
}
// RECONCILE EDITOR TO CHART GLOBAL CONFIG ends

// EXTRACT SERIES HEADERS
// Called from Editor.handleMonteuxImportValues
// Builds an array, by panel, of series headers
//  Arg is the editorConfig panels array
export function extractSeriesHeaders(panelArray) {
  const seriesHeaders = [];
  for (const oneP in panelArray) {
    const thisP = panelArray[oneP];
    const headers = thisP.chartData.headers;
    if (typeof headers !== 'undefined') {
      seriesHeaders.push(headers);
    }
  }
  return seriesHeaders;
}
// EXTRACT SERIES HEADERS ends

// HAVE HEADERS CHANGED
// Called from Editor.handleMonteuxImportValues
// Checks for changed series structure in new payload
export function haveHeadersChanged(oldHeads, newHeads) {
  let changed = false;
  const oldLen = oldHeads.length;
  const newLen = newHeads.length;
  // If the number of panels has changed, don't try
  // to compare... unless this is first sync, when
  // there are no existing headers
  if (oldLen !== newLen) {
    if (oldLen > 0) {
      changed = true;
    }
  } else {
    for (let pNo = 0; pNo < oldLen; pNo++) {
      const oneOldSet = oldHeads[pNo].join('');
      const oneNewSet = newHeads[pNo].join('');
      if (oneOldSet !== oneNewSet) {
        changed = true;
        break;
      }
    }
  }
  return changed;
}
// HAVE HEADERS CHANGED ends

// GET RANDOM COLOUR
// Called from updateMetadataColourDefinitions. I found this
// out there on the internet. It simply generates a randon hex value
export function getRandomColour() {
  const letters = '0123456789ABCDEF';
  let colour = '#';
  for (let i = 0; i < 6; i++) {
    colour += letters[Math.floor(Math.random() * 16)];
  }
  return colour;
}
// GET RANDOM COLOUR ends

// UPDATE METADATA COLOUR DEFINITIONS
// Called from defineAdditionalColours. Loops through series-colour names for one
// panel. If any name is not found in the global list, it gets a random colour
// and adds it to the global list under that name
export function updateMetadataColourDefinitions(pColourNames, metaColours) {
  const nLen = pColourNames.length - 1;
  for (let iii = nLen; iii >= 0; iii--) {
    const thisName = pColourNames[iii];
    if (typeof metaColours[thisName] === 'undefined') {
      const newColour = getRandomColour();
      metaColours[thisName] = newColour;
    } else {
      break;
    }
  }
}
// UPDATE METADATA COLOUR DEFINITIONS ends

// DEFINE ADDITIONAL COLOURS
// Called from Editor.reconcileEditorToChartConfig.
// The problem is that I can't just define infinite numbers of colours for series.
// So far, I allow for a number of 'named' colours (defined in the style guide) and
// an additional 10 'extra' colours. All are defined in assets/colours.json
// Beyond the extra 10, we have to start adding random colours...
// I append these additional colours to chartConfig.metadata.colours,
// as name/value properties
export function defineAdditionalColours(chartConfig) {
  // List of colour definitions (name: value)
  const metaColours = chartConfig.metadata.colours;
  // Loop through panels
  const panels = chartConfig.panelArray;
  for (let pNo = 0; pNo < panels.length; pNo++) {
    const panel = panels[pNo];
    const ocType = panel.overallChartType;
    // Ignore tables
    if (ocType === 'table') {
      break;
    }
    // Get the list of names of series-colours for this panel
    // const pColourNames = panel.series[ocType].colours;
    // Previous can fail, so there's a kludge of epic proportions
    const pColourNames = getColoursForOverallChartType(panel.series, ocType);
    // Update global list of colour definitions with random colours
    updateMetadataColourDefinitions(pColourNames, metaColours);
  }
}
// DEFINE ADDITIONAL COLOURS ends

// GET COLOURS FOR OVERALL CHART-TYPE
// FIXME: this is a knock-on of the unresolved 'side' and
// overallChartType issues. I'm looking for a set of colour
// definitions, matched to chart type. If I've got scrambled and
// the expected set doesn't exist, just find one that does!
// This is probably only happening with mixed/double-scales, so
// it's very possibly a stacked/point/line or column issue only
export function getColoursForOverallChartType(pSeries, ocType) {
  let lookup = pSeries[ocType];
  if (typeof lookup === 'undefined') {
    // Just grab anything that'll go through
    const altOcTypes = [
      'line',
      'pointline',
      'stepline',
      'column',
      'bar',
      'pie',
      'scatter',
    ];
    for (let iii = 0; iii < altOcTypes.length; iii++) {
      lookup = pSeries[altOcTypes[iii]];
      if (typeof lookup !== 'undefined') {
        break;
      }
    }
  }
  return lookup.colours;
}
// GET COLOURS FOR OVERALL CHART-TYPE ends

// GET ILLUSTRATOR COLOUR SPACE
// Called from setIllustratorColourSpace, below
// presetsConfig is an object with properties
//    user: economist/eiu
//    presetName
//    subpresetName
//    userPresets: the user-specific presets node
// Returns either the found value, or undefined
export function getIllustratorColourSpace(presetsConfig) {
  const upNode = presetsConfig.userPresets;
  const pNode = upNode[presetsConfig.presetName];
  const spNode = pNode[presetsConfig.subpresetName];
  const colourSpace = spNode.colourSpace;
  return colourSpace;
}
// GET ILLUSTRATOR COLOUR SPACE ends

// SET ILLUSTRATOR COLOUR SPACE
// Called from Editor.handleValuesFromSizeAndPreset
// Looks for a new colourSpace property in a subPreset. If found,
// updates EditorConfig.global
export function setIllustratorColourSpace(edConfigGlobal, presetsConfig) {
  // Revert to default
  edConfigGlobal.colourSpace = globalAssets.DefaultPreferences.colourSpace;
  const newColourSpace = getIllustratorColourSpace(presetsConfig);
  if (typeof newColourSpace !== 'undefined') {
    edConfigGlobal.colourSpace = newColourSpace;
  }
}
// SET ILLUSTRATOR COLOUR SPACE ends

// GET ALL PANEL ATTRIBUTES
// Function to extract all panel attributes
// NOTE: it doesn't actually dig quite deep enough. This
// isn't a problem at the moment, since all values for
// .padding.between.x are overwritten (i.e. no deltas)
// But I'm short of time, so it's a kludge
export function getAllPanelAttributes(dps, presetsConfig) {
  let chain;
  const panelKeys = Object.keys(dps.panelAttributes);
  const panelObj = {};
  for (let iii = 0; iii < panelKeys.length; iii++) {
    const keyName = panelKeys[iii];
    chain = ['panelAttributes', keyName];
    const onePanel = findPreferencesNode(presetsConfig, chain);
    panelObj[keyName] = onePanel;
  }
  return panelObj;
}
// GET ALL PANEL ATTRIBUTES ends
