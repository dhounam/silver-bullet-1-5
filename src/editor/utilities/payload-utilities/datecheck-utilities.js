// Handlers to check date validity
// Also includes date conversion handlers, which
// might move into a separate component...

// GET MONTH LIST
// Returns an array of short or long month names
export function getMonthList(long) {
  let mArray = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  if (long) {
    mArray = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
  }
  return mArray;
}

// MONTH VALS ARE QUARTERS
// Called form doInitialQuartersTest. Given three numbers,
// it verifies that they're 'monthable', then checks for
// a 3-month increment, allowing for a year-turn
export function monthValsAreQuarters(valA, valB, valC) {
  const qVal = 3;
  let result = false;
  const maxDate = Math.max(valA, valB, valC);
  // So months:
  if (maxDate < 13) {
    if (valB - valA === qVal || valB < valA) {
      if (valC - valB === qVal || valC < valB) {
        result = true;
      }
    }
  }
  return result;
}
// MONTH VALS ARE QUARTERS ends

// DO INITIAL QUARTERS TEST
// Called from doFirstUsUkTest. Checks for quarters in dmy/mdy format
// Arg is array of arrayified dates
export function doInitialQuartersTest(dArray) {
  let result = '';
  // First, look for UK d/m/y
  // Get 2nd element in each of the first 3 elements of the array
  // If these are months-as-quarters we'll see an increment
  // of 3 or a reversion to a lower (1st quarter) value...
  let valA = +dArray[0][1];
  let valB = +dArray[1][1];
  let valC = +dArray[2][1];
  if (monthValsAreQuarters(valA, valB, valC)) {
    result = 'dmy-date';
  }
  // Ditto for US, looking at first element (m/d/y)
  valA = +dArray[0][0];
  valB = +dArray[1][0];
  valC = +dArray[2][0];
  if (monthValsAreQuarters(valA, valB, valC)) {
    result = 'mdy-date';
  }
  return result;
}
// DO INITIAL QUARTERS TEST ends

// DO INITIAL DMY-MYD TEST
// Called from doFirstUsUkTest, to check whether
// first cat is dmy or myd
export function doInitialDmyMdyTest(dArray) {
  let result = '';
  // First check for a date that breaks the max month value:
  const maxM = 12;
  for (let iii = 0; iii < dArray.length; iii++) {
    if (dArray[iii][0] > maxM) {
      // First element > 12, so can't be mdy
      result = 'dmy-date';
      break;
    } else if (dArray[iii][1] > maxM) {
      // 2nd element > 12, so can't be dmy
      result = 'mdy-date';
      break;
    }
  }
  // If we got a result, return it
  if (result.length > 0) {
    return result;
  }
  // Still here? Another test!
  // (I could combine them, but that way madness lies)
  const sep = 9;
  const apr = 4;
  // If I can get a value > September, followed
  // by a value < April, that's a giveaway
  for (let iii = 0; iii < dArray.length - 1; iii++) {
    if (dArray[iii][0] > sep && dArray[iii + 1][0] < apr) {
      result = 'mdy-date';
      break;
    } else if (dArray[iii][1] > sep && dArray[iii + 1][1] < apr) {
      result = 'dmy-date';
      break;
    }
  }
  // If it's not definitely dmy or mdy, let's default to dmy
  return 'dmy-date';
}
// DO INITIAL DMY-MYD TEST

// DO FIRST US-UK TEST
// Called by RawDataUtils.getInitialDateFormat.
// Arg is an array of arrayified dates, from which
// we determine whether dates are in mdy or dmy format
// Returns 'mdy-date' or 'dmy-date' (or 'invalid')
export function doFirstUsUkTest(dArray) {
  // First, test for QUARTERS. Returns 'dmy-date',
  // 'mdy-date', or empty string
  // (Remember: this is just an initial test)
  const qFormat = doInitialQuartersTest(dArray);
  if (qFormat.length > 0) {
    return qFormat;
  }
  // Still here? Check for non-quarterly dates
  const dFormat = doInitialDmyMdyTest(dArray);
  return dFormat;
}
// DO FIRST US-UK TEST ends

// CAT IS YMD
// Called from RawdataUtils.validateCategories(?)
// Crude check for date in yyyy mm dd (hh mm) format
// Arg is an array
export function dateIsYmd(dArray) {
  let result = false;
  // All numbers; at least 3 elements; element 1 has 4 chars
  if (!isNaN(dArray.join('')) && dArray.length > 2 && dArray[0].length === 4) {
    result = true;
  }
  return result;
}
// CAT IS YMD

// ALL CATS ARE SPELLED DATES
// Called from validateCategories to check that ALL categories
// are dates with spelled month
// Arg 1 is array of arrayified dates
// Arg 2 flags 'dd Mmm(m) yyyy' or 'Mmm yy' format
export function allCatsAreSpelledDates(dArray, catType) {
  let result = '';
  for (let dNo = 0; dNo < dArray.length; dNo++) {
    if (catType === 'spell-date-dmy') {
      if (!isSpelledDMYFormat(dArray[dNo])) {
        // On error, returns location
        result = (dNo + 2).toString();
        break;
      }
    } else if (!isSpelledMYFormat(dArray[dNo])) {
      result = (dNo + 2).toString();
      break;
    }
  }
  return result;
}
// ALL CATS ARE SPELLED DATES ends

// CAT IS FROM-TO
// Called from getBasicCategoryType to check for
// from-to categories
export function catIsFromTo(cat) {
  // 2004-05?
  const hyphenSplit = cat.split(/-/g);
  if (hyphenSplit.length === 2 && !isNaN(hyphenSplit.join(''))) {
    return true;
  }
  // 2004 to 2005
  const spaceSplit = cat.split(' to ');
  if (spaceSplit.length === 2 && !isNaN(spaceSplit.join(''))) {
    return true;
  }
  return false;
}
// CAT IS FROM-TO ends

// GET BASIC CATEGORY TYPE
// Called from  RawdataUtils.validateCategories to check
// whether first cat is string, number, or date
export function getBasicCategoryType(cat) {
  const dateSeps = /[-/:\s]/g;
  // Quarters
  if (catIsQuarter(cat.split(dateSeps))) {
    return 'quarter';
  }
  // Numbers
  if (!isNaN(cat)) {
    // It's a number of some sort. Integer?
    if (parseInt(cat, 10).toString() === cat) {
      return 'integer';
    }
    // Treat non-integers as strings (for now, at least)
    return 'string';
  }
  // '2006-08' and '2006 to 2008 are considered a string
  if (catIsFromTo(cat)) {
    return 'string';
  }
  const unseparatedCat = cat.replace(dateSeps, '');
  if (!isNaN(unseparatedCat)) {
    // Date in number format
    return 'number-date';
  }
  if (!isNaN(Date.parse(cat))) {
    // Spelled date? It looks like a date...
    // ...but it's not quite that simple
    // We may have dd Mmm yyyy or the obnoxious
    // Mmm-yy!
    const splitDate = cat.split(dateSeps);
    if (splitDate.length === 3 && isSpelledDMYFormat(splitDate)) {
      return 'spell-date-dmy';
    }
    if (splitDate.length === 2 && isSpelledMYFormat(splitDate)) {
      return 'spell-date-my';
    }
  }
  // If all else fails:
  return 'string';
}
// GET BASIC CATEGORY TYPE ends

// GET MONTH STRING
// Args are a number and a flag. Returns short or long month string
export function getMonthString(mNo, isShort) {
  let mArray = [];
  if (isShort) {
    mArray = getMonthList(false);
  } else {
    mArray = getMonthList(true);
  }
  return mArray[mNo];
}
// GET MONTH STRING ends

// GET MONTH NUMBER
// Convert month name to number
export function getMonthNumber(mStr) {
  let mNo = -1;
  const mArray = getMonthList(false);
  const shortM = mStr.slice(0, 3);
  mNo = mArray.indexOf(shortM);
  // Not found returns -1, in which case I'll return zero
  // Otherwise month number from Jan=1
  return mNo + 1;
}
// GET MONTH NUMBER ends

// IS SPELLED DMY FORMAT
// Called from allCatsAreSpelledDates...
// Arg is one date as array. Returns true for
// 'dd Mmm(m) yyyy' format
// NOTE: doesn't recognise Mmm dd yyyy
export function isSpelledDMYFormat(dArray) {
  // Now we're looking for two numbers (day and year)...
  if (isNaN(dArray[0]) || isNaN(dArray[2])) {
    return false;
  }
  // ... a month
  // List of long months as lower case string
  const mString = getMonthList(true)
    .join()
    .toLowerCase();
  // Is my putative month in that list?
  // (will find both 'jan' and 'january')
  if (mString.includes(dArray[1].toLowerCase())) {
    return true;
  }
  // If we get here...
  return false;
}
// IS SPELLED DMY FORMAT

// IS SPELLED MY FORMAT
// Called from allCatsAreSpelledDates...
// Arg is one date as array. Returns true for
// 'Mmm yy' format only
// (Date is amended to dd Mmm yyyy later)
export function isSpelledMYFormat(dArray) {
  // Year
  if (isNaN(dArray[1])) {
    return false;
  }
  // Month
  // List of long months as lower case string
  const mString = getMonthList(true)
    .join()
    .toLowerCase();
  // Is my putative month in that list?
  // (will find both 'jan' and 'january')
  if (mString.includes(dArray[0].toLowerCase())) {
    return true;
  }
  // If we get here...
  return false;
}
// IS SPELLED MY FORMAT

// QUARTER TO DATE
// Called from convertQuarters to convert Qn to 'dd Mmmm'
export function quarterToDate(qqq) {
  let result = '';
  switch (qqq) {
    case 'q1':
      result = '15 February';
      break;
    case 'q2':
      result = '15 May';
      break;
    case 'q3':
      result = '15 August';
      break;
    default:
      result = '15 November';
  }
  return result;
}

// CONVERT QUARTERS
// Called from RawdataUtils.validateCategories
// to convert "Q" format to dd mmmm yyyy
export function convertQuarters(catArray) {
  // Check if we need to convert 'yy' to 'yyyy'
  // Might as well hard-code...
  const cPrefix = '20';
  const addCentury = catArray[0][1].length === 2;
  const dArray = [];
  for (let iii = 0; iii < catArray.length; iii++) {
    const myD = catArray[iii];
    if (addCentury) {
      myD[1] = `${cPrefix}${myD[1]}`;
    }
    // So now I have, say, ['Q1', '2017']; force lower case...
    myD[0] = quarterToDate(myD[0].toLowerCase());
    // Recombine as 'dd mmmm yyyy'
    const dStr = `${myD[0]}, ${myD[1]}`;
    dArray.push(dStr);
  }
  return dArray;
}
// CONVERT QUARTERS ends

// CAT IS QUARTER
// Called from RawDataUttils.getCategoryType to check for 'Qn yy(yy)' format
// Arg is an array
export function catIsQuarter(qArray) {
  let isQ = false;
  if (qArray.length === 2) {
    if (!isNaN(qArray[1])) {
      // We've got a year as number, what about the first element?
      // Look for Q (or q) and any digit
      if (/^[qQ]\d$/.test(qArray[0])) {
        isQ = true;
      }
    }
  }
  return isQ;
}
// CAT IS QUARTER ends

// ALL CATS ARE QUARTERS
// Called from validateCategories to do 'Q' format consistency check
// (Individual dates are already arrayified)
export function allCatsAreQuarters(catArray) {
  let result = '';
  for (let cNo = 0; cNo < catArray.length; cNo++) {
    if (!catIsQuarter(catArray[cNo])) {
      result = (cNo + 2).toString();
      break;
    }
  }
  return result;
}
// ALL CATS ARE QUARTERS ends

// CONVERT TO UNAMBIGUOUS FORMAT
// Called from convertDmy. Converts dates in any formet
// to 'dd Mmmm yyyy' (hh:mm unaffected -- I hope).
// Updates array by ref.
export function convertToUnambiguousFormat(dArray, dType) {
  // Default 'dmy' (+ hh:mm?)
  let dPos = 0;
  let mPos = 1;
  let yPos = 2;
  if (dType === 'mdy-date') {
    dPos = 1;
    mPos = 0;
  } else if (dType === 'ymd-date') {
    dPos = 2;
    mPos = 1;
    yPos = 0;
  }
  // Convert dmy to dd Mmm yyyy
  dArray.forEach((myD, dNo) => {
    // Reserve any hh:mm...
    const timeEls = myD.slice(3);
    // Convert dmy part of date
    let formattedStr = `${myD[dPos]} ${getMonthString(
      Number(myD[mPos]) - 1,
      true,
    )} ${myD[yPos]}`;
    // Append any time
    if (timeEls.length > 0) {
      formattedStr = `${formattedStr} ${timeEls.join(':')}`;
    }
    dArray[dNo] = formattedStr;
  });
}
// CONVERT TO UNAMBIGUOUS FORMAT ends

// MONTHS ARE PLAUSIBLE
// Called from convertDmy. Checks that I'm not breaking
// basic limits for months (or quarters)
export function monthsArePlausible(dArray, dType) {
  let monthsOk = true;
  // Check that all 'mm' are plausible
  let mElement = 1;
  if (dType === 'mdy-date') {
    mElement = 0;
  }
  // Still here? OK, let's loop through and test months are OK
  // Check months for a value > 12
  const maxM = 12;
  // If I can get a value > September, followed
  // by a value < April, that's not good
  const sep = 9;
  const apr = 4;
  // (remember: months are still strings, from 1-12), which
  // should indicate that we're looking at m/d/y format...
  const dLen = dArray.length;
  for (let dNo = 0; dNo < dLen; dNo++) {
    if (dArray[dNo][mElement] > maxM) {
      monthsOk = false;
      break;
    } else if (dArray[dNo][mElement] > sep) {
      // Avoid hitting end of array
      if (dNo < dLen - 1) {
        if (dArray[dNo + 1][mElement] < apr) {
          monthsOk = false;
          break;
        }
      }
    }
  }
  return monthsOk;
}
// MONTHS ARE PLAUSIBLE ends

// GET YY DATE POSITION
// Called from convertDmy to check a date for 'yy'
// (as against 'yyyy') format. If date *is* 'yy',
// returns index of 'yy' (if 'yyyy' returns -1)
// Args are one date, as array; and format
export function getYyDatePosition(myD, dType) {
  let yEl = 2;
  if (dType === 'ymd-date') {
    yEl = 0;
  }
  // If the year part of the date is 'yyyy', set to -1
  if (myD[yEl].length === 4) {
    yEl = -1;
  }
  return yEl;
}
// GET YY DATE POSITION ends

// ADD CENTURIES
// Called from convertDmy to force 'yy' to 'yyyy'
export function addCenturies(dArray, dType) {
  // Might as well hard-code: logic is that if dates bridge
  // century they should be yyyy. If they're all, say,
  // '19-' the idiot should have said so!
  // (This might be done more efficiently with check against getFullYear)
  const cPrefix = '20';
  // Assume consistency
  const yearPos = getYyDatePosition(dArray[0], dType);
  // Start by splitting the strings into an array
  if (yearPos >= 0) {
    dArray.forEach((myD, iii) => {
      // If we fixed Google-number-date, year is already yyyy, so
      if (dArray[iii][yearPos].length === 2) {
        dArray[iii][yearPos] = `${cPrefix}${myD[yearPos]}`;
      }
    });
  }
}
// ADD CENTURIES ends

// ARRAYIFY ALL DATES
// Called from RawDataUtils.validateCategories
// Converts all date strings into arrays
export function arrayifyAllDates(dArray) {
  // Arrayify the strings:
  const dSeps = /[-/:\s]/g;
  dArray.forEach((myD, iii) => {
    dArray[iii] = myD.split(dSeps);
  });
}
// ARRAYIFY ALL DATES ends

// CONVERT D-M-Y
// Called from RawDataUtils.ValidateCategories.
// Args are entire array of arrayified dates, and type
// (hm-date, dmy-date, mdy-date or ymd-date)
export function convertDmy(dArray, dType) {
  // We may need to convert 'yy' to 'yyyy'
  addCenturies(dArray, dType);
  // Convert dates to 'dd Mmm yyyy (hh:mm)'
  convertToUnambiguousFormat(dArray, dType);
  return dArray;
}
// CONVERT D-M-Y ends

// GOOGLE NUMBER TO DATE
// Called from fixDateType
// Converts a number in Google sheet categories to a date
// as 'dd/mm/yyyy'
// NOTE: not entirely foolproof. I'm rather hoping that
// upstream checks have secured the ground, but watch out!!
export function googleNumberToDate(gNo) {
  // Fcn converts '4' to '04'
  const pad = val => {
    let str = val.toString();
    if (str.length < 2) {
      str = `0${str}`;
    }
    return str;
  };
  // Google date zero
  const theDate = new Date('30 December 1899');
  // Add number of days, and convert to dd/mm/yyyy
  theDate.setDate(theDate.getDate() + parseInt(gNo, 10));
  const y = theDate.getFullYear().toString();
  const m = pad(theDate.getMonth() + 1);
  const d = pad(theDate.getDate());
  // const dateAsArray = `${pad(d)}/${pad(m)}/${y}`;
  return { d, m, y };
}
// GOOGLE NUMBER TO DATE ends

// DATE IS DMY OR MDY
// Called from doDmy/MydConsistencyCheck, to verify
// that a date is valid dmy or myd
// Arg 1: one date as an array
// Arg 2: true=dmy; false=mdy
// Also fixes Google-introduced 'Mmmm' anomaly, if found
export function dateIsDmyOrMdy(dArray, testDmy) {
  // Arrayified, so can't check for colon
  // if (dArray.length > 3 && !dStr.includes(':')) {
  //   // More than 3 elements must include hh:mm
  //   return false;
  // }
  // Google can unilaterally convert dates to a number. So...
  if (dArray.length === 1 && !isNaN(dArray[0])) {
    // I need consistency with overall 'yy/yyyy' style

    // Convert number to d/m/y as array
    // NOTE: this always returns *some* date, which isn't
    // checked for plausibility. Revisit... one day.
    const dObj = googleNumberToDate(dArray[0]);
    // Update by ref
    dArray[0] = dObj.d;
    dArray.push(dObj.m);
    dArray.push(dObj.y);
    return true;
  }
  // Still here? Check number of elements
  if (dArray.length < 3) {
    return false;
  }
  // Check the month is legal
  // Element to test for month as number:
  let mPlace = 0;
  if (testDmy) {
    mPlace = 1;
  }
  let mVal = dArray[mPlace];
  // First: if the month is a string, try to convert to number
  if (isNaN(mVal)) {
    mVal = getMonthNumber(mVal);
    // If we failed to find a month name to convert, fail:
    if (mVal === 0) {
      return false;
    }
  }
  // Still here? Month number in range?
  if (mVal < 0 || mVal > 12) {
    return false;
  }
  // If we got this far:
  dArray[mPlace] = mVal;
  return true;
}
// DATE IS DMY OR MDY

// DO DMY CONSISTENCY CHECK
// Called from RawdateUtils.validateCategories
// to check that all dates are dmy. Returns
// the number of the row where any error occurred
export function doDmyConsistencyCheck(dArray) {
  let result = '';
  for (let dNo = 0; dNo < dArray.length; dNo++) {
    if (!dateIsDmyOrMdy(dArray[dNo], true)) {
      result = (dNo + 2).toString();
      break;
    }
  }
  return result;
}
// DO DMY CONSISTENCY CHECK ends

// DO MDY CONSISTENCY CHECK
// Called from RawdateUtils.validateCategories
// to check that all dates are mdy
export function doMdyConsistencyCheck(dArray) {
  let result = '';
  for (let dNo = 0; dNo < dArray.length; dNo++) {
    if (!dateIsDmyOrMdy(dArray[dNo], false)) {
      result = (dNo + 2).toString();
      break;
    }
  }
  return result;
}
// DO MDY CONSISTENCY CHECK ends

// DO YMD CONSISTENCY CHECK
// Called from RawdateUtils.validateCategories
// to check that all dates are yyyy mm dd
export function doYmdConsistencyCheck(dArray) {
  let result = '';
  for (let dNo = 0; dNo < dArray.length; dNo++) {
    if (!dateIsYmd(dArray[dNo])) {
      result = (dNo + 2).toString();
      break;
    }
  }
  return result;
}
// DO YMD CONSISTENCY CHECK ends

// ADJUST YEARS BY
// Called from getYearsAdjustment. For numbers or dates < 1000
// Date.parse is... unreliable. So for these numbers I get
// a value, in thousands, that will be inferentially added
// to them so that Javascipt will parse them, then
// subsequently subtracted!
export function adjustYearsBy(val) {
  let result = 0;
  const compareTo = -1;
  const thou = 1000;
  if (val > compareTo) {
    // Zero+ returns 1000
    result = thou;
  } else {
    // BC dates will return enough millennia to get to +1000
    result = Math.abs(Math.floor(val / thou) * thou) + thou;
  }
  return result;
}
// ADJUST YEARS BY ends

// GET YEARS ADJUSTMENT
// Major KLUDGE for dates/numbers < 1000. I'm going to add whatever
// is necessary to numbers to get them > 999 and append that amount
// to the mix, to subtract later...
export function getYearsAdjustment(catArray) {
  let adjustment = 0;
  const firstCat = parseInt(catArray[0], 10);
  const lastCat = parseInt(catArray[catArray.length - 1], 10);
  const thou = 1000;
  if (firstCat < thou || lastCat < thou) {
    adjustment = adjustYearsBy(Math.min(firstCat, lastCat));
  }
  return adjustment;
}
// GET YEARS ADJUSTMENT

// FIX MMM-YY DATES
// Called from RawdataUtils.validateCategories. Converts
// dates in Mmm-yy format to 15 Mmm yyyy, by ref
// (Format is a nasty Excel fuckabout, dear to EIU)
export function fixMmmYyDates(dArray) {
  // const fixedDates = dArray.map(item => {
  //   // item is a date as ['Mmm', 'yy']
  //   // Check year is yyyy
  //   const year = item[1].toString();
  //   if (year.length === 2) {
  //     item[1] = `20${year}`;
  //   }
  //   item.unshift('15');
  //   return item;
  // })
  // return fixedDates;
  for (const dNo in dArray) {
    const thisD = dArray[dNo];
    // Date as ['Mmm', 'yy']
    // Check year is yyyy
    const year = thisD[1].toString();
    if (year.length === 2) {
      // Assumes dates are 21st century
      thisD[1] = `20${year}`;
    }
    // Prepend mid-month date
    thisD.unshift('15');
  }
}
// FIX MMM-YY DATES
