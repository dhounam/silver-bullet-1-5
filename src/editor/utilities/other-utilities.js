// TRIM DECIMALS
// Called from various places to fix precision errors:
//    trim 0.300000000004 to 0.3
//    round 3.9999999999994 to 4, or 0.08999999999 to 0.09
// This is all 'make it up as we go along'
export function trimDecimals(val) {
  const valAsString = val.toString();
  const valAsArray = valAsString.split('.');
  // Zeroes are, I think, less straightforward
  if (valAsArray.length > 1) {
    const dStr = valAsArray[1];
    const zerosPos = dStr.indexOf('0000');
    const ninesPos = dStr.indexOf('9999');
    if (zerosPos >= 0) {
      // Zeros
      valAsArray[1] = dStr.substr(0, zerosPos);
      val = +valAsArray.join('.');
    } else if (ninesPos > 0) {
      // Nines, like 0.899999999 or 0.01999999
      val = +Number(valAsString).toFixed(ninesPos);
      // So lose leading zeroes:
      // const zeroMatch = dStr.match(/[1-9]\d*/);
      // const zeroBin = dStr.substr(0, zeroMatch.index);
      // dStr = zeroMatch[0];
      // ninesPos -= zeroMatch.index;
      // Get the digit preceding the nines, and increment by 1
      // So 19999 -> 2
      // const dStub = parseInt(dStr.substr(0, ninesPos), 10) + 1;
      // Stick the leading zeroes back on
      // valAsArray[1] = `${zeroBin}${dStub.toString()}`;
      // val = +valAsArray.join('.');
    } else if (ninesPos === 0) {
      // Nines, like 3.999999994, just round up
      val = Math.round(val);
    }
  }
  // Returns a number
  return val;
}
// TRIM DECIMALS ends

// SET CHART-WRAPPER SCALE CLASS
// Called from Editor.handleValuesFromSizeAndPreset, and
// from EdConfigUtils.initiateNewEdConfig
// Overrides default scaling of chart-wrapper for
// responsive DCs
export function setChartWrapperScaleClass(presetsConfig) {
  // Look for a chartScaleClass property on the node
  const upNode = presetsConfig.userPresets;
  const pNode = upNode[presetsConfig.presetName];
  const spNode = pNode[presetsConfig.subpresetName];
  const scaleClass = spNode.chartScaleClass;
  // Isolate the div that resizes
  const scWrapper = document.getElementsByClassName('silver-chartwrapper')[0];
  const classExists = typeof scaleClass !== 'undefined';
  // Failsafe:
  const divExists = typeof scWrapper !== 'undefined';
  // If we can find the div (doesn't exist at startup)
  if (divExists) {
    // remove any zooming class applied. The specific zooming class is defined in
    // preset_preferences.json, using the property 'chartScaleClass'
    scWrapper.classList.remove(
      ...Array.from(scWrapper.classList.values()).filter(className =>
        /chart-zoom-.*/.test(className),
      ),
    );
    // set specific scaling class or use the default scaling factor (x2.5)
    scWrapper.classList.add(classExists ? scaleClass : 'chart-zoom-250');
  }
}
// SET CHART-WRAPPER SCALE CLASS ends
