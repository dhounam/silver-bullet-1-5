// GRANULARITY PREFERENCES
// Basically, this is a lookup kludge. The function is called by
// getGranularity and returns a set of interval-specific properties
// (I'd put this in Default Preferences... if it didn't then have to
// be passed all the way down the chain...)
export function granularityPreferences() {
  return {
    minutes: {
      NOTE: '***MINUTES***',
      testVal: 'MM',
      next: {
        interval: 'unlabelledMinutes',
        factor: 1,
      },
      ticks: {
        displayInterval: 'minutes',
        increment: 1,
      },
      primary: {
        displayInterval: 'minutes',
        increment: 1,
        format: '%H:%M',
        firstLetterOnly: false,
        showLabel: true,
      },
      secondary: {
        displayInterval: 'days',
        increment: 1,
        format: '%b %d',
        filter: true,
        showLabel: true,
      },
      // NOTE: old 'ticksOn' flag wasn't working. Now I'm
      // setting tick-levels for comparison in caller...
      ticksOn: false,
      tickLevel: 'minutes',
    },
    unlabelledMinutes: {
      NOTE: '***UNLABELLED MINUTES***',
      testVal: '.',
      next: {
        interval: 'hours',
        factor: 60,
      },
      ticks: {
        displayInterval: 'minutes',
        increment: 1,
      },
      primary: {
        displayInterval: 'minutes',
        increment: 1,
        format: '%H:%M',
        firstLetterOnly: false,
        showLabel: false,
      },
      secondary: {
        displayInterval: 'days',
        increment: 1,
        format: '%b %d',
        filter: true,
        showLabel: true,
      },
      // NOTE: old 'ticksOn' flag wasn't working. Now I'm
      // setting tick-levels for comparison in caller...
      ticksOn: false,
      tickLevel: 'minutes',
    },
    hours: {
      NOTE: '***HOURS***',
      testVal: 'HH',
      next: {
        interval: 'unlabelledHours',
        factor: 1,
      },
      ticks: {
        displayInterval: 'hours',
        increment: 1,
      },
      primary: {
        displayInterval: 'hours',
        increment: 1,
        format: '%H:%M',
        firstLetterOnly: false,
        showLabel: true,
      },
      secondary: {
        displayInterval: 'days',
        increment: 1,
        format: '%b %d',
        filter: true,
        showLabel: true,
      },
      // NOTE: old 'ticksOn' flag wasn't working. Now I'm
      // setting tick-levels for comparison in caller...
      ticksOn: false,
      tickLevel: 'hours',
    },
    unlabelledHours: {
      NOTE: '***UNLABELLED HOURS***',
      testVal: '.',
      next: {
        interval: 'days',
        factor: 24,
      },
      ticks: {
        displayInterval: 'hours',
        increment: 1,
      },
      primary: {
        displayInterval: 'hours',
        increment: 1,
        format: '%H %M',
        firstLetterOnly: false,
        showLabel: false,
      },
      secondary: {
        displayInterval: 'days',
        increment: 1,
        format: '%b %d',
        filter: true,
        showLabel: true,
      },
      // NOTE: old 'ticksOn' flag wasn't working. Now I'm
      // setting tick-levels for comparison in caller...
      ticksOn: false,
      tickLevel: 'hours',
    },
    days: {
      NOTE: '***DAYS***',
      testVal: 'DD',
      next: {
        interval: 'unlabelledDays',
        factor: 1,
      },
      ticks: {
        displayInterval: 'days',
        increment: 1,
      },
      primary: {
        displayInterval: 'days',
        increment: 1,
        format: '%d',
        firstLetterOnly: false,
        showLabel: true,
      },
      secondary: {
        displayInterval: 'months',
        increment: 1,
        format: '%b',
        // note: longFormat may be redundant
        // longFormat: '%B %Y',
        filter: true,
        showLabel: true,
      },
      // NOTE: old 'ticksOn' flag wasn't working. Now I'm
      // setting tick-levels for comparison in caller...
      ticksOn: false,
      tickLevel: 'days',
    },
    unlabelledDays: {
      NOTE: '***UNLABELLED DAYS***',
      testVal: '.',
      next: {
        interval: 'months',
        factor: 31,
      },
      ticks: {
        displayInterval: 'days',
        increment: 1,
      },
      primary: {
        displayInterval: 'months',
        increment: 1,
        format: '%b',
        firstLetterOnly: false,
        showLabel: true,
      },
      secondary: {
        displayInterval: 'years',
        increment: 1,
        format: '%Y',
        // longFormat: '%B %Y',
        filter: true,
        showLabel: true,
      },
      // NOTE: old 'ticksOn' flag wasn't working. Now I'm
      // setting tick-levels for comparison in caller...
      ticksOn: false,
      tickLevel: 'days',
    },
    weeks: {
      NOTE: '***WEEKS***',
      testVal: 'DD',
      next: {
        interval: 'months',
        factor: 4,
      },
      ticks: {
        displayInterval: 'days',
        increment: 7,
      },
      primary: {
        displayInterval: 'months',
        increment: 1,
        format: '%b',
        firstLetterOnly: false,
        showLabel: true,
      },
      secondary: {
        displayInterval: 'years',
        increment: 1,
        format: '%Y',
        filter: true,
        showLabel: true,
      },
      ticksOn: false,
      tickLevel: 'weeks',
    },
    months: {
      NOTE: '***MONTHS***',
      testVal: 'MMM',
      next: {
        interval: 'shortMonths',
        factor: 1,
      },
      ticks: {
        displayInterval: 'months',
        increment: 1,
      },
      primary: {
        displayInterval: 'months',
        increment: 1,
        format: '%b',
        firstLetterOnly: false,
        showLabel: true,
      },
      secondary: {
        displayInterval: 'years',
        increment: 1,
        format: '%Y',
        filter: true,
        showLabel: true,
        yyyyOn: 100,
        yyyyThreshold: 2,
      },
      ticksOn: false,
      tickLevel: 'months',
    },
    shortMonths: {
      NOTE: '***SHORT MONTHS***',
      testVal: 'I',
      next: {
        interval: 'unlabelledMonths',
        factor: 1,
      },
      ticks: {
        displayInterval: 'months',
        increment: 1,
      },
      primary: {
        displayInterval: 'months',
        increment: 1,
        format: '%b',
        firstLetterOnly: true,
        showLabel: true,
      },
      secondary: {
        displayInterval: 'years',
        increment: 1,
        format: '%Y',
        filter: true,
        showLabel: true,
        yyyyOn: 100,
        yyyyThreshold: 2,
      },
      ticksOn: false,
      tickLevel: 'months',
    },
    unlabelledMonths: {
      NOTE: '***UNLABELLED MONTHS***',
      testVal: '.',
      next: {
        interval: 'years',
        factor: 12,
      },
      ticks: {
        displayInterval: 'months',
        increment: 1,
      },
      primary: {
        displayInterval: 'months',
        increment: 1,
        format: '%b',
        firstLetterOnly: false,
        showLabel: false,
      },
      secondary: {
        displayInterval: 'years',
        increment: 1,
        format: '%Y',
        filter: true,
        showLabel: true,
        yyyyOn: 100,
        yyyyThreshold: 2,
      },
      ticksOn: false,
      tickLevel: 'months',
    },
    quarters: {
      NOTE: '***QUARTERS***',
      testVal: 'QQ',
      next: {
        interval: 'years',
        factor: 4,
      },
      ticks: {
        displayInterval: 'months',
        increment: 3,
      },
      primary: {
        displayInterval: 'months',
        increment: 3,
        format: '%b',
        firstLetterOnly: false,
        showLabel: true,
      },
      secondary: {
        displayInterval: 'years',
        increment: 1,
        format: '%Y',
        filter: true,
        showLabel: true,
        yyyyOn: 100,
        yyyyThreshold: 2,
      },
      ticksOn: false,
      tickLevel: 'quarters',
    },
    years: {
      NOTE: '***YEARS***',
      testVal: 'YY',
      next: {
        interval: 'years2',
        factor: 2,
      },
      ticks: {
        displayInterval: 'years',
        increment: 1,
      },
      primary: {
        displayInterval: 'years',
        increment: 1,
        format: '%Y',
        firstLetterOnly: false,
        yyyyOn: 100,
        yyyyThreshold: 2,
        showLabel: true,
      },
      ticksOn: true,
      tickLevel: 'years',
    },
    years2: {
      NOTE: '***YEARS-2***',
      testVal: 'YY',
      next: {
        interval: 'years5',
        factor: 2.5,
      },
      ticks: {
        displayInterval: 'years2',
        increment: 2,
      },
      primary: {
        displayInterval: 'years2',
        increment: 2,
        format: '%Y',
        firstLetterOnly: false,
        yyyyOn: 100,
        yyyyThreshold: 2,
        showLabel: true,
      },
      ticksOn: true,
      tickLevel: 'years',
    },
    years5: {
      NOTE: '***YEARS-5***',
      testVal: 'YY',
      next: {
        interval: 'years10',
        factor: 2,
      },
      ticks: {
        displayInterval: 'years5',
        increment: 5,
      },
      primary: {
        displayInterval: 'years5',
        increment: 5,
        format: '%Y',
        firstLetterOnly: false,
        yyyyOn: 100,
        yyyyThreshold: 2,
        showLabel: true,
      },
      ticksOn: true,
      tickLevel: 'years',
    },
    years10: {
      NOTE: '***YEARS-10***',
      testVal: 'YY',
      next: {
        interval: 'years50',
        factor: 5,
      },
      ticks: {
        displayInterval: 'years10',
        increment: 10,
      },
      primary: {
        displayInterval: 'years10',
        increment: 10,
        format: '%Y',
        firstLetterOnly: false,
        yyyyOn: 100,
        yyyyThreshold: 2,
        showLabel: true,
      },
      ticksOn: true,
      tickLevel: 'years',
    },
    years50: {
      NOTE: '***YEARS-50***',
      testVal: 'YYYY',
      next: {
        interval: 'years100',
        factor: 2,
      },
      ticks: {
        displayInterval: 'years50',
        increment: 50,
      },
      primary: {
        displayInterval: 'years50',
        increment: 50,
        format: '%Y',
        firstLetterOnly: false,
        yyyyOn: 100,
        yyyyThreshold: 2,
        showLabel: true,
      },
      ticksOn: true,
      tickLevel: 'years',
    },
    years100: {
      NOTE: '***YEARS-100***',
      testVal: 'YYYY',
      next: {
        interval: 'years100',
        factor: 1,
      },
      ticks: {
        displayInterval: 'years100',
        increment: 100,
      },
      primary: {
        displayInterval: 'years100',
        increment: 100,
        format: '%Y',
        firstLetterOnly: false,
        yyyyOn: 100,
        yyyyThreshold: 2,
        showLabel: true,
      },
      ticksOn: true,
      tickLevel: 'years',
    },
  }
}
// GRANULARITY PREFERENCES ends

// GET TICKS ON
export function getTicksOn(tickLevel, rawTickLevel, isThermo) {
  // By default, ticks are 'on' if time-interval 'level' hasn't changed...
  let tOn = tickLevel === rawTickLevel
  // ...but there are overrides.
  if (isThermo) {
    // Thermometers force ticks on:
    tOn = true
  } else if ('monthsquarters'.includes(tickLevel.toLowerCase())) {
    // Non-thermo, mths and qs force ticks off
    tOn = false
  }
  return tOn
}
// GET TICKS ON ends

// GET DATA POINT WIDTH
// Returns width of one 'slot' along the axis
export function getDataPointWidth(width, config) {
  // Number of raw data points
  const pointCount = config.pointCount
  // Width of one data-point
  return width / pointCount
}
// GET DATA POINT WIDTH ends

// SWITCH TO LONG FORMAT
// Determines the 2ry axis long date format
// to use, based upon default format
export function switchToLongFormat(format) {
  let longFormat = format
  if (format === '%b') {
    // 'Mmm' to 'Mmmm yyyy'
    longFormat = '%B %Y'
  }
  return longFormat
}
// SWITCH TO LONG FORMAT ends

// SECONDARY AXIS NEEDS LONG FORMAT
// Determines whether the 2ry axis needs
// to display, say, 'January 2020' instead of merely 'Jan'
export function secondaryAxisNeedsLongFormat(config) {
  let result = false
  const cData = config.chartData
  const firstD = cData[0]
  const lastD = cData[cData.length - 1]
  // Access by key
  const dKey = Object.keys(firstD)[0]
  const dateA = firstD[dKey]
  const dateZ = lastD[dKey]
  const rawInterval = config.timeFormats.interval
  // Inferentially, for now at least
  // Days: check same month and year
  if (rawInterval === 'days') {
    const monthA = new Date(dateA).getMonth()
    const monthZ = new Date(dateZ).getMonth()
    const yearA = new Date(dateA).getFullYear()
    const yearZ = new Date(dateZ).getFullYear()
    if (monthZ === monthA && yearZ === yearA) {
      result = true
    }
  }
  return result
}
// SECONDARY AXIS NEEDS LONG FORMAT ends

// MAKE GRANULARITY OBJECT FOR STRING AXIS
// Called from getGranularity. For string axis, creates
// a simple granularity object
export function makeGranularityObjectForStringAxis(gObj) {
  gObj.pointWidth = gObj.dataPointWidth
  gObj.primary = { filter: false, showLabel: true }
  gObj.ticks = { increment: 1 }
  gObj.ticksOn = true
  return gObj
}
// MAKE GRANULARITY OBJECT FOR STRING AXIS ends

// MAKE GRANULARITY OBJECT FOR TIME AXIS
// Called from getGranularity. For time-based axis, creates
// a complex granularity object
export function makeGranularityObjectForTimeAxis(
  gObj,
  width,
  config,
  testText,
  textPrefs
) {
  // Margin between strings (from DPs)
  const margin = textPrefs.minGapBetweenLabels
  // Complete set of granularity-interval preferences
  const granPrefs = granularityPreferences()
  // Interval, with month adjustment to "Mmm" default
  const rawInterval = config.timeFormats.interval
  // So start with a raw level:
  const rawTickLevel = granPrefs[rawInterval].tickLevel
  // And a dynamic version...
  let interval = rawInterval
  // ...and a dynamic copy
  let pWidth = gObj.dataPointWidth
  // Flag will be set false when we have a 'fit'
  let notReady = true
  // Default primary filter. Primary axis starts 1-to-1 with
  // raw data; but if granularity coarsens, must filter...
  let primaryFilter = false
  // Adjusts value for width testing, for DC scaling
  const wFactor = config.xAxis.textWidthSizeTestFactor
  while (notReady) {
    // Granularity prefs for this interval
    const thisGran = granPrefs[interval]
    // testVal may be a string ('DD', 'MM'...) or a number
    let testVal = thisGran.testVal
    // Why did I EVER think next was a good idea?!
    // const testVal = +thisGran.testVal * wFactor
    // If true, slots are wide enough
    let labelFits = false
    if (isNaN(testVal)) {
      // testVal is an interval-specific string (e.g. 'MMM')
      // Test on-screen against slot width
      testText.text(thisGran.testVal)
      // Will it fit?
      let testWidth = testText.node().getComputedTextLength()
      testWidth *= wFactor
      labelFits = pWidth - margin > testWidth
    } else {
      // Check numeric value against slot width
      testVal *= wFactor;
      labelFits = pWidth > testVal;
    }
    // Break the loop if the label will fit...
    // ...or if I've come to the last available interval
    // (NOTE: in lookup final interval must set ITSELF as 'next')
    const lastInterval = interval === thisGran.next.interval
    if (labelFits || lastInterval) {
      // Label will fit, so apply values to result
      gObj.ticks = thisGran.ticks
      gObj.primary = thisGran.primary
      gObj.primary.filter = primaryFilter
      gObj.secondary = thisGran.secondary
      gObj.pointWidth = pWidth
      gObj.interval = interval
      // Reset flag to break
      notReady = false
    } else {
      // Reset for next loop
      interval = thisGran.next.interval
      pWidth *= thisGran.next.factor
      primaryFilter = true
    }
  }
  // Use ticksOn property of raw granularity set
  gObj.ticksOn = granPrefs[rawTickLevel].ticksOn
  gObj.pointWidth = pWidth
  // In some cases I need to revise the 2ry axis label
  // to a longer format (e.g. 'Mmmm yyyy' on days that fall within a single month)
  if (secondaryAxisNeedsLongFormat(config)) {
    gObj.secondary.format = switchToLongFormat(gObj.secondary.format)
  }
  // Kludgey override for quarters:
  if (
    rawInterval === 'quarters' &&
    gObj.primary.displayInterval === 'months' &&
    gObj.primary.increment === 3
  ) {
    gObj.primary.filter = true
  }
  return gObj
}
// MAKE GRANULARITY OBJECT FOR TIME AXIS ends

// GET GRANULARITY
// Called from xaxis-ordinal-config to work out
// the granularity for the x-axis
// Args are:
//    innerbox width (after yaxis set its margins);
//    the config object;
//    a D3 test object to which I can append strings for measuring on-page
//        (Don't 'remove': caller does that.)
//    text properties
export function getGranularity(width, config, testText, textPrefs) {
  // 'Slot' width
  const dataPointWidth = getDataPointWidth(width, config)
  // Object to return, with raw-data point width. Other props added below
  const granularityObject = {
    dataPointWidth,
  }

  // Categories are strings or time-based
  // Assemble and return granularityObject
  if (config.categoryType === 'string') {
    makeGranularityObjectForStringAxis(granularityObject)
  } else {
    makeGranularityObjectForTimeAxis(
      granularityObject,
      width,
      config,
      testText,
      textPrefs
    )
  }
  return granularityObject
}
// GET GRANULARITY ends
