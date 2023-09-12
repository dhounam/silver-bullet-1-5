/*
    Functions to generate configuration objects for the ScalesBody
    fold and its children
      - buildMmiArray
      - makeScalesComponentConfig
      - makeFactorComponentConfig
      - makeInvertComponentConfig
      - getDoubleScaleHeaders
      - getDoubleScaleSplitAndType
      - makeDoubleScaleComponentConfig
      All called from:
      - makeScalesFoldConfig (called from Editor)
*/

// ------------
// SCALE-VALUES

// BUILD MMI ARRAY
// Called from makeScalesComponentConfig. Assembles the
// array of configuration objects: one for each Scale
// component to display
export function buildMmiArray(edConfigPanel) {
  const mmiArray = [];
  const edConfigScales = edConfigPanel.scales;
  // NOTE: edConfigPanel.scales is still glued to my original
  // left/right division. Until that is refactored,
  // I have to unpick inferentially
  const chartType = edConfigPanel.chartType.left.type;
  // Left/right scale enablement
  const { enableScale } = edConfigPanel;
  const { isDouble } = edConfigPanel.scales.double;
  if (isDouble) {
    // Double scales have 'left' and 'right'
    const leftMmi = edConfigScales.left;
    leftMmi.label = 'Left axis:';
    leftMmi.side = 'left';
    mmiArray.push(leftMmi);
    const rightMmi = edConfigScales.right;
    rightMmi.label = 'Right axis:';
    rightMmi.side = 'right';
    mmiArray.push(rightMmi);
  } else if (chartType.includes('scatter')) {
    // Scatters do 0 and 1, then...
    const xMmi = edConfigScales.left;
    xMmi.label = 'X axis:';
    xMmi.side = 'left';
    mmiArray.push(xMmi);
    const yMmi = edConfigScales.right;
    yMmi.label = 'Y axis:';
    yMmi.side = 'right';
    mmiArray.push(yMmi);
    // scalesConfig.mmi.right = yMmi;
    if (chartType.includes('sized')) {
      // Add element 2: scatter z-axis
      const zMmi = edConfigScales.z;
      zMmi.label = 'Z axis:';
      zMmi.side = 'z';
      mmiArray.push(zMmi);
    }
  } else if (
    chartType.includes('bar') ||
    chartType.includes('thermohorizontal')
  ) {
    let side = 'left';
    const label = 'X axis';
    if (enableScale.right) {
      side = 'right';
    }
    const singleMmi = edConfigScales[side];
    singleMmi.label = label;
    singleMmi.side = side;
    mmiArray.push(singleMmi);
  } else {
    // NOTE: currently hard-wiring 'side'; but I need
    // to fetch that in from DPs, according to chart type
    let side = 'left';
    let label = 'Left axis';
    if (enableScale.right) {
      side = 'right';
      label = 'Right axis';
    }
    const singleMmi = edConfigScales[side];
    singleMmi.label = label;
    singleMmi.side = side;
    mmiArray.push(singleMmi);
  }
  return mmiArray;
}
// BUILD MMI ARRAY ends

// MAKE SCALES COMPONENT CONFIG
// Sets enablement and values for scales fold
export function makeScalesComponentConfig(
  edConfigPanel,
  maximumIncrements,
  canShare,
) {
  const scalesConfig = {
    maximumIncrements,
    canShareScale: canShare,
  };
  // Double?
  const { isDouble } = edConfigPanel.scales.double;
  const mmiArray = buildMmiArray(edConfigPanel);
  // Array of objects with properties:
  //    min
  //    max
  //    increment
  //    actualMin
  //    actualMax
  //    tickDensity
  //    factor
  //    side
  scalesConfig.mmiArray = mmiArray;
  // If it's a double or mixed scale, tick counts must match
  let misMatch = false;
  // Scatters allow mismatch (and are mutually exclusive with doublescales)
  const isScatter = edConfigPanel.chartType.left.type.includes('scatter');
  if (isDouble) {
    misMatch = mmiArray[0].tickDensity !== mmiArray[1].tickDensity;
  }
  scalesConfig.tickCountsMisMatch = misMatch;
  scalesConfig.isScatter = isScatter;
  return scalesConfig;
}
// MAKE SCALES COMPONENT CONFIG ends

// ---------
// FACTORING

//  GET FACTOR CONFIG BY SIDE
// Called from makeFactorComponentConfig. Returns
// side-specific properties
export function getFactorConfigBySide(edConfigPanel, side) {
  const scale = edConfigPanel.scales[side];
  // I need to evaluate both min and max values (lose any preceding '-')
  // Originally used actualMin/Max; now use user-set scale vals
  // But I have to take any factor into account:
  const maxVal = (Math.abs(scale.max) * scale.factor).toString();
  const minVal = (Math.abs(scale.min) * scale.factor).toString();
  // Lose decimal points and get length of longer
  const maxLen = maxVal.replace('.', '').length;
  const minLen = minVal.replace('.', '').length;
  const len = Math.max(maxLen, minLen);
  // Label:
  let label = 'Right axis';
  // Labelling is all very inferential. FIXME: on day...
  if (
    edConfigPanel.overallChartType === 'bar' ||
    edConfigPanel.overallChartType === 'thermohorizontal'
  ) {
    if (side === 'left') {
      label = 'X axis';
    } else {
      label = '';
    }
  } else if (edConfigPanel.overallChartType.includes('scatter')) {
    if (side === 'left') {
      label = 'X axis';
    } else {
      label = 'Y axis';
    }
  } else if (side === 'left') {
    label = 'Left axis';
  }
  // Enablement and factor value:
  const enable = edConfigPanel.enableScale[side];
  const factor = scale.factor;
  // No longer disabled for log
  // if (scale.log) {
  //   enable = false;
  //   factor = 1;
  // }
  return {
    factor,
    maxLen: len,
    enable,
    label,
  };
}

// MAKE FACTOR COMPONENT CONFIG
// NOTE: can be refactored for left and right
export function makeFactorComponentConfig(edConfigPanel, factorsArray) {
  // Get factor properties for each side
  const leftValues = getFactorConfigBySide(edConfigPanel, 'left');
  const rightValues = getFactorConfigBySide(edConfigPanel, 'right');
  return {
    values: {
      left: leftValues,
      right: rightValues,
      // Mixed flag:
      isMixed: edConfigPanel.scales.mixed.isMixed,
    },
    // And factor lookup
    factorsArray,
  };
}
// MAKE FACTOR COMPONENT CONFIG ends

// ---------
// INVERSION

// MAKE INVERT COMPONENT CONFIG
export function makeInvertComponentConfig(edConfigPanel) {
  // Only enabled for step/lines
  // (Invert is set off by revertedConfigPanelDefaultVals)
  const leftType = edConfigPanel.chartType.left.type;
  const leftCanInvert =
    edConfigPanel.enableScale.left && leftType.includes('line');
  const rightType = edConfigPanel.chartType.right.type;
  const rightCanInvert =
    edConfigPanel.enableScale.right && rightType.includes('line');
  return {
    left: {
      invert: edConfigPanel.scales.left.invert,
      enabled: leftCanInvert,
    },
    right: {
      invert: edConfigPanel.scales.right.invert,
      enabled: rightCanInvert,
    },
    // And mixed flag:
    isMixed: edConfigPanel.scales.mixed.isMixed,
  };
}
// MAKE INVERT COMPONENT CONFIG ends

// GET LOG LABEL
// Called from scaleLogProperties to work out appropriate label for log checkbox
export function getLogLabel(side, type) {
  // Default is line
  let label = `${side[0].toUpperCase()}${side.slice(1).toLowerCase()} axis`;
  if (type.includes('scatter')) {
    if (side === 'left') {
      label = 'X axis';
    } else {
      label = 'Y axis';
    }
  } else if (type === 'thermohorizontal') {
    label = 'X axis';
  } else if (type === 'thermovertical') {
    label = 'Y axis';
  }
  return label;
}
// GET LOG LABEL ends

// SCALE LOG PROPERTIES
// Called from makeLogComponentConfig to determine whether
// scale, left or right, is 'loggable'.
// This isn't the flag that indicates whether we currently have a log scale.
// It's whether:
//    the chart *type* is compatible with log scale
//    actual min value > 0
export function scaleLogProperties(edConfigPanel, side) {
  const sideEnabled = edConfigPanel.enableScale[side];
  const type = edConfigPanel.chartType[side].type;
  const isStacked = edConfigPanel.chartType[side].isStacked;
  const isLine = type.includes('line');
  const isScatter = type.includes('scatter');
  const isThermo = type.includes('thermo');
  const { isDouble } = edConfigPanel.scales.double;
  const { isMixed } = edConfigPanel.scales.mixed;
  // const factored = edConfigPanel.scales[side].factor > 1;
  const actualMin = edConfigPanel.scales[side].actualMin;
  // The *ability* to be a log scale
  let canLog = false;
  // The current log status of the scale
  let log = false;
  // Label for the control
  const label = getLogLabel(side, type);
  if (sideEnabled) {
    // Only loggable if all vals > 0...
    if (actualMin > 0) {
      // ...for certain types
      if (isLine || isScatter || isThermo) {
        // But can't be layer cake or double/mixed
        // NOTE: actually, mixed should be allowed
        // Couldn't be factored, until Sep'20
        // if (!isStacked && !factored) {
        if (!isStacked && !isDouble && !isMixed) {
          canLog = true;
          if (typeof log !== 'undefined') {
            log = edConfigPanel.scales[side].log;
          }
        }
      }
    }
  }
  return {
    enabled: canLog,
    log,
    label,
  };
}
// SCALE LOG PROPERTIES ends

// MAKE LOG COMPONENT CONFIG
// Called from makeScalesFoldConfig to create log component config
export function makeLogComponentConfig(edConfigPanel) {
  const left = scaleLogProperties(edConfigPanel, 'left');
  const right = scaleLogProperties(edConfigPanel, 'right');
  return {
    left,
    right,
  };
}
// MAKE LOG COMPONENT CONFIG ends

// ---------------------
// DOUBLE SCALE HANDLERS

// GET DOUBLESCALE HEADERS
// Called from makeDoubleScaleComponentConfig
export function getDoubleScaleHeaders(dArray) {
  let headers = [];
  if (dArray.length > 0) {
    headers = JSON.parse(JSON.stringify(dArray[0]));
    // Remove cat-header and last series
    headers.shift();
    headers.pop();
  }
  return headers;
}
// GET DOUBLESCALE HEADERS ends

// GET DOUBLESCALE SPLIT AND TYPE
// Called from makeDoubleScaleComponentConfig
export function getDoubleScaleSplitAndType(scales) {
  let splitAt = 0;
  let scaleStr = 'single';
  if (scales.double.isDouble) {
    splitAt = scales.double.splitDataAtCol;
    scaleStr = 'double';
  } else if (scales.mixed.isMixed) {
    splitAt = scales.mixed.splitDataAtCol;
    scaleStr = 'mixed';
  }
  return {
    splitAt,
    scaleStr,
  };
}
// GET DOUBLESCALE SPLIT AND TYPE ends

// MAKE DOUBLE SCALE COMPONENT CONFIG
// Called from makeScalesFoldConfig
// Args are panel-specific editorConfig object; array of chart types
// compatible with double scales
export function makeDoubleScaleComponentConfig(
  edConfigPanel,
  doubleableStyles,
) {
  // DOUBLE/MIXED
  const doubleScale = {
    // Double/mixed options disabled by default
    disableDouble: true,
  };
  // En/disablement
  // If only one series (cats are 1 col)
  const threshold = 2;
  // Can't double a logged scale
  const notLogged =
    !edConfigPanel.scales.left.log && !edConfigPanel.scales.right.log;
  // I want to check number of series, but at start up, there aren't *any*!
  // So...
  let dataColCount = 0;
  const dArray = edConfigPanel.chartData.dataArray;
  if (dArray.length > 0) {
    dataColCount = dArray[0].length;
  }
  const noBlobs = edConfigPanel.blobs.column === 0;
  // If no blobs or log-scale, and more than one series:
  if (noBlobs && notLogged && dataColCount > threshold) {
    // Check left/right for line/col...
    const leftType = edConfigPanel.chartType.left;
    const rightType = edConfigPanel.chartType.right;
    // ...but (Jun'21) disable for stacked lines
    const stackedLineLeft = leftType.type === 'line' && leftType.stacked;
    const stackedLineRight = rightType.type === 'line' && rightType.stacked;
    if (edConfigPanel.enableScale.left) {
      if (
        !stackedLineLeft &&
        doubleableStyles.includes(edConfigPanel.chartType.left.type)
      ) {
        doubleScale.disableDouble = false;
      }
    } else if (
      !stackedLineRight &&
      doubleableStyles.includes(edConfigPanel.chartType.right.type)
    ) {
      doubleScale.disableDouble = false;
    }
  }
  // Headers for dropdown
  doubleScale.headers = getDoubleScaleHeaders(dArray);
  // Split at col and scale-type string...
  const splitAndType = getDoubleScaleSplitAndType(edConfigPanel.scales);
  doubleScale.splitDataAtCol = splitAndType.splitAt;
  doubleScale.scale = splitAndType.scaleStr;
  // Other properties
  doubleScale.chartType = Object.assign({}, edConfigPanel.chartType);
  // Is either scale inverted?
  doubleScale.invert = {
    left: edConfigPanel.scales.left.invert,
    right: edConfigPanel.scales.right.invert,
  };
  return doubleScale;
}
// MAKE DOUBLE SCALE COMPONENT CONFIG ends

// CAN SHARE SCALE
// Called from makesScalesFoldConfig to establish whether the 'Share scale'
// button in enabled. Scale of active panel can be shared if there are multi-panels,
// and no panel is log, scatter, pie or double scale
// NOTE: may eventually mod to allow, if ALL panels are log or double
export function canShareScale(edConfigScales) {
  let canShare = true;
  // Must be at least 2 panels
  const pCount = edConfigScales.panels.length;
  if (pCount < 2) {
    canShare = false;
  } else {
    for (let pNo = 0; pNo < pCount; pNo++) {
      const myPanel = edConfigScales.panels[pNo];
      const myScales = myPanel.scales;
      // No double, mixed or log scales, pies or scatters
      if (
        myScales.double.isDouble ||
        myScales.mixed.isMixed ||
        myScales.left.log ||
        myScales.right.log ||
        myPanel.overallChartType === 'pie' ||
        myScales.scatter.isScatter
      ) {
        canShare = false;
        break;
      }
    }
  }
  return canShare;
}
// CAN SHARE SCALE ends

// ------------------------
// ENTRY POINT, FROM EDITOR

// MAKE SCALES FOLD CONFIG
// Called from Editor.makeFoldsJsx. Arguments are the
// complete editorConfig object; the array of factor definitions
// from DPs; and an array of styles compatible with
// a double scale
export function makeScalesFoldConfig(
  edConfig,
  factors,
  doubleableStyles,
  disabled,
  maximumIncrements,
) {
  const cIndex = edConfig.global.chartIndex;
  const edConfigPanel = edConfig.panels[cIndex];
  // For panel sharing:
  const canShare = canShareScale(edConfig);
  return {
    scales: makeScalesComponentConfig(
      edConfigPanel,
      maximumIncrements,
      canShare,
    ),
    // Still called, although factors tempor'y disabled, Oct'20:
    factor: makeFactorComponentConfig(edConfigPanel, factors),
    invert: makeInvertComponentConfig(edConfigPanel),
    log: makeLogComponentConfig(edConfigPanel),
    doubleScale: makeDoubleScaleComponentConfig(
      edConfigPanel,
      doubleableStyles,
    ),
    indexed: Object.assign({}, edConfigPanel.indexed),
    disabled,
    maximumIncrements,
  };
}
// MAKE SCALES FOLD CONFIG ends
