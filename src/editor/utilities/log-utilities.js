// Log scales

// GET CYCLE START OR END
// Called from setNewLogScale to get the start or end of
// a cycle containing the passed value
export function getCycleStartOrEnd(val, isStart) {
  let result = 1;
  if (val > 1) {
    // Count number of integer digits
    // val = parseInt(val, 10);
    // const len = val.toString().length;
    // for (let i = 0; i < len; i++) {
    //   result *= 10;
    // }
    while (val > 1) {
      val /= 10;
      result *= 10;
    }
    if (isStart) {
      result /= 10;
    }
  } else if (val < 1) {
    while (val < 1) {
      val *= 10;
      result /= 10;
    }
    if (!isStart) {
      result *= 10;
    }
  }
  return result;
}

export function forceMultiple(val, mult) {
  let result = val;
  if (val < 1) {
    // Get number of dps
    const dpCount = val.toString().split('.')[1].length;
    result = Number((val * mult).toFixed(dpCount));
  } else {
    result = val * mult;
  }
  return result;
}

export function appendLogTickVals(logVals) {
  let min = logVals.min;
  let max = logVals.max;

  // Now factor up to get round Math issues
  let factoredBy = 1;
  while (!Number.isInteger(min)) {
    min *= 10;
    max *= 10;
    factoredBy *= 10;
  }

  const incrCode = logVals.increment;
  // scale.min = min;
  // scale.max = max;
  // scale.incr = incrCode;
  // Increment is complicated. It's based on the idea:
  //    0: single log units
  //    1: half cycles
  //    2: complete cycles
  // And we assemble tickValues as we go...
  // Initial increment:
  let incrA = min;
  let incrB = min;

  let cycleEnd = min * 10;
  const tickVals = [min];
  if (incrCode === 1) {
    incrA *= 4;
    incrB *= 5;
  } else if (incrCode === 2) {
    incrB *= 9;
  }
  while (min < max) {
    if (incrCode === 1) {
      min += incrA;
      tickVals.push(min);
      min += incrB;
      tickVals.push(min);
    } else {
      min += incrB;
      tickVals.push(min);
    }
    if (min >= cycleEnd) {
      incrA *= 10;
      incrB *= 10;
      cycleEnd *= 10;
    }
  }
  // Factor back down:
  for (let iii = 0; iii < tickVals.length; iii++) {
    tickVals[iii] /= factoredBy;
  }
  logVals.tickValues = tickVals;
  logVals.tickDensity = tickVals.length;
}

export function setNewLogScale(actualMinMax) {
  // I need actual values
  const actualMin = actualMinMax.min;
  const actualMax = actualMinMax.max;
  const logMin = getCycleStartOrEnd(actualMin, true);
  const logMax = getCycleStartOrEnd(actualMax, false);
  // Increment is an index for the dropdown, which
  // can be 0, 1 or 2. Default is 2 (complete cycles).
  const incrCode = 2;
  // const maxDivByMin = logMax / logMin;
  // if (maxDivByMin > 1000000) {
  //   incrCode = 2;
  // } else if (maxDivByMin > 10000) {
  //   incrCode = 1;
  // }
  // Provisional mmi object
  const logVals = {
    actualMin,
    actualMax,
    factor: 1,
    log: true,
    min: logMin,
    max: logMax,
    increment: incrCode,
  };
  // Still needs tick values and density:
  appendLogTickVals(logVals);
  return logVals;
}
