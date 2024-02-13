// X-AXIS FILTERS

import FixYearInDate from '../chartside-utilities/fix-year'

// NOTE: maybe try to fix this if I ever decide that
// getAxisFilter is 'finished'...

// DEFAULT FILTER ITEM
// Returns default element in tick filter array
export function defaultFilterItem() {
  return {
    label: false,
    shift: false,
    // NOTE: might pass in a flag
    // that sets default tick length
    tick: 2,
    duplicate: 0,
  }
}

// GET DEFAULT FILTER ARRAY
// Called from getYearsAxisFilter
// Passed the length of the categories array, returns an array of falses
// that can be selectively overwritten
export function getDefaultFilterArray(len) {
  const filterArray = []
  // Have to do this the hard way, apparently...
  // label = draw a label
  // shift = move label left
  // tick = tick-length (0 = no tick)
  // duplicate = duplicate last tick to close final slot
  while (filterArray.length < len) {
    filterArray.push(defaultFilterItem())
  }
  return filterArray
}
// GET DEFAULT FILTER ARRAY ends

// ADD YEAR ADJUSTMENT
// Called from getYearsAxisFilter and getAxisFilter. Adds year
// adjustment (for pre-1000 years) to each element in categories array
// NOTE: actually, once I've split off years, this will only be called from
// getYearsAxisFilter
export function addYearAdjustment(catArray, yearsAdjustedBy) {
  for (let iii = 0; iii < catArray.length; iii++) {
    const thisCat = catArray[iii]
    catArray[iii] = parseInt(thisCat, 10) + yearsAdjustedBy
  }
}
// ADD YEAR ADJUSTMENT ends

// FORCE FIRST AND LAST YEARS
// Called from fillAlternateYears and fillModYears
// Forces labels and ticks on 1st and last items in years axis
// NOTE: hard-wired tick lengths
export function forceFirstAndLastYears(fArray, tickLengths) {
  const len = fArray.length
  fArray[0].label = true
  if (fArray[0].tick === 0) {
    fArray[0].tick = tickLengths.default
  }
  fArray[len - 1].label = true
  if (fArray[len - 1].tick === 0) {
    fArray[len - 1].tick = tickLengths.default
  }
}
// FORCE FIRST AND LAST YEARS ends

// FILL ALL YEARS
// Called from getYearsAxisFilter to force labels and ticks on all years
// NOTE: hard-wired tick lengths
export function fillAllYears(fArray, isPrimary, tickLengths) {
  if (isPrimary) {
    for (let iii = 0; iii < fArray.length; iii++) {
      const thisYear = fArray[iii]
      thisYear.label = true
      thisYear.tick = tickLengths.long
    }
  }
}
// FILL ALL YEARS ends

// FILL ALTERNATE YEARS
// Called from getYearsAxisFilter to force labels and ticks every 2 years
// NOTE: hard-wired tick lengths
export function fillAlternateYears(fArray, isPrimary, tickLengths) {
  const len = fArray.length
  for (let iii = 0; iii < len; iii++) {
    const thisYear = fArray[iii]
    if (iii % 2 === 0) {
      thisYear.label = true
      thisYear.tick = tickLengths.long
    } else {
      thisYear.tick = tickLengths.default
    }
  }
  // Do I even need to test on isPrimary? Surely this should
  // only be called on primary axis, anyway. Year+ series don't have
  // a 2ry axis...
  if (isPrimary) {
    forceFirstAndLastYears(fArray, tickLengths)
  }
}
// FILL ALTERNATE YEARS ends

// GET MINOR MOD
export function getMinorMod(mainMod) {
  let minorMod = 1
  if (mainMod === 10) {
    minorMod = 5
  } else if (mainMod === 50) {
    minorMod = 10
  } else if (mainMod === 100) {
    minorMod = 25
  }
  return minorMod
}
// GET MINOR MOD ends

// FORCE DATE TO YEAR
// If date to check for year-mod isn't a pure year, returns yyyy
export function forceDateToYear(val) {
  let yDate = val
  if (isNaN(yDate)) {
    yDate = new Date(Date.parse(yDate)).getFullYear()
  }
  return yDate
}
// FORCE DATE TO YEAR

// FILL MOD YEARS
// Called from getYearsAxisFilter to force labels and ticks every 5/10... years
export function fillModYears(
  fArray,
  catArray,
  mainMod,
  isPrimary,
  tickLengths
) {
  if (!isPrimary) {
    return
  }
  // NOTE: as an expedient, a lookup for minor ticks to display
  const minorMod = getMinorMod(mainMod)
  for (let iii = 0; iii < fArray.length; iii++) {
    // Actual value
    const thisCat = forceDateToYear(catArray[iii])
    // Element in the filter array
    const thisYear = fArray[iii]
    // This works like fillAlternateYears, above
    if (thisCat % mainMod === 0) {
      thisYear.label = true
      thisYear.tick = tickLengths.long
    } else if (thisCat % minorMod === 0) {
      thisYear.tick = tickLengths.default
    } else {
      thisYear.tick = 0
    }
  }
  // if (isPrimary) {
  // No: I think we have to force first and last for both 1ry and 2ry axes
  // NOTE: really? Surely no 2ry axis on years+
  forceFirstAndLastYears(fArray, tickLengths)
  // }
}
// FILL MOD YEARS ends

// GET YEARS AXIS FILTER
// Called for yearly x-axis
export function getYearsAxisFilter(config, timeFormats, isPrimary) {
  // Clone the category array
  // (Prevents refs back, which increment low numbers for yearsAdjustedBy
  // e.g. '5' can become '8005'!!)
  const catArray = JSON.parse(JSON.stringify(config.categories))
  const len = catArray.length
  // Set up default filter of falses
  const filterArray = getDefaultFilterArray(len)
  // Now selective overwriting, according to timeFormat
  const displayInterval = timeFormats.displayInterval
  // Check for year-intervals (1/2/5/10...)
  const yMod = getYearMod(displayInterval)
  // tickLengths: default and long
  const tickLengths = getTickLengths(config)
  // Now fill in the array selectively.
  // 'years2' is the special case
  if (yMod === 1) {
    fillAllYears(filterArray, isPrimary, tickLengths)
  } else if (yMod === 2) {
    fillAlternateYears(filterArray, isPrimary, tickLengths)
  } else {
    fillModYears(filterArray, catArray, yMod, isPrimary, tickLengths)
  }
  // NOTE: kludging some loose ends. I'm playing fast and loose here,
  // updating by ref:
  timeFormats.yearCount = len
  return filterArray
}
// GET YEARS AXIS FILTER ends

// GET CAT ARRAY FOR NON YEARS AXIS FILTER
// Called from getNonYearsAxisFilter to clone and 1000-adjust array of cats
export function getCatArrayForNonYearsAxisFilter(config) {
  // Cloning the category array prevents refs back, which increment low numbers for yearsAdjustedBy
  // e.g. '5' can become '8005'!!
  const catArray = Object.assign([], config.categories)
  // Allow for 1000-adjustment, so that years/numbers can undergo
  // a successful Date.parse below...
  const yearsAdjustedBy = config.yearsAdjustedBy
  if (yearsAdjustedBy > 0) {
    addYearAdjustment(catArray, yearsAdjustedBy)
  }
  return catArray
}
// GET CAT ARRAY FOR NON YEARS AXIS FILTER ends

// GET NO FILTER ARRAY
// Once called from getNonYearsAxisFilter to create a filter
// array where no filtering is required. No longer called.
export function getNoFilterArray(timeFormats, catLen) {
  // NOTE: double-kludge: update passed timeFormats object
  // by ref, with number of year labels!
  if (timeFormats.displayInterval.includes('years')) {
    timeFormats.yearCount = catLen
  }
  // NOTE: that I'm hard-coding tick lengths for now
  const anObj = { duplicate: false, label: true, shift: false, tick: 3 }
  const noFilterArray = Array(catLen).fill(anObj)
  return noFilterArray
}
// GET NO FILTER ARRAY

export function setDateByInterval(date, interval) {
  let result = ''
  if (interval === 'months' || interval === 'quarters') {
    result = date.getMonth()
  } else if (interval === 'days' || interval === 'weeks') {
    result = date.getDate()
  }
  // Hours/minutes to come
  return result
}

// GET DATE PROPS
// Called from getNonYearsAxisFilter to determine whether
// current point is a boundary. Params are:
//    two dates to compare
//    raw data interval
//    display interval on axis
//    flags for first and last dates
//    ...
//    tickLengths added Nov'21
export function getDateProps(
  dateA,
  dateB,
  displayInterval,
  firstDate,
  lastDate,
  showLabel,
  checkTimeChange,
  forceTick,
  tickInterval,
  tickLengths
) {
  // Extract tick lengths
  const longLength = tickLengths.long
  const defaultLength = tickLengths.default
  // Defined in prefs but never, AFAIK, used...
  // const shortLength = tickLengths.short;
  // Years
  const yearA = dateA.getFullYear()
  const yearB = dateB.getFullYear()
  // Months
  const monthA = dateA.getMonth()
  const monthB = dateB.getMonth()
  // Days
  const dayA = dateA.getDate()
  const dayB = dateB.getDate()
  // Hours
  const hourA = dateA.getHours()
  const hourB = dateB.getHours()
  // Hours
  const minuteA = dateA.getMinutes()
  const minuteB = dateB.getMinutes()
  // NOTE: that I'm assuming, for now, that I want
  // to plot months->years
  // Also NOTE: that I've hard-coded ticklengths; but
  // these should eventually be displayInterval-related and
  // set in DPs...
  // There's a threshold below which smallest ticks aren't shown
  // This is being set on every iteration. Can I move it upstairs?
  // NOTE: this is all very messy and needs re-examination
  // Default object to return:
  const result = {
    tickLen: 0,
    label: false,
    duplicate: 0,
    isBoundary: false,
  }
  if (yearB > yearA) {
    // Year incremented
    // NOTE: do I need to check displayInterval,
    // or are years exempt?
    if (showLabel && checkTimeChange) {
      // Don't do this for
      if (!firstDate) {
        result.label = true
      }
    }
    // }
    if (displayInterval.includes('year')) {
      result.tickLen = longLength // was 3
    } else {
      // I'm not wild about this; prev'y was 5, but
      // I've no recollection of where I got that from...
      result.tickLen = longLength; // + defaultLength
    }
    result.isBoundary = true
  } else if (monthB > monthA) {
    // Month incremented
    if (displayInterval === 'months' || displayInterval === 'days') {
      result.tickLen = longLength // was 3
      if (showLabel && !firstDate) {
        result.label = true
        result.isBoundary = true
      }
    } else if (firstDate || forceTick) {
      if (displayInterval.includes('year')) {
        result.tickLen = defaultLength // was 2
      } else {
        result.tickLen = longLength // was 3
      }
    }
  } else if (dayB > dayA) {
    // Day incremented
    if (
      displayInterval === 'days' ||
      displayInterval === 'hours' ||
      displayInterval === 'minutes'
    ) {
      result.tickLen = defaultLength // was 2
      if (showLabel && !firstDate) {
        result.label = true
        result.isBoundary = true
      }
    } else if (firstDate || forceTick) {
      result.tickLen = defaultLength // was 2
    }
    if (displayInterval === 'hours' || displayInterval === 'minutes') {
      result.tickLen = longLength // was 3
    }
    // The logic has gone a bit screwy. This is
    // to cover unlabelled-days
    if (tickInterval === 'days') {
      result.tickLen = defaultLength // was 2
    }
  } else if (hourB > hourA) {
    // Hour incremented
    if (displayInterval === 'hours' || displayInterval === 'minutes') {
      result.tickLen = defaultLength // was 2
      if (showLabel && !firstDate) {
        result.label = true
        result.isBoundary = true
      }
    } else if (firstDate || forceTick) {
      result.tickLen = defaultLength // was 2
    }
  } else if (minuteB !== minuteA) {
    // Minute incremented
    if (displayInterval === 'minutes' || displayInterval === 'hours') {
      result.tickLen = defaultLength // was 2
      if (showLabel && !firstDate) {
        result.label = true
        result.isBoundary = true
      }
    } else if (firstDate || forceTick) {
      result.tickLen = defaultLength // was 2
    }
  }
  // Last date always labelled
  if (lastDate && showLabel) {
    result.label = true
  }
  // Label
  return result
}
// GET DATE PROPS ends

// GET VIRTUAL DATES
// Called from newGetNonYearAxisFilter to calculate
// 1 date preceding and 2 succeeding...
export function getVirtualDates(catArray) {
  // First date
  const firstDate = new Date(Date.parse(catArray[0]))
  // And I want an increment, so...
  const secondDate = new Date(Date.parse(catArray[1]))
  // NOTE: don't like next. Apart from anything else, I should've
  // got the increment while I was parsing the payload...
  const increment = secondDate - firstDate
  // I need last date (in ms, so I can add increment)
  // (firstDate is OK as date obj becos I can subtract an increment --
  // it's only *adding* an increment in ms to a date obj that goes askew)
  const lastDate = Date.parse(catArray[catArray.length - 1])
  // Do I need next?
  const endDate = new Date(lastDate)
  // Now get 'virtual' dates preceding and following series:
  const precedingDate = new Date(firstDate - increment)
  const succeedingDate = new Date(lastDate + increment)
  const afterSucceedingDate = new Date(lastDate + increment * 2)
  return {
    precedingDate,
    endDate,
    succeedingDate,
    afterSucceedingDate,
  }
}
// GET VIRTUAL DATES ends

// GET INTERVALS LIST
// Called from getNonYearsAxisFilter to assemble a broad list
// of 'tickable' intervals in descending order
export function getIntervalsList(int) {
  let broadInts = 'years'
  if (int.includes('quarter') || int.includes('month')) {
    broadInts = `broadInts,${'months'}`
  } else if (int.includes('week') || int.includes('day')) {
    broadInts = `broadInts,${'days'}`
  }
  // Hours, etc, to come
  return broadInts
}
// GET INTERVALS LIST ends

// GET YEAR MOD
// Called from getYearsAxisFilter and getNonYearsAxisFilter
// Returns the incremental value of, say, 'years2'
export function getYearMod(interval) {
  let yMod = 1
  // Non-years stick with default
  if (interval.includes('years')) {
    // If we're years + n (e.g. 'years2')
    if (interval.replace('years', '').length > 0) {
      yMod = parseInt(interval.replace('years', ''), 10)
    }
  }
  return yMod
}
// GET YEAR MOD ends

// GET NON-YEARS AXIS FILTER
export function getNonYearsAxisFilter(config, granularity, isPrimary) {
  // Default timeFormats are 2ry axis
  let granularityTimeFormats = granularity.secondary
  if (isPrimary) {
    granularityTimeFormats = granularity.primary
  }
  // Axis labels? (actually always true for 2ry)
  const showLabel = granularityTimeFormats.showLabel
  // From the original config.timeFormats
  const originalInterval = config.timeFormats.interval
  // Time interval of the actual raw data
  const displayInterval = granularityTimeFormats.displayInterval
  // Ticks display interval:
  const tickInterval = granularity.ticks.displayInterval
  // Which is, broadly:
  // NOTE: comm'd out, but this may be useful
  // const displayIntervalsList = getIntervalsList(displayInterval);
  // I want year mod
  const yearMod = getYearMod(displayInterval)
  // Cloned array of categories with any 1000-year adjustment
  // NOTE: do I need to convert date strings to date objects now?
  // For the time being, left as strings
  const catArray = getCatArrayForNonYearsAxisFilter(config)
  const catLen = catArray.length
  // 'Virtual' dates preceding first and following last
  const virtualDates = getVirtualDates(catArray)
  const { precedingDate, endDate, succeedingDate } = virtualDates
  // Added Nov'21: we need tick lengths
  // (Prev'y hard-coded in getDateProps. Ouch!)
  const tickLengths = getTickLengths(config)
  // Set up a counter to track the number of datapoints within whatever
  // time-interval I'm *plotting* (e.g., to count the number of days in a month)
  // I use this to count back at the end of the time-interval, to find the
  // halfway position where I'll actually set the flag to draw a label
  let clusterCounter = 0
  let crossedBoundary = false
  let pointLabelled = false
  // Array to return:
  const filterArray = []
  let filterIndex = 0
  // Loop through categories
  for (let catNo = 0; catNo < catLen; catNo++) {
    // I need to set up prev and next items
    const filterItem = defaultFilterItem()
    const thisDate = new Date(catArray[catNo])
    const lastPoint = catNo === catLen - 1
    // I want to compare this item with previous
    let dateA
    let dateB
    let firstDate = false
    let lastDate = false
    if (catNo === 0) {
      dateA = precedingDate
      dateB = thisDate
      firstDate = true
    } else if (lastPoint) {
      dateA = new Date(catArray[catNo - 1])
      dateB = thisDate
      lastDate = true
    } else {
      dateA = new Date(catArray[catNo - 1])
      dateB = thisDate
    }
    // Flag to prevent year being drawn for first
    // slot with sub-yearly data
    // And similarly for other intervals
    let checkTimeChange = true
    if (catNo === 0) {
      if (
        displayInterval.includes('year') &&
        !originalInterval.includes('year')
      ) {
        checkTimeChange = false
      }
    }
    // So I want to check sequentially at year, month and day levels
    // I'm oversimplifying now, assuming data are days->months
    const boundaryObj = getDateProps(
      dateA,
      dateB,
      displayInterval,
      firstDate,
      lastDate,
      showLabel,
      checkTimeChange,
      false,
      tickInterval,
      tickLengths
    )
    filterItem.tick = boundaryObj.tickLen
    filterItem.duplicate = boundaryObj.duplicate
    filterItem.isBoundary = boundaryObj.isBoundary
    crossedBoundary = boundaryObj.isBoundary
    if (boundaryObj.label) {
      // If this is last point and it isn't the first
      // in a new 'cluster' decrement cluster counter
      if (lastPoint && !crossedBoundary) {
        clusterCounter--
      }
      const stepBack = clusterCounter / 2
      filterIndex = catNo - Math.ceil(stepBack)
      const shift = stepBack === Math.ceil(stepBack)
      // Find slot, either an existing 'back' element
      // in the array, or use current
      let labelPoint = filterArray[filterIndex]
      if (typeof labelPoint === 'undefined') {
        labelPoint = filterItem
      }
      labelPoint.label = true
      labelPoint.shift = shift
      // Reset counter to 1, to allow for the fact
      // that we're at start of next 'cluster'
      if (!lastPoint) {
        clusterCounter = 1
      }
      pointLabelled = true
    } else {
      // Right place to increment?
      clusterCounter++
      pointLabelled = false
    }
    filterArray.push(filterItem)
  }
  // Emerging from the points loop, I have to deal with:
  //  -- length of the additional 'duplicate' tick
  //  -- a possible final label
  // NOTE: incomprehensible props. Objectify! (inside loop, too)
  const dupBoundaryObj = getDateProps(
    endDate,
    succeedingDate,
    displayInterval,
    // firstDate
    false,
    // lastDate
    true,
    showLabel,
    // checkTimeChange
    true,
    // Force duplicate tick
    true,
    tickInterval,
    tickLengths
  )
  // Isolate last element in array and set duplicate value
  const lastEl = filterArray[catLen - 1]
  lastEl.duplicate = dupBoundaryObj.tickLen
  // If the last point was the first in a 'cluster', the loop
  // 'used' this last point to set the label on the previous
  // 'cluster'. So I have to set the label for *this* point
  // Kill off non-mod years and adjust ticklengths
  fixYearMods(filterArray, catArray, yearMod, tickLengths)
  if (crossedBoundary && pointLabelled) {
    lastEl.label = true
    lastEl.shift = false
  } else {
    // We have to go back in the cluster for final label:
    const stepBack = clusterCounter / 2
    filterIndex = catLen - 1 - Math.ceil(stepBack)
    const shift = stepBack === Math.ceil(stepBack)
    const backEl = filterArray[filterIndex]
    backEl.label = dupBoundaryObj.label
    backEl.shift = shift
  }
  // Number of years for yyyy/yy formatting on axis
  if (displayInterval.includes('years')) {
    granularityTimeFormats.yearCount = getYearCount(catArray)
  }
  return filterArray
}
// GET NON-YEARS AXIS FILTER ends

// CHECK ALTERNATE YEAR MOD
export function checkAlternateYearMod(catArray, yearMod) {
  let altMod = false
  if (yearMod === 2) {
    const firstYear = FixYearInDate(catArray[0]).getFullYear()
    if (firstYear % 2 !== 0) {
      altMod = true
    }
  }
  return altMod
}
// CHECK ALTERNATE YEAR MOD ends

// FIX YEAR MODS
// Called from getNonYearsAxisFilter. Goes through the
// filter array and, if we 'mod' the years, kills off
// the unwanted labels
export function fixYearMods(filterArray, catArray, yearMod, tickLengths) {
  // Extract tick lengths
  const longLength = tickLengths.long
  if (yearMod > 1) {
    const aLen = filterArray.length - 1
    // Alternate years may be odd or even, depending
    // upon initial year. altMod is true for even
    // years, false for odd

    const oddMod = checkAlternateYearMod(catArray, yearMod)
    // Set the mod val to check for slot-opening point
    let modCheckA = 0
    // ...and for closing point
    let modCheckB = 1
    if (oddMod) {
      modCheckA = 1
      modCheckB = 0
    }
    // Flag to preserve first label, mod or not
    let killYears = false
    for (let pNo = 1; pNo < aLen; pNo++) {
      // const thisDate = new Date(catArray[pNo]).getFullYear();
      const thisDate = FixYearInDate(catArray[pNo]).getFullYear()
      const thisPoint = filterArray[pNo]
      if (killYears) {
        if (thisDate % yearMod !== modCheckA) {
          // Kill non-mod labels
          thisPoint.label = false
          if (thisDate % yearMod === modCheckB) {
            // But if it's the year-end AFTER the mod,
            // set the tick long
            if (thisPoint.tick > 0) {
              thisPoint.tick = longLength // was 3
            }
          }
        } else if (thisPoint.tick > 0) {
          // Mod tick:
          thisPoint.tick = longLength // was 3
        }
      } else if (!killYears && filterArray[pNo].label) {
        // Hit first label
        // If it's a mod, reset ticklength
        if (oddMod) {
          // Alternate years, odd
          if (thisDate % yearMod > 0) {
            filterArray[0].tick = longLength // was 3
          }
        } else if (thisDate % yearMod === 0) {
          // Alternate years, even
          filterArray[0].tick = longLength // was 3
        }
        // Preserve it and reset flag
        killYears = true
      }
    }
  }
}
// FIX YEAR MODS ends

// GET YEAR COUNT
// Called from getNonYearsAxisFilter
// Get year count by subtracting first from last
export function getYearCount(catArray) {
  const firstYear = FixYearInDate(catArray[0]).getFullYear()
  const lastCat = catArray[catArray.length - 1]
  const lastYear = FixYearInDate(lastCat).getFullYear()
  const yearCount = lastYear - firstYear + 1
  return yearCount
}
// GET YEAR COUNT ends

// GET ANY AXIS FILTER
// Called from xaxis-ordinal-config to create axis config obj with
// 1ry and 2ry axis filters on yearly and non-yearly time-based x-axis
// Args are the axis config object, which will be updated by ref; the general
// chart config object; and the granularity object
export function getAnyAxisFilter(xAxisConfig, chartConfig, granularity) {
  // Do nothing if not time-based series
  if (xAxisConfig.categoryType === 'time') {
    const rawInterval = chartConfig.timeFormats.interval
    // Years: 1ry and 2ry
    if (rawInterval.includes('years')) {
      xAxisConfig.primaryAxisFilter = getYearsAxisFilter(
        chartConfig,
        granularity.primary,
        true
      )
      xAxisConfig.secondaryAxisFilter = getYearsAxisFilter(
        chartConfig,
        granularity.primary,
        false
      )
    } else {
      xAxisConfig.primaryAxisFilter = getNonYearsAxisFilter(
        chartConfig,
        granularity,
        true
      )
      if (typeof granularity.secondary !== 'undefined') {
        xAxisConfig.secondaryAxisFilter = getNonYearsAxisFilter(
          chartConfig,
          granularity,
          false
        )
      }
    }
  }
}

// GET TICK LENGTHS
// Variously called to extract tick lengths
export function getTickLengths(config) {
  const lengths = config.xAxis.ticks.default.lengths
  return {
    long: lengths.long.end,
    default: lengths.default.end,
    short: lengths.short.end,
  }
}
// GET TICK LENGTHS ends
