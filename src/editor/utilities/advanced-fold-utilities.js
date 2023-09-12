// MAKE ADVANCED FOLD CONFIG
// Called from Editor.makeFoldsJsx to assemble config
// objects for Advanced fold sub-components
export function makeAdvancedFoldConfig(editorConfig, dps) {
  const cIndex = editorConfig.global.chartIndex;
  const activePanel = editorConfig.panels[cIndex];
  const textFieldConfig = makeTextFieldConfig(dps);
  const axisHeadersConfig = makeAxisHeadersConfig(activePanel);
  const numberBoxConfig = makeNumberBoxConfig(editorConfig);
  return {
    textFieldConfig,
    axisHeadersConfig,
    numberBoxConfig,
  };
}
// MAKE ADVANCED FOLD CONFIG ends

export function makeNumberBoxConfig(edConfig) {
  return { value: edConfig.global.strings.numberBox };
}

// // MAKE AXIS HEADERS CONFIG
// Config object for axis headers. Arg is active panel
// in editorConfig
export function makeAxisHeadersConfig(activePanel) {
  const axisHeadersConfig = setAxisHeaderContent(activePanel);
  // Enablement depends upon chart type
  setAxisHeaderEnablement(axisHeadersConfig, activePanel);
  return axisHeadersConfig;
}
// MAKE AXIS HEADERS CONFIG ends

// SET AXIS HEADER CONTENT
// Called from makeAxisHeadersConfig to pull values
// out of editorConfig
export function setAxisHeaderContent(activePanel) {
  const axHeaders = activePanel.axisHeaders;
  return {
    xaxis: { content: axHeaders.xaxis },
    yaxisleft: { content: axHeaders.yaxisleft },
    yaxisright: { content: axHeaders.yaxisright },
    zaxis: { content: axHeaders.zaxis },
  };
}
// SET AXIS HEADER CONTENT

// SET AXIS HEADER ENABLEMENT
// Called from makeAxisHeadersConfig. Sets enablement flags
// according to chart type
export function setAxisHeaderEnablement(ahObj, activePanel) {
  const isDouble = activePanel.scales.double.isDouble;
  const chartType = activePanel.overallChartType;
  if (isDouble) {
    ahObj.xaxis.enabled = true;
    ahObj.yaxisleft.enabled = false;
    ahObj.yaxisright.enabled = false;
  } else if (
    chartType.includes('line') ||
    chartType.includes('column') ||
    chartType.includes('thermov')
  ) {
    ahObj.xaxis.enabled = true;
  } else if (chartType.includes('scatter')) {
    ahObj.xaxis.enabled = false;
    // FIXME: hard-wiring to r/h/s. Check side...
    ahObj.yaxisright.enabled = false;
    if (chartType.includes('sized')) {
      ahObj.zaxis.enabled = false;
    }
  }
}
// SET AXIS HEADER ENABLEMENT ends

// MAKE TEXT FIELD CONFIG
// Config object for paste-in text field
export function makeTextFieldConfig(dps) {
  return {
    timeFormats: Object.assign([], dps.metadata.timeformats),
    dayInMilliSeconds: dps.other.dayInMilliSeconds,
  };
}
// MAKE TEXT FIELD CONFIG ends

// UPDATE DEFAULT AXIS HEADERS IN ED-CONFIG
// Called from Editor.handleValuesFromChartTypeComponent
// (in which case flag doubleChange is false), or from
// ScaleCallbackUtils.handleValuesFromDoubleScaleComponent
// (flag true).
// Sets x, y and z-axis values to defaults (based on headers for doubles or scatters)
export function updateDefaultAxisHeadersInEdConfig(activePanel, doubleChange) {
  const isDouble = activePanel.scales.double.isDouble;
  const chartType = activePanel.overallChartType;
  const ahObj = activePanel.axisHeaders;
  const dataHeaders = activePanel.chartData.headers;
  if (doubleChange) {
    if (isDouble) {
      setContent(ahObj, 'yaxisleft', dataHeaders[1]);
      // Get split
      const splitAt = activePanel.scales.double.splitDataAtCol + 1;
      setContent(ahObj, 'yaxisright', dataHeaders[splitAt]);
    }
    // Dec'20: *don't* reset xaxis header on change to line/col/vthermo
    // } else if (
    //   chartType.includes('line') ||
    //   chartType.includes('column') ||
    //   chartType.includes('vthermo')
    // ) {
    // setContent(ahObj, 'xaxis', dataHeaders[1]);
    // setContent(ahObj, 'xaxis', '');
  } else if (chartType.includes('scatter')) {
    setContent(ahObj, 'xaxis', dataHeaders[1]);
    // FIXME: hard-wiring to r/h/s. Check side...
    setContent(ahObj, 'yaxisright', dataHeaders[2]);
    if (chartType.includes('sized')) {
      setContent(ahObj, 'zaxis', dataHeaders[3]);
    }
  }
}
// UPDATE DEFAULT AXIS HEADERS IN ED-CONFIG ends

// SET CONTENT
// Called from updateDefaultAxisHeadersInEdConfig
export function setContent(ahObj, node, source) {
  // Again: this was surely madness!
  // if (ahObj[node].length === 0) {
  ahObj[node] = source;
  // }
}
// SET CONTENT ends
