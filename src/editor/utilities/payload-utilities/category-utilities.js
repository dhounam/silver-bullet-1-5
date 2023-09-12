// Category-triage utilities
// 'Dependent' of RawDataUtils

import * as DateCheckUtils from './datecheck-utilities';
import * as DupUtils from './duplicate-utilities';

// NB duplicate from SilverChart
// import FixYearInDate from '../../../chartwrapper/chartside-utilities/fix-year';
const FixYearInDate = function(date) {
  // If date is just year, append 'Jan'
  if (!isNaN(date)) {
    date = date.toString();
    if (date.length === 4) {
      // Year as 'yyyy' -- force!
      date = `January 1 ${date}`;
    }
  }
  return new Date(date);
};

// ISOLATE CATEGORIES
// Called from RawDataUtils.unpickData to extract array of categories
// from 'block' of raw data
export function isolateCategories(dataArray) {
  // dataArray is an array (by rows) of arrays (columns)
  // I want just categories, without header
  // And strip rogue commas ('14 April, 2020')
  const categories = dataArray.map((row, rowNo) => {
    let cat = row[0];
    if (rowNo > 0) {
      cat = cat.replace(',', '');
    }
    return cat;
  });
  categories.shift();
  return categories;
}
// ISOLATE CATEGORIES ends

// TRIAGE CATEGORIES
// Called from RawDataUtils.unpickData
// Possible categoryTypes are: 'invalid', 'strings', 'time'
// Args are array of categories, timeFormats definitions, no. of ms in a day
export function triageCategories(catArray, timeFormats, dayInMs) {
  // Returns an object with 2 props: category type,
  // and an array of categories with dates in unambiguous format
  const validatedCategoryObj = validateCategories(catArray);
  const categoryType = validatedCategoryObj.catType;
  // The default return object:
  const triagedObj = {
    categoryType,
    catError: false,
    validityMsg: validatedCategoryObj.validityMsg,
  };
  if (categoryType === 'invalid') {
    // If the categories are invalid, set error prop and return
    triagedObj.catError = true;
    return triagedObj;
  }
  // String categories have no special treatment
  const yearsAdjustedBy = validatedCategoryObj.yearsAdjustedBy;
  catArray = validatedCategoryObj.catArray;
  // Time series:
  if (categoryType === 'time' || categoryType.includes('-date')) {
    // Get time interval: years, months, days, hours...
    triagedObj.timeFormats = getTimeObj(
      catArray,
      timeFormats,
      dayInMs,
      yearsAdjustedBy,
    );
  }
  // Append the (possibly 1000-adjusted) array of categories
  triagedObj.catArray = catArray;
  triagedObj.yearsAdjustedBy = yearsAdjustedBy;
  return triagedObj;
}
// TRIAGE CATEGORIES ends

// VALIDATE CATEGORIES
// Called from triageCategories. Passed an array of categories,
// checks whether number, date, string or invalid...
// NOTE: catArray does NOT include categories header
export function validateCategories(catArray) {
  let catType = '';
  const validityObj = {
    catType,
    catArray,
    yearsAdjustedBy: 0,
    validityMsg: '',
  };
  // First: don't hang around for duplicates
  // (if dups found, updates validityObj by ref)
  if (findDuplicateCats(catArray, validityObj)) {
    return validityObj;
  }
  // Now, let's rule out strings
  catType = areCatsStrings(catArray);
  if (catType === 'string') {
    validityObj.catType = 'string';
    return validityObj;
  }
  // Next: what about integers? (potential yyyy)...
  if (catType === 'integer') {
    areCatsTimeOrString(catArray, validityObj);
    return validityObj;
  }
  // ...or non-integer number
  if (catType === 'number') {
    // FIXME: treated as strings for now
    // if (!allCatsAreYearDates(catArray)) {
    // If we don't get consistent numbers, it's strings:
    validityObj.catType = 'string';
    return validityObj;
  }
  // Still here?
  // Now we're down to dates, so ARRAYIFY
  DateCheckUtils.arrayifyAllDates(catArray);

  // HERE***********************************

  // If first cat is *spelled* date, do consistency check
  let errorLocation = '';
  if (catType.includes('spell-date')) {
    errorLocation = DateCheckUtils.allCatsAreSpelledDates(catArray, catType);
    if (errorLocation.length > 0) {
      // Inconsistency is fatal:
      validityObj.catType = 'invalid';
      validityObj.validityMsg = `inconsistent date format at column A, row ${errorLocation}. Data in col A will be processed as text.`;
    } else {
      validityObj.catType = 'time';
    }
    // Aug'20: special fix for 'Mmm yy' dates
    if (catType === 'spell-date-my') {
      DateCheckUtils.fixMmmYyDates(validityObj.catArray);
    }
    return validityObj;
  }
  // Ditto quarters in 'Q' format
  if (catType === 'quarter') {
    errorLocation = DateCheckUtils.allCatsAreQuarters(catArray);
    if (errorLocation.length > 0) {
      // Inconsistency is fatal:
      validityObj.catType = 'invalid';
      validityObj.validityMsg = `inconsistent date format at column A, row ${errorLocation}. Data in col A will be processed as text.`;
    } else {
      validityObj.catType = 'time';
      // Convert to dd Mmm yyyy
      validityObj.catArray = DateCheckUtils.convertQuarters(catArray);
    }
    return validityObj;
  }

  // Still here? Dates as numbers! Oh, good.
  // Before we can do a complete consistency check, we
  // have to pin down the date shape (dmy/mdy/ymd) as
  // indicated at the top of the sequence.
  catType = getInitialDateFormat(catArray);

  // catType is one of 'ymd-date', 'dmy-date' or 'mdy-date'
  // Consistency checks
  errorLocation = '';
  if (catType === 'ymd-date') {
    errorLocation = DateCheckUtils.doYmdConsistencyCheck(catArray);
  } else if (catType === 'dmy-date') {
    errorLocation = DateCheckUtils.doDmyConsistencyCheck(catArray);
  } else {
    // mdy-date
    errorLocation = DateCheckUtils.doMdyConsistencyCheck(catArray);
  }
  // Consistency checks return the location of failure as a string
  // But note that these only verify *format* (not sequence)
  if (errorLocation.length > 0) {
    validityObj.catType = 'invalid';
    validityObj.validityMsg = `inconsistent date format at column A, row ${errorLocation}. Data in col A will be processed as text.`;
    return validityObj;
  }
  // Still here? Consistent all-number dates
  if (catType.includes('date')) {
    // date or datetime converts to an unambiguous month name
    // (with possible hh:mm)
    catArray = DateCheckUtils.convertDmy(catArray, catType);
    catType = 'time';
  } else if (catType === 'quarters') {
    catArray = DateCheckUtils.convertQuarters(catArray);
    catType = 'time';
  }
  // And finally
  return { catType, catArray, yearsAdjustedBy: 0, validityMsg: '' };
}
// VALIDATE CATEGORIES ends

// FIND DUPLICATE CATS
// Called from validateCategories. Returns false if
// there are duplicate categories
export function findDuplicateCats(catArray, vObj) {
  let hasDups = false;
  const arrayOfDups = DupUtils.dupsInArray(catArray);
  if (arrayOfDups.length > 0) {
    const dupString = arrayOfDups[0].string;
    const dupIndex = `A${+arrayOfDups[0].index + 2}`;
    vObj.catType = 'invalid';
    vObj.validityMsg = `the category ${dupString} (cell ${dupIndex}) appears more than once. Categories must be unique.`;
    hasDups = true;
  }
  return hasDups;
}
// FIND DUPLICATE CATS ends

// CATS ARE STRINGS
// Called from validateCategories. Basic check for
// string categories
export function areCatsStrings(catArray) {
  // Less than three points, treat as strings
  let catType = '';
  if (catArray.length < 3) {
    catType = 'string';
  } else {
    // If first cat is string, assume all are
    const firstCat = catArray[0];
    catType = DateCheckUtils.getBasicCategoryType(firstCat);
  }
  return catType;
}
// CATS ARE STRINGS ends

// ARE CATS TIME OR STRING
// Called from validateCategories. First cat is an integer;
// so are we talking yyyy...?
export function areCatsTimeOrString(catArray, vObj) {
  if (allCatsAreIntegers(catArray) && catsAreSequential(catArray)) {
    // Work-around for Javascripts difficulty with years < 1000
    const yAdjust = DateCheckUtils.getYearsAdjustment(catArray);
    vObj.yearsAdjustedBy = yAdjust;
    vObj.catType = 'time';
  } else {
    vObj.catType = 'string';
  }
}
// ARE CATS TIME OR STRING ends

// ALL CATS ARE INTEGERS
// Called from validateCategories to check whether ALL
// categories are years
export function allCatsAreIntegers(catArray) {
  let result = true;
  for (let catNo = 0; catNo < catArray.length; catNo++) {
    const cat = catArray[catNo];
    if (isNaN(cat) || cat.includes('.')) {
      result = false;
      break;
    }
  }
  return result;
}
// ALL CATS ARE INTEGERS ends

// GET INITIAL DATE FORMAT
// Called from validateCategories
export function getInitialDateFormat(dateArray) {
  const val1 = dateArray[0];
  // Quarters as 'Q1 yy/yy'? Just check one value
  if (DateCheckUtils.catIsQuarter(val1)) {
    return 'quarters';
  }
  // ymd: one val is enough
  if (DateCheckUtils.dateIsYmd(val1)) {
    return 'ymd-date';
  }
  // Now for dmy v. mdy (or invalid)
  return DateCheckUtils.doFirstUsUkTest(dateArray);
}
// GET INITIAL DATE FORMAT ends

// CATS ARE SEQUENTIAL
// Called from validateCategories to check that an array
// of integers are sequential
export function catsAreSequential(catArray) {
  let result = true;
  for (let catNo = 1; catNo < catArray.length; catNo++) {
    const prevCat = +catArray[catNo - 1];
    const thisCat = +catArray[catNo];
    if (thisCat <= prevCat) {
      result = false;
      break;
    }
  }
  return result;
}
// CATS ARE SEQUENTIALl ends

//  GET TIME OBJ
// Called from triageCategories. Passed an array of dates, as strings,
// works out the time interval to use.
// NOTE: this may eventually benefit from user confirmation (for example for
// 5+ years, quarters, weeks, etc.)
// Returns an object with interval and format properties
// Args are array of dates, timeformats lookup from default prefs,
// number of ms in 1 day, and the 1000-adjustment value
export function getTimeObj(dateArray, lookup, aDay, yearsAdjustedBy) {
  // I need one less than number of points
  // NOTE: this assumes regular intervals. This will
  // revise in due course...
  const len = dateArray.length - 1;
  // Extract first and last values from dateArray, since
  // I may have to tweak them for 1000-adj.
  let dFirst = dateArray[0];
  let dLast = dateArray[len];
  // I need a first year, as yyyy, to identify first year label
  // on the time axis, so I can force 'yyyy'
  const firstYear = FixYearInDate(dFirst).getFullYear();
  const lastYear = FixYearInDate(dLast).getFullYear();
  // If I have to do an adjustment for years/numbers < 1000
  // apply it now:
  if (yearsAdjustedBy > 0) {
    dFirst = parseInt(dFirst, 10) + yearsAdjustedBy;
    dLast = parseInt(dLast, 10) + yearsAdjustedBy;
  }
  const firstDate = FixYearInDate(dFirst);
  const lastDate = FixYearInDate(dLast);
  const dayCount = (lastDate - firstDate) / aDay / len;
  // Default to return is years
  let tObj = {};
  // Lookup is an array of intervals ('years', etc) in descending order
  // NOTE: this probably needs elaboration, but for now we return an
  // object with a timeInterval string ('years', etc) and matching
  // D3 timeFormat ('%Y', etc.)
  // Added secondRow flag and format, Aug 2016.
  // NOTE: and presumably I could add granularity to this, allowing intervals
  // of, say 5 or 10 years... plus weeks and quarters
  //
  // Over a long timeseries (say, 2000+ points), the usual Math errors kick in
  // and absolute equality is unobtainable. So allow vals to be 'close enough'
  const closeEnough = (myVal, toVal) => {
    const lowVal = toVal * 0.989;
    const highVal = toVal * 1.011;
    return myVal > lowVal && myVal < highVal;
  };
  for (const tForm in lookup) {
    const myForm = lookup[tForm];
    // Next is basically '>=', allowing for Math unreliability
    if (dayCount > myForm.dayCount || closeEnough(dayCount, myForm.dayCount)) {
      // Just copy the entire node:
      tObj = myForm;
      break;
    }
  }
  // Append firstyear, defined above:
  tObj.firstYear = firstYear;
  tObj.lastYear = lastYear;
  return tObj;
}
//  GET TIME OBJ ends

// OVERLAY CATEGORIES
// Called from RawDataUtils.unpickData. Args are:
//    the array of category strings, which may have been changed
//        from, say, 'd/m/yyyy' to 'dd Mmm yyyy' format;
//    the data array (which includes a first row of 'headers')
// Function loops through, updating data array's categories
// so they're consistent for further processes
// Revised data is returned by ref
export function overlayCategories(source, target) {
  for (let iii = 1; iii < target.length; iii++) {
    // Allowing for missing first element in source array
    let oneCat = source[iii - 1];
    // If data expressed as array, stringify
    if (typeof oneCat === 'object') {
      oneCat = oneCat.join(' ');
    }
    // As of Aug'20, fix both source and target
    source[iii - 1] = oneCat;
    target[iii][0] = oneCat;
  }
}
// OVERLAY CATEGORIES ends
