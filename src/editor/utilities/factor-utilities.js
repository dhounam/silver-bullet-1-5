// Functions that handle the consequences of user setting
// a factor value on a scale
// No longer called, Oct'20, since factors are disabled

import * as OtherUtils from './other-utilities';

// FACTORISE STRING
// Called from reflectFactorInSubtitle and reflectFactorInAxisHeader
// to remove/add a factor string
export function factoriseString(str, oldFactor, newFactor, factors, user) {
  // Factor values are 1, 1000 or 1000000
  // I add or remove ", '000" or ", m" to/from the subtitle
  // First, if string ENDS with PREVIOUS factor suffix, remove that
  const oldFactorDef = factors.find(def => def.value === oldFactor);
  if (oldFactorDef.value > 1) {
    const oldSuffix = oldFactorDef.string[user];
    const osLen = oldSuffix.length;
    if (str.includes(oldSuffix) && str.slice(-osLen) === oldSuffix) {
      str = str.slice(0, -osLen);
    }
  }
  // Look up the new factor in the array, and append the suffix
  const newFactorDef = factors.find(def => def.value === newFactor);
  str = `${str}${newFactorDef.string[user]}`;
  return str;
}
// FACTORISE STRING ends

// REFLECT FACTOR IN SUBTITLE
// Called from reflectFactorInStrings
// Changes subtitle string to indicate scale factor
// Params are editorConfig.global, which is updated by ref;
// old and new factors *as 1, 1000 or 1000000*;
// and an array of factor definitions
export function reflectFactorInSubtitle(
  edConfigGlobal,
  oldFactor,
  newFactor,
  factors,
  user,
) {
  let subTitle = edConfigGlobal.strings.subtitle;
  subTitle = factoriseString(subTitle, oldFactor, newFactor, factors, user);
  edConfigGlobal.strings.subtitle = subTitle;
}
// REFLECT FACTOR IN SUBTITLE ends

// REFLECT FACTOR IN PANEL HEADER
// Called from reflectFactorInStrings
// Changes subtitle string to indicate scale factor
// Params are the active panel, which is updated by ref;
// old and new factors *as 1, 1000 or 1000000*;
// and an array of factor definitions
export function reflectFactorInPanelHeader(
  activePanel,
  oldFactor,
  newFactor,
  factors,
  user,
) {
  let str = activePanel.panelHeader;
  str = factoriseString(str, oldFactor, newFactor, factors, user);
  activePanel.panelHeader = str;
}
// REFLECT FACTOR IN PANEL HEADER ends

// REFLECT FACTOR IN AXIS HEADER
// Called from reflectFactorInStrings to update relevant axis header
// Scatters and double-scales only
export function reflectFactorInAxisHeader(
  activePanel,
  oldFactor,
  newFactor,
  factors,
  isLeft,
  user,
) {
  // Originally changed *series* headers
  // As of Sep'20, changes independent *axis* headers
  const heads = activePanel.axisHeaders;
  const cType = activePanel.overallChartType;
  // Default is r/h y axis
  let factorName = 'yaxisright';
  if (isLeft) {
    if (cType.includes('scatter')) {
      // Scatter: left maps to x-axis (for now, at least)
      factorName = 'xaxis';
    } else {
      // Double scale
      factorName = 'yaxisleft';
    }
  }
  heads[factorName] = factoriseString(
    heads[factorName],
    oldFactor,
    newFactor,
    factors,
    user,
  );
}
// REFLECT FACTOR IN AXIS HEADER ends

// REFLECT FACTOR IN STRINGS
// Called from Editor.handleValuesFromScalesFold
// Determines whether factor strings should be appended to
// global subtitle or a chart-specific axis header
// Final param, 'factors' is DP definitions object
export function reflectFactorInStrings(
  edConfig,
  oldFactor,
  newFactor,
  factors,
  isLeft,
) {
  // Double or mixed/single scale?
  const { chartIndex, user } = edConfig.global;
  const activePanel = edConfig.panels[chartIndex];
  const isDouble = activePanel.scales.double.isDouble;
  // FIXME: this flag ought to work, but doesn't.
  // const isScatter = activePanel.scales.scatter.isScatter;
  const isScatter = activePanel.chartType.left.type.includes('scatter');
  // Multi-panel?
  const isPanels = edConfig.panels.length > 1;

  if (isDouble || isScatter) {
    reflectFactorInAxisHeader(
      activePanel,
      oldFactor,
      newFactor,
      factors,
      isLeft,
      user,
    );
  } else if (isPanels) {
    reflectFactorInPanelHeader(
      activePanel,
      oldFactor,
      newFactor,
      factors,
      user,
    );
  } else {
    reflectFactorInSubtitle(
      edConfig.global,
      oldFactor,
      newFactor,
      factors,
      user,
    );
  }
}
// REFLECT FACTOR IN STRINGS ends

// FORCE FACTOR STRINGS OFF
// Called from EditorConfigDefaultUtilities.setScaleSideMinMax to
// remove any factor strings
export function forceFactorStringsOff(
  editorConfig,
  oldFactor,
  newFactor,
  factors,
  isLeft,
) {
  // Double or mixed/single scale?
  const { chartIndex, user } = editorConfig.global;
  const activePanel = editorConfig.panels[chartIndex];
  // Just hit everything:
  reflectFactorInAxisHeader(
    activePanel,
    oldFactor,
    newFactor,
    factors,
    isLeft,
    user,
  );
  reflectFactorInSubtitle(
    editorConfig.global,
    oldFactor,
    newFactor,
    factors,
    user,
  );
  reflectFactorInPanelHeader(activePanel, oldFactor, newFactor, factors, user);
}
// FORCE FACTOR STRINGS OFF ends

// FACTOR MMI VALS
// Called from scale-callback-utilities.handleValuesFromFactorComponent
// to adjust MMI for scale factor
export function factorMmiVals(oldFactor, newFactor, sideScale) {
  const refactorBy = oldFactor / newFactor;
  sideScale.min = OtherUtils.trimDecimals(sideScale.min * refactorBy);
  sideScale.max = OtherUtils.trimDecimals(sideScale.max * refactorBy);
  // And refactor tickValues
  for (let iii = 0; iii < sideScale.tickValues.length; iii++) {
    const tVal = sideScale.tickValues[iii] * refactorBy;
    sideScale.tickValues[iii] = OtherUtils.trimDecimals(tVal);
  }
}
// FACTOR MMI VALS ends
