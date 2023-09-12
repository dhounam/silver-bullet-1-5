// Sheet property-names need to be separable (I'm using
// underscores). So break camelcase...
// /* eslint-disable camelcase, no-console */
/* eslint-disable camelcase */

// Monteux:
import Monteux from './monteux';

// GET TIME STAMP
// Called from updateGoogleSheet, returns time-stamp
// as 'yyyy,mm,dd,hh,mm,ss'
export function getTimeStamp() {
  const timeNow = new Date();
  let tStr = timeNow.getFullYear();
  // Month indexed from zero
  tStr = `${tStr},${timeNow.getMonth()}`;
  tStr = `${tStr},${timeNow.getDate()}`;
  tStr = `${tStr},${timeNow.getHours()}`;
  tStr = `${tStr},${timeNow.getMinutes()}`;
  tStr = `${tStr},${timeNow.getSeconds()}`;
  return tStr;
}
// GET TIME STAMP ends

// GET GLOBAL PROPERTIES
// Global properties as an object, inferentially assembled
export function getGlobalValues(edConfigGlobal) {
  const gVals = {
    sheetId: edConfigGlobal.sheetId,
    name: edConfigGlobal.fileName.name,
    chartNumber: edConfigGlobal.fileName.number,
    preset: edConfigGlobal.presets.preset,
    subPreset: edConfigGlobal.presets.subPreset,
    height: +edConfigGlobal.size.height,
    width: +edConfigGlobal.size.width,
    title: edConfigGlobal.strings.title,
    subtitle: edConfigGlobal.strings.subtitle,
    subSubtitle: edConfigGlobal.strings.subsubtitle,
    footnote: edConfigGlobal.strings.footnote,
    source: edConfigGlobal.strings.source,
    numberBox: edConfigGlobal.strings.numberBox,
    // Timestamp
    lastUpdate: getTimeStamp(),
    // Panels: total, row-count and 'active' panel index
    panelTotal: edConfigGlobal.panelVals.total,
    panelRows: edConfigGlobal.panelVals.rows,
    chartIndex: edConfigGlobal.chartIndex,
  };
  return gVals;
}
// GET GLOBAL PROPERTIES ends

// MAKE GLOBAL OBJECT
// Called from updateGoogleSheet, returns the payload for the
// global Google sheet
export function makeGlobalObject(edConfig) {
  return {
    // Google global tab's id
    id: edConfig.monteux.globalTabId,
    values: getGlobalValues(edConfig.global),
  };
}
// MAKE GLOBAL OBJECT ends

// REMOVE ROGUE SCALE PROPERTIES
// Called from appendPanelMetadataProperties. This was a kludge
// to get round the fact that editorConfig erratically contained a
// couple of rogue properties that could cause irregularities
// in the Monteux metaData sheet.
// FIXME: now that metadata are cleared before overwriting, this is deletable
export function removeRogueProperties(key) {
  // Scale props
  // if (typeof key.label !== 'undefined') {
  //   delete key.label;
  // }
  // if (typeof key.side !== 'undefined') {
  //   delete key.side;
  // }
  // Indexed props
  if (typeof key.fillName !== 'undefined') {
    delete key.fillName;
  }
  if (typeof key.fillValue !== 'undefined') {
    delete key.fillValue;
  }
  if (typeof key.radius !== 'undefined') {
    delete key.radius;
  }
  if (typeof key.value !== 'undefined') {
    delete key.value;
  }
}
// REMOVE ROGUE SCALE PROPERTIES ends

// APPEND PANEL METADATA PROPERTIES
// Called from updateGoogleSheet to append a specific sub-set of
// metadata (e.g. blob definitions) to the metadata object for
// one panel
// Args are the source object in editorConfig; the key for the node in
// that source object; and the metadata object to which the
// properties are appended...
export function appendPanelMetadataProperties(
  sourceObj,
  targetKey,
  metadataObj,
) {
  // Kludge for the problem with rogue properties
  if (targetKey.includes('scales')) {
    removeRogueProperties(sourceObj);
  }
  if (targetKey.includes('indexed')) {
    removeRogueProperties(sourceObj);
  }
  const oKeys = Object.keys(sourceObj);
  for (let kNo = 0; kNo < oKeys.length; kNo++) {
    // If tickValues array, join:
    let metaVal = sourceObj[oKeys[kNo]];
    if (Array.isArray(metaVal)) {
      metaVal = metaVal.join(';');
    }
    metadataObj[`${targetKey}${oKeys[kNo]}`] = metaVal;
  }
}
// APPEND PANEL METADATA PROPERTIES ends

// GET METADATA FOR ONE PANEL
// Passed the source object for one panel, returns an object defining
// all properties shared with Sheet
export function getMetadataForOnePanel(thisPanelSource) {
  const metadataObj = {};
  // I'm collecting sub-properties by type (e.g. blobs.column, .header and
  // .isRect). I pass a values object, where all properties are collected,
  // into a sub-fcn that appends those properties...
  const mVals = {};
  // Blobs
  appendPanelMetadataProperties(thisPanelSource.blobs, 'blobs_', mVals);
  // Chart type, left and right
  appendPanelMetadataProperties(
    thisPanelSource.chartType.left,
    'chartType_left_',
    mVals,
  );
  appendPanelMetadataProperties(
    thisPanelSource.chartType.right,
    'chartType_right_',
    mVals,
  );
  // Enable scale
  appendPanelMetadataProperties(
    thisPanelSource.enableScale,
    'enableScale_',
    mVals,
  );
  // Indexed
  appendPanelMetadataProperties(thisPanelSource.indexed, 'indexed_', mVals);
  // Legend
  appendPanelMetadataProperties(thisPanelSource.legend, 'legend_', mVals);
  // Scales: double
  appendPanelMetadataProperties(
    thisPanelSource.scales.double,
    'scales_double_',
    mVals,
  );
  // Scales: left
  appendPanelMetadataProperties(
    thisPanelSource.scales.left,
    'scales_left_',
    mVals,
  );
  // Scales: right
  appendPanelMetadataProperties(
    thisPanelSource.scales.right,
    'scales_right_',
    mVals,
  );
  // Scales: z (may not exist)
  if (typeof thisPanelSource.scales.z !== 'undefined') {
    // eslint-disable-next-line prettier/prettier
    appendPanelMetadataProperties(thisPanelSource.scales.z, 'scales_z_', mVals);
  }
  // Scales: mixed
  appendPanelMetadataProperties(
    thisPanelSource.scales.mixed,
    'scales_mixed_',
    mVals,
  );
  // Axis headers
  // Sep'20, axis headers recoupled to series headers
  // appendPanelMetadataProperties(
  //   thisPanelSource.axisHeaders,
  //   'axisHeaders_',
  //   mVals,
  // );
  // Feb'21, x-axis header only restored
  const xaxisHeader = thisPanelSource.axisHeaders.xaxis.trim();
  if (xaxisHeader.length > 0) {
    mVals.axisHeaders_xaxis = xaxisHeader;
  }
  // Now append individual properties
  // Panel header
  mVals.panelHeader = thisPanelSource.panelHeader;
  mVals.overallChartType = thisPanelSource.overallChartType;
  // Inferentially, tickValues arrays as strings...

  // OK: so this is all fucked. What am I trying to do?
  // Yeah, this is stupid, because I'm setting the exported tickValues property
  // to an empty string, then only changing if it's NOT an empty string!

  mVals.scales_left_tickValues = '';
  // let tvObj = mVals.scales_left_tickValues;
  let tvObj = thisPanelSource.scales.left.tickValues;
  if (typeof tvObj !== 'undefined' && tvObj.length > 0) {
    mVals.scales_left_tickValues = tvObj.join(';');
  }
  mVals.scales_right_tickValues = '';
  // tvObj = mVals.scales_right_tickValues;
  tvObj = thisPanelSource.scales.right.tickValues;
  if (typeof tvObj !== 'undefined' && tvObj.length > 0) {
    mVals.scales_right_tickValues = tvObj.join(';');
  }
  metadataObj.values = mVals;
  return metadataObj;
}
// GET METADATA FOR ONE PANEL ends

// GET RAW DATA FOR ONE PANEL
export function getRawdataForOnePanel(thisPanelSource) {
  return {
    values: thisPanelSource.chartData.dataArray,
  };
}
// GET RAW DATA FOR ONE PANEL ends

// UPDATE GOOGLE SHEET
// Called from Editor.componentDidUpdate to gather properties
// from the editorConfig and update the matching Sheet's metadata
// Incomplete: so far just creates the exportable object
export function updateGoogleSheet(edConfig) {
  // Object to export. This has a global object, and
  // an array, each of whose elements will correspond to a panel
  const payload = {
    id: edConfig.monteux.sheetId,
    global: makeGlobalObject(edConfig),
    panelArray: [],
  };
  // Panel-specific properties
  // NOTE: I thought I didn't need to send raw data back, to Sheet,
  // since I can't change it. But that may not be true...
  // NOTE: ...because panel-shuffling will, I fear, be done by Sibyl...
  const panelSourceArray = edConfig.panels;
  // For each panel...
  for (let pNo = 0; pNo < panelSourceArray.length; pNo++) {
    // Function collects all the metadata props for one panel
    const metaData = getMetadataForOnePanel(panelSourceArray[pNo]);
    const rawData = getRawdataForOnePanel(panelSourceArray[pNo]);
    // In each case, id is taken from edConfig.monteux:
    metaData.id = edConfig.monteux.panels[pNo].metadataTabId;
    rawData.id = edConfig.monteux.panels[pNo].dataTabId;
    // Append to panelArray
    payload.panelArray.push({
      metaData,
      // rawData,
    });
  }

  // This is actually rather overweight, but it seems to make sense
  // to send the same, complete data-structure back...
  // If there's a sheetId, fire off the export event to Monteux
  // If not (specifically if data were pasted into Advance text field)... don't.
  const sheetId = payload.global.values.sheetId;
  const sendToMonteux = typeof sheetId !== 'undefined' && sheetId.length > 0;
  if (sendToMonteux) {
    Monteux.postMessage(payload);
  }
  // console.dir(payload);
}
// UPDATE GOOGLE SHEET ends
