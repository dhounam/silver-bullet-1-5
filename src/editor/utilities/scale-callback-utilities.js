/*
    Functions to triage callbacks from Scales fold and children
    - handleScaleCallback
    - handleFactorCallbak
    - handleInvertCallback
    - handleDoubleScaleCallback
    All (?) called from Editor.handleValuesFromScalesFold
*/

import globalAssets from '../assets/globalAssets';
import * as EditorConfigDefaultUtils from './editor-config-default-utilities';
import * as EditorUtils from './editor-utilities';
import * as FactorUtils from './factor-utilities';
import * as AdvancedFoldUtils from './advanced-fold-utilities';

// SCALE CHANGE SINGLE MIXED DOUBLE
// Called from handleValuesFromDoubleScaleComponent to check
// whether we've swapped from single/mixed to double or vice versa
export function scaleChangeSingleMixedDouble(oldScale, newScale) {
  let scaleChanged = false;
  if (!oldScale.double.isDouble && newScale === 'double') {
    // True for single or mixed to double
    scaleChanged = true;
  } else if (oldScale.double.isDouble && newScale !== 'double') {
    // True for double to single or mixed
    scaleChanged = true;
  }
  // Prev'y True if swapped single/double to or from mixed. But that
  // shouldn't change.
  // else if (newScale === 'mixed' && !oldScale.mixed.isMixed) {
  //   //
  //   scaleChanged = true;
  // } else if (newScale === 'single') {
  //   if (oldScale.mixed.isMixed || oldScale.double.isDouble) {
  //     scaleChanged = true;
  //   }
  // }
  return scaleChanged;
}
// SCALE CHANGE SINGLE MIXED DOUBLE ends

// SCALE CHANGE STACKING
// Called from handleValuesFromDoubleScaleComponent to check
// whether stacking has changed on double scale
export function scaleChangeStacking(oldCT, newCT) {
  let scaleChanged = false;
  if (newCT.left.type === 'column') {
    // Has left-stacking changed?
    const oldStack = oldCT.left.stacked;
    scaleChanged = newCT.left.stacked !== oldStack;
  }
  if (newCT.right.type === 'column') {
    // Has right-stacking changed?
    const oldStack = oldCT.right.stacked;
    scaleChanged = newCT.right.stacked !== oldStack;
  }
  return scaleChanged;
}
// SCALE CHANGE STACKING ends

// SCALE CHANGE SPLIT
// Called from handleValuesFromDoubleScaleComponent to check
// whether split point of series has changed
export function scaleChangeSplit(oldScale, newVals) {
  const oldSplit = oldScale.double.splitDataAtCol;
  return newVals.splitDataAtCol !== oldSplit;
}
// SCALE CHANGE SPLIT ends

// GET SCALE CALLBACK SIDE
// This is a (hopefully) temporary expedient to
// reconcile indexed scale components with my
// fossilised 'side' malarky. Returns
// 'left' or 'right'
// NOTE: As of Oct'19, this shouldn't be called... and,
// with luck, can be deleted. Check back.
export function getScaleCallbackSide(activePanel, scaleVals) {
  const scaleIndex = scaleVals.index;
  const isDouble = activePanel.scales.double.isDouble;
  let side = 'left';
  let chartType = activePanel.chartType.left.type;
  if (activePanel.enableScale.right) {
    chartType = activePanel.chartType.right.type;
  }
  if (isDouble) {
    if (scaleIndex === 1) {
      side = 'right';
    }
  } else if (chartType.includes('scatter')) {
    if (scaleIndex === 1) {
      side = 'right';
    } else if (scaleIndex === 2) {
      side = 'z';
    }
  } else if (
    chartType.includes('line') ||
    chartType.includes('col') ||
    chartType.includes('horiz')
  ) {
    side = 'right';
    // Bars and h-thermos stick on default 'left'
  }
  return side;
}
// GET SCALE CALLBACK SIDE ends

export function updateEdConFromScaleComponent(activePanel, values) {
  const newVals = values.vals.mmi;
  // Map scale index to chart 'side' (currently left/right)
  // NOTE: well, this was crap:
  // const side = getScaleCallbackSide(activePanel, values.vals);
  // As far as I can see (Oct'19), I sent the side into each
  // scale instance, so I should get it back again!
  const side = values.vals.side;
  const { scales } = activePanel;
  const scaleSide = scales[side];
  scaleSide.min = newVals.min;
  scaleSide.max = newVals.max;
  scaleSide.increment = newVals.increment;
  scaleSide.tickDensity = newVals.tickDensity;
  scaleSide.tickValues = newVals.tickValues;
  // Get rid of unwanted properties (these can mess up the Monteux metaData)
  // (Actually, this doesn't solve the problem)
  delete scaleSide.label;
  delete scaleSide.side;
  delete scaleSide.densityOK;
}

// ENABLE SCALE SIDES
export function enableScaleSides(isDouble, chartType, enableSide) {
  // I haven't allowed for stacking. But actually, I think that
  // is unnecessary -- basic chart type is enough
  const eObj = {
    left: false,
    right: false,
  };
  if (isDouble) {
    eObj.left = true;
    eObj.right = true;
  } else {
    if (chartType.includes('bar')) {
      // NOTE: I might eventually want to translate top/bottom to left/right
      // Meanwhile, just forcing 'left'
      enableSide = 'left';
    }
    eObj[enableSide] = true;
  }
  return eObj;
}
// ENABLE SCALE SIDES ends

// HANDLE VALUES FROM DOUBLE SCALE COMPONENT
export function handleValuesFromDoubleScaleComponent(editorConfig, values) {
  // Fetch props
  const edConGlobal = editorConfig.global;
  const { chartIndex } = edConGlobal;
  const activePanel = editorConfig.panels[chartIndex];
  // Existing and new scale properties:
  const oldScale = activePanel.scales;
  const newScale = values.scale;
  // Check for any changes that would require a
  // re-calculation of the scale values
  // Has single/mixed/double status changed?
  let scaleChanged = scaleChangeSingleMixedDouble(oldScale, newScale);
  // Has stacking changed?
  if (!scaleChanged) {
    scaleChanged = scaleChangeStacking(activePanel.chartType, values.chartType);
  }
  // Has split point changed, mixed/double?
  if (!scaleChanged) {
    scaleChanged = scaleChangeSplit(oldScale, values);
  }
  // Current enablement left/right
  // scaleChanged is true if 'scale' has changed (e.g. single to double)
  if (scaleChanged) {
    if (newScale === 'double') {
      // Double scale
      activePanel.enableScale.left = true;
      activePanel.enableScale.right = true;
    } else {
      // Single and mixed revert to default chart type and axis side
      const dps = Object.assign({}, globalAssets.DefaultPreferences);
      const chartType = dps.metadata.defaults.type;
      const side = dps.axes.yAxis.orient[chartType];
      activePanel.enableScale = enableScaleSides(false, chartType, side);
    }
  }
  activePanel.scales.double.isDouble = newScale === 'double';
  activePanel.scales.mixed.isMixed = newScale === 'mixed';
  if (activePanel.scales.double.isDouble) {
    activePanel.scales.double.splitDataAtCol = values.splitDataAtCol;
    activePanel.scales.mixed.splitDataAtCol = 0;
  } else if (activePanel.scales.mixed.isMixed) {
    activePanel.scales.mixed.splitDataAtCol = values.splitDataAtCol;
    activePanel.scales.double.splitDataAtCol = 0;
  } else {
    activePanel.scales.double.splitDataAtCol = 0;
    activePanel.scales.mixed.splitDataAtCol = 0;
  }
  // Try this:
  activePanel.chartType = Object.assign({}, values.chartType);
  // If structural change, reset editorConfig
  // Sends empty string as 3rd param, which is read as 'chartType' for
  // scatters fork
  if (scaleChanged) {
    EditorConfigDefaultUtils.revertPanelDefaultVals(
      editorConfig,
      'double',
      '',
      false,
    );
    // Axis headers:
    AdvancedFoldUtils.updateDefaultAxisHeadersInEdConfig(activePanel, true);
  }
}
// HANDLE VALUES FROM DOUBLE SCALE COMPONENT ends

// HANDLE VALUES FROM INDEXED COMPONENT
export function handleValuesFromIndexedComponent(editorConfig, iFlag) {
  const edConGlobal = editorConfig.global;
  const { chartIndex } = edConGlobal;
  const activePanel = editorConfig.panels[chartIndex];
  activePanel.indexed.indexFlag = iFlag;
}
// HANDLE VALUES FROM INDEXED COMPONENT ends

// HANDLE VALUES FROM LOG COMPONENT
// Called from handleValuesFromScalesComponent to pass
// log flag to editorConfig
export function handleValuesFromLogComponent(editorConfig, values) {
  const activePanel = EditorUtils.getActivePanel(editorConfig);
  const isLog = values.log;
  const side = values.side;
  const chartType = activePanel.chartType[side].type;
  activePanel.scales[side].log = isLog;
  // Parallel to call from double scale handler here...
  EditorConfigDefaultUtils.revertPanelDefaultVals(
    editorConfig,
    'log',
    chartType,
    false,
  );
}
// HANDLE VALUES FROM LOG COMPONENT ends

// HANDLE VALUES FROM SHARE-SCALE COMPONENT
// Handles 'Share Scale'. Applies scale values of current
// panel to all.
// Mod Jun'20 to share chart type, too
// Mod Sep'20 to share index-status
// Mod May'21 to 'swap' sides (bar/column) if nec'y
export function handleValuesFromShareScaleComponent(editorConfig) {
  const cIndex = editorConfig.global.chartIndex;
  const panels = editorConfig.panels;
  const pCount = panels.length;
  const activePanel = panels[cIndex];
  const activeScales = JSON.parse(JSON.stringify(activePanel.scales));
  const activeChartType = JSON.parse(JSON.stringify(activePanel.chartType));
  for (let pNo = 0; pNo < pCount; pNo++) {
    if (pNo !== cIndex) {
      const targetPanel = panels[pNo];
      // Preserve actual min/max values, left/right
      let actualMinLeft = targetPanel.scales.left.actualMin;
      let actualMaxLeft = targetPanel.scales.left.actualMax;
      let actualMinRight = targetPanel.scales.right.actualMin;
      let actualMaxRight = targetPanel.scales.right.actualMax;
      // Do sides swap (e.g., column to bar)?
      const sidesSwap =
        EditorUtils.getSide(targetPanel) !== EditorUtils.getSide(activePanel);
      if (sidesSwap) {
        // Reset enableScale flags
        targetPanel.enableScale = JSON.parse(
          JSON.stringify(activePanel.enableScale),
        );
        // Swap actual values
        actualMinLeft = targetPanel.scales.right.actualMin;
        actualMaxLeft = targetPanel.scales.right.actualMax;
        actualMinRight = targetPanel.scales.left.actualMin;
        actualMaxRight = targetPanel.scales.left.actualMax;
      }
      // Now move scales
      targetPanel.scales.left = activeScales.left;
      targetPanel.scales.right = activeScales.right;
      // ...and put actual values back
      targetPanel.scales.left.actualMin = actualMinLeft;
      targetPanel.scales.left.actualMax = actualMaxLeft;
      targetPanel.scales.right.actualMin = actualMinRight;
      targetPanel.scales.right.actualMax = actualMaxRight;
      // Index status doesn't swap
      setSharedIndexedStatus(targetPanel, activePanel.indexed.indexFlag);
      // Chart type doesn't swap
      targetPanel.chartType = activeChartType;
      targetPanel.overallChartType = activePanel.overallChartType;
    }
  }
}
// HANDLE VALUES FROM SHARE-SCALE COMPONENT

// export function setSharedChartType(targetPanel, activePanel) {
//   const activeChartTypeObject = activePanel.chartType;
//   const tSide = EditorUtils.getSide(targetPanel);
//   const aSide = EditorUtils.getSide(activePanel);
//   if (tSide === aSide) {
//     targetPanel.chartType = JSON.parse(JSON.stringify(activeChartTypeObject));
//   } else {
//     targetPanel.chartType.left = JSON.parse(
//       JSON.stringify(activeChartTypeObject.right),
//     );
//     targetPanel.chartType.right = JSON.parse(
//       JSON.stringify(activeChartTypeObject.left),
//     );
//   }
// }

// SET SHARED INDEXED STATUS
// Called from handleValuesFromShartScaleComponent. Sets indexed
// status of target to match source panel (if possible)
export function setSharedIndexedStatus(targetPanel, indexFlag) {
  if (indexFlag) {
    EditorConfigDefaultUtils.getIndexedPoint(
      targetPanel.indexed,
      targetPanel.chartData.dataArray,
      targetPanel.blobs.column,
      true,
    );
  } else {
    targetPanel.indexed = EditorConfigDefaultUtils.getEdConfigDefaultIndexed();
  }
}
// SET SHARED INDEXED STATUS ends

// HANDLE VALUES FROM FACTOR COMPONENT
// Responds to 'Factor' dropdown -- which is disabled, as of Oct'20
export function handleValuesFromFactorComponent(editorConfig, vals) {
  const { chartIndex } = editorConfig.global;
  const activePanel = editorConfig.panels[chartIndex];
  const { scales } = activePanel;
  // 'left' or 'right'
  const activeSide = vals.factorSide;
  const isLeft = vals.factorSide === 'left';
  let targetScale = scales.right;
  let oldFactor = targetScale.factor;
  let newFactor = vals.right.factor;
  if (isLeft) {
    targetScale = scales.left;
    oldFactor = activePanel.scales.left.factor;
    newFactor = vals.left.factor;
  }
  if (oldFactor !== newFactor) {
    // Reset factored vals
    FactorUtils.factorMmiVals(oldFactor, newFactor, targetScale);
    targetScale.factor = newFactor;
    // Update subtitle (or whatever) string
    // Arg 5 is 'isLeft' flag
    FactorUtils.reflectFactorInStrings(
      editorConfig,
      oldFactor,
      newFactor,
      globalAssets.DefaultPreferences.other.factors,
      isLeft,
    );
  }
  // Mixed scale updates inactive side with new factor
  if (scales.mixed.isMixed) {
    oldFactor = scales.right.factor;
    targetScale = scales.right;
    if (activeSide === 'right') {
      oldFactor = scales.left.factor;
      targetScale = scales.left;
    }
    FactorUtils.factorMmiVals(oldFactor, newFactor, targetScale);
    targetScale.factor = newFactor;
  }
}
// HANDLE VALUES FROM FACTOR COMPONENT ends

// HANDLE VALUES FROM SCALES FOLD
// Called from Editor.fieldValuesFromScalesFold
// Calls sub-handlers to deal with specific child
// components of ScalesFoldBody: Scale, Factor,
// Invert, DoubleScale
export function handleValuesFromScalesFold(editorConfig, values) {
  // Get bearings:
  const { chartIndex } = editorConfig.global;
  const activePanel = editorConfig.panels[chartIndex];
  const { scales } = activePanel;
  const subComponent = values.vals.component;
  // If callback came from Scale, I have to update editorConfig,
  // to pass any bad or provisional update back down to
  // the scales fold. So I have a flag to prevent a chart update:
  let callSibyl = values.vals.updateChart;
  if (typeof callSibyl === 'undefined') {
    callSibyl = false;
  }
  if (subComponent === 'scales') {
    updateEdConFromScaleComponent(activePanel, values);
  } else if (subComponent === 'factor') {
    // As of Oct'20, no longer called
    handleValuesFromFactorComponent(editorConfig, values.vals);
  } else if (subComponent === 'invert') {
    // Just update both sides...
    scales.left.invert = values.vals.left.invert;
    scales.right.invert = values.vals.right.invert;
    // But align mixed scales...
    if (scales.mixed.isMixed) {
      if (activePanel.enableScale.left) {
        scales.right.invert = scales.left.invert;
      } else {
        scales.left.invert = scales.right.invert;
      }
    }
  } else if (subComponent === 'doublescale') {
    handleValuesFromDoubleScaleComponent(editorConfig, values.vals);
  } else if (subComponent === 'indexed') {
    const iFlag = values.vals.indexFlag;
    handleValuesFromIndexedComponent(editorConfig, iFlag);
  } else if (subComponent === 'log') {
    handleValuesFromLogComponent(editorConfig, values.vals);
  } else if (subComponent === 'share-scale') {
    handleValuesFromShareScaleComponent(editorConfig);
  }
  return callSibyl;
}
// HANDLE VALUES FROM SCALES FOLD ends
