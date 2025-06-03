/*
  Functions shared by vertical and horizontal thermometer charts
*/

// GET POINT MAX / MIN
// Called from mapSpindleData to get max or min value at one datapoint
// I had a 'smart-arse' version of this, but it was tripping
// over empty values. Gone for cheap and cheerful...
export function getPointMaxMin(dObj, excludeA, excludeB, isMax) {
  // Exclude cat and blob headers...
  const keys = Object.keys(dObj).filter(
    obj => obj !== excludeA && obj !== excludeB,
  );
  // ...so we're only dealing with series headers
  // Map all values as an array,then filter out empties
  const pointVals = keys
    .map(key => dObj[key])
    .filter(point => {
      return point.trim() !== '';
    });
  let val = 0;
  // Extract max or min
  // Empty vals always return default zero
  // However: if there's only one point, leave min at default zero
  // (Works around issue when there are 2 series, one of which is chart-blobs)
  if (pointVals.length > 0) {
    if (isMax) {
      val = Math.max(...pointVals);
    } else if (pointVals.length > 1) {
      val = Math.min(...pointVals);
    }
  }
  return val;
}
// GET POINT MAX / MIN ends

// MAP SPINDLE DATA
// Called from updateThermos
export function mapSpindleData(config) {
  const sData = config.chartData;
  // Exclude 2 headers: categories and any blob series
  // And yes, this is a kludge: really I shouldn't be
  // triaging the data at this stage...
  const catHead = config.catHead;
  const blobHead = config.blobHeader;
  // const factor = config.factor;
  const mappedSpindleData = sData.map(ddd => {
    const spindVal = {
      category: ddd[config.catHead],
      max: getPointMaxMin(ddd, catHead, blobHead, true) / config.factor,
    };
    // If only one series, set min to zero (I suppose this can mean that
    // spindles get drawn 'upside-down', but does it matter?)
    if (config.seriesCount === 1) {
      spindVal.min = 0;
    } else {
      spindVal.min =
        getPointMaxMin(ddd, catHead, blobHead, false) / config.factor;
    }
    return spindVal;
  });
  return mappedSpindleData;
}
// MAP SPINDLE DATA ends
