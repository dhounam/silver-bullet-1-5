// Contains the chain of functions that assemble a virgin
// editorConfig object. And random colour generation for series.
// Main entry is via initiateNewEditorConfig, which is called
// from Editor.componentWillMount...

import globalAssets from "../assets/globalAssets";
import * as FactorUtils from './factor-utilities';
import * as LogUtils from './log-utilities';
import * as OtherUtils from './other-utilities';
import * as EditorUtils from './editor-utilities';

// GET RECOMMENDED MIN-MAX-INCR
// Called from editor-config-utilities.payloadToEdConfigPanel
// for non-log scales. Passed 3 args:
//    object containing actual min & max vals
//    object containing axis props
//      (number of steps, & array of plausible increments)
//    factor
// Returns obj with properties:
//    min, max, increment, factor, log (false)
//    updated step-count
//    tickValues (better than leaving D3 to work out the scale vals to show)
export function getRecommendedMinMaxIncr(actual, aProps, factor) {
  const actualMin = actual.min / factor;
  const actualMax = actual.max / factor;
  // Init new object with actual min/max values
  const mmObj = {
    actualMin,
    actualMax,
    factor,
    log: false,
  };
  let min = 0;
  // Min can't exceed zero; max can't be less than zero
  // NOTE: this needs reconsideration -- or maybe rely upon user overwrite
  const minVal = Math.min(0, actualMin);
  const maxVal = Math.max(0, actualMax);
  // Do (max-min) / steps to get a raw increment
  let increment = (maxVal - minVal) / aProps.tickDensity;
  // We have a list of plausible increments
  const plausibleIncrs = aProps.plausibleIncrements;
  const piLen = plausibleIncrs.length;
  // Factor the increment up or down to fit
  let turns = 1;
  if (increment < plausibleIncrs[0]) {
    while (increment < plausibleIncrs[0]) {
      increment *= 10;
      turns /= 10;
    }
  } else {
    while (increment > plausibleIncrs[piLen - 1]) {
      increment /= 10;
      turns *= 10;
    }
  }
  // Increment is probably imperfect, so loop through
  // the array of plausibilities, raising the increment
  // to the next acceptable value
  // Plausible increment is the first greater than the raw incr.
  for (let i = 0; i < piLen; i++) {
    const plausVal = plausibleIncrs[i];
    if (plausVal >= increment) {
      increment = plausVal;
      break;
    }
  }
  // Now multiply increment back up again, fixing precision:
  increment = OtherUtils.trimDecimals(increment * turns);
  // From zero, lower min to next acceptable value on or below inherited min
  while (min > minVal) {
    min -= increment;
  }
  // From min, raise max to next acceptable value on or above inherited max
  // Build tickValues as we go, since we need tickDensity for scales forms
  let max = min;
  const tickValues = [max];
  while (max < maxVal) {
    // Fixing any precision error:
    max = OtherUtils.trimDecimals(max + increment);
    tickValues.push(max);
  }
  // Revise number of ticks?
  const tickDensity = tickValues.length;
  // Since I'm going to use the array of 'tickValues' to force
  // scale vals in D3, there's some redundancy here. But I
  // need MMI values for the Scales fold.
  mmObj.min = min;
  mmObj.max = max;
  mmObj.increment = increment;
  mmObj.tickDensity = tickDensity;
  mmObj.tickValues = tickValues;
  return mmObj;
}
// GET RECOMMENDED MIN-MAX-INCR ends

// GET ROW MIN MAX OR TOTAL
// Called from editor-config-utilities. to add up vals in a data row
// Args are a sub-array of a data-row and a flag to
// indicate un/stacked data.
// Returns an object with min and max properties.
export function getRowMinMaxOrTotal(rowArray, accum) {
  // I want to return either:
  //    accum'd row total & lowest val, or
  //    highest & lowest vals in row
  let rowMin = 0;
  let rowMax = 0;
  // Ignoring blanks
  const filtArray = rowArray.filter(val => val.toString().length > 0);
  if (accum) {
    for (const iii in filtArray) {
      const val = Number(filtArray[iii]);
      if (val > 0) {
        rowMax += val;
      } else {
        rowMin += val;
      }
    }
  } else if (filtArray.length > 0) {
    // Unaccum'd, unless all blanks
    rowMax = Math.max(...filtArray);
    rowMin = Math.min(...filtArray);
  } else {
    // If row is entirely empty, in order to avoid returning a disruptive
    // zero, I set to an arbitrary string that will evaluate as NaN
    rowMin = 'no minimum value in empty row';
    // Max can safely be left as default zero. Row gets ignored by caller.
  }
  return {
    min: rowMin,
    max: rowMax,
  };
}
// GET ROW MIN MAX OR TOTAL ends

// NEW MIN MAX FUNCTION
// Added Oct'17. This seems like a simpler way to extract
// min and max from un/stacked data. Called from
// EdConfigUtils.resetActualScaleValuesFromNewPayload and
// payloadToEdConfigPanel
export function newMinMaxFcn(dataArray, accum, blobCol) {
  const minMax = {};
  // Flag forces straight extraction of min and max from first row
  // that contains data.
  let setDefaultMinMax = true;
  // Decrement blobCol by 1 to compensate for omission of categories col
  blobCol--;
  // (done internally here, since this is where cats get dropped)
  // dataArray[0] is headers
  for (let rNo = 1; rNo < dataArray.length; rNo++) {
    // Exclude categories
    const thisRow = dataArray[rNo].slice(1);
    // And I may need to exclude a blobs column:
    if (blobCol > 0) {
      thisRow.splice(blobCol, 1);
    }
    const mmRow = getRowMinMaxOrTotal(thisRow, accum);
    // Ignore 'empty' rows that return min as an arbitrary string
    if (!isNaN(mmRow.min)) {
      if (setDefaultMinMax) {
        // First row sets default min/max
        minMax.min = mmRow.min;
        minMax.max = mmRow.max;
        // Set the flag off
        setDefaultMinMax = false;
      } else {
        // After first dataful row
        minMax.min = Math.min(minMax.min, mmRow.min);
        minMax.max = Math.max(minMax.max, mmRow.max);
      }
    }
  }
  // Return actual min and max
  return minMax;
}
// NEW MIN MAX FUNCTION ends

// GET SIDE RECOMMENDED MIN MAX
// Called from revertPanelDefaultVals to work out recommended
// MMI values for complete or partial data array
export function getSideRecommendedMinMax(dArray, isStacked, blobCol, isLog) {
  // Next isn't strictly necessary for log scales
  const actualMinMax = newMinMaxFcn(dArray, isStacked, blobCol);
  // Now get recommended default min/max, assuming factor=1
  const dps = Object.assign({}, globalAssets.DefaultPreferences);
  let recommendedMinMax = {};
  if (isLog) {
    recommendedMinMax = LogUtils.setNewLogScale(actualMinMax);
  } else {
    recommendedMinMax = getRecommendedMinMaxIncr(
      actualMinMax,
      dps.axes.general,
      1,
    );
  }
  return recommendedMinMax;
}
// GET SIDE RECOMMENDED MIN MAX ends

// SET Z-SCALE MIN-MAX
// Called from revertPanelDefaultVals to set simple
// mmi props for a scatter z-axis. Remember: min and max are
// the upper and lower dot radii in points
export function setZScaleMinMax(dataArray, edConfigPanel) {
  // Object with 'min' and 'max' props:
  const actualMinMax = newMinMaxFcn(dataArray, false, 0);
  // New object with actualMin/Max from previous,
  // and scale 'bounds' fromDPs
  edConfigPanel.scales.z = {
    actualMin: actualMinMax.min,
    actualMax: actualMinMax.max,
    min: edConfigPanel.scales.scatter.minSizedRadius,
    max: edConfigPanel.scales.scatter.maxSizedRadius,
  };
}
// SET Z-SCALE MIN-MAX ends

// SET SCALE SIDE MIN MAX
// Called from revertPanelDefaultVals. Calculates default
// MMI and other scale values.
// 'side' is 'left' or 'right' (scatter z axis has separate fcn)
export function setScaleSideMinMax(dataArray, editorConfig, side) {
  const activePanel = EditorUtils.getActivePanel(editorConfig);
  const incomingFactor = activePanel.scales.left.factor;
  // We're provisionally reverting to defaults, so...
  let resetFactor = 1;
  // const log = false;
  const invert = false;
  let stacked = false;
  stacked = activePanel.chartType[side].stacked;
  // NOTE: watch blobCol. This should be zero for d/m... but is it?
  const blobCol = activePanel.blobs.column;
  // Log flag
  const isLog = activePanel.scales[side].log;
  const minMax = getSideRecommendedMinMax(dataArray, stacked, blobCol, isLog);
  activePanel.scales[side] = minMax;
  activePanel.scales[side].invert = invert;
  let isLeft = true;
  if (side === 'right') {
    isLeft = false;
  }
  // Log scales are a kludge. I want to preserve
  // any existing factor, Sep'20.
  // But as of late '20, factoring dropped anyway.
  if (isLog) {
    resetFactor = incomingFactor;
    FactorUtils.factorMmiVals(1, resetFactor, activePanel.scales[side]);
  }
  activePanel.scales[side].factor = resetFactor;
  // Remove any existing factor strings from subtitle
  // or panel or axis headers
  // Basically hitting it with a sledgehammer
  FactorUtils.forceFactorStringsOff(
    editorConfig,
    incomingFactor,
    resetFactor,
    globalAssets.DefaultPreferences.other.factors,
    isLeft,
  );
}
// SET SCALE SIDE MIN MAX ends
