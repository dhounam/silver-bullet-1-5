/*  Functions to triage and refine raw data
    Top level fcn unpickData is called from:
      - MonteuxImport.unpickRawData
      - DataTemp.processNewData
*/

import * as CategoryUtils from './category-utilities';
import * as DateCheckUtils from './datecheck-utilities';
import * as DupUtils from './duplicate-utilities';

// CONVERT TSV TO ARRAY
// Called from unpickData to convert raw TSV data string to
// array of arrays. Arg is the raw TSV data string
// No validation: just TSV to array...
export function convertTsvToArray(tsv) {
  // Convert tsv to an array of strings (element=row)
  const dataArray = tsv.split(/\r?\n/);
  // Turn each 'row' into an array:
  for (let rNo = 0; rNo < dataArray.length; rNo++) {
    // Original tsv/array convertor checked string length to trap empty rows:
    // if (dataArray[rNo].trim().length < 1) {
    //   dataObj.isValid = false;
    //   dataObj.validityMsg = `Row ${ rNo + 1 } of data is blank...`;
    //   return dataObj;
    // }
    dataArray[rNo] = dataArray[rNo].split(/\t/);
  }
  return dataArray;
}
// CONVERT TSV TO ARRAY

// CHECK ALL VALS ARE NUMBERS
// Called from validateDataArray. If non-numeric val
// is found, returns location -- unless it's a
// comma-separated value, in which case: fix
export function checkAllValsAreNumbers(dArray) {
  const result = {
    badVal: false,
    row: 0,
    column: 0,
  };
  // Arg is complete data array
  // Count headers for consistency check
  const headCount = dArray[0].length;
  // Ignore headers and categories
  for (let rNo = 1; rNo < dArray.length; rNo++) {
    const oneRow = dArray[rNo];
    const rowLen = oneRow.length;
    // Make good any missing values at end of row
    // (Necessary for thermometers, which will 'zero' undefined data points)
    if (rowLen < headCount) {
      for (let iii = rowLen; iii < headCount; iii++) {
        oneRow.push('');
      }
    }
    for (let cNo = 1; cNo < rowLen; cNo++) {
      // (Empty cells evaluate as numbers)
      const rawVal = oneRow[cNo];
      const noCommaVal = rawVal.replace(/,/g, '');
      // If, without commas, it's NaN... don't hang about
      if (isNaN(noCommaVal)) {
        result.badVal = true;
        result.row = rNo + 1;
        result.column = cNo + 1;
        break;
      } else if (rawVal.includes(',')) {
        // It IS a number, but comma-sep'd -- fix
        oneRow[cNo] = noCommaVal;
      }
    }
  }
  return result;
}
// CHECK ALL VALS ARE NUMBERS ends

// ENOUGH ROWS AND COLUMNS
// Called from validateDataArray to verify that we've at least 2 rows of data, and
// that top row has at least 2 cols. Update dataObj by ref.
export function enoughRowsAndColumns(dArray, dObj) {
  // Number of rows; number of cols in row 1
  const rLen = dArray.length;
  const cLen = dArray[0].length;
  // Minimum 2 rows:
  if (rLen < 2) {
    dObj.isValid = false;
    dObj.validityMsg = 'data must consist of at least 2 rows.';
  } else if (cLen < 2) {
    dObj.isValid = false;
    dObj.validityMsg = 'data must consist of at least 2 columns';
  }
}
// ENOUGH ROWS AND COLUMNS ends

// MAKE DEFAULT DATA OBJECT
// Called from validateDataArray
// As of Jan'21 there are 2 flags:
//    isValid: if false, processing stops
//    isProblematic: if true, data processing proceeds, but alert displays
export function makeDefaultDataObject() {
  return {
    dataArray: [],
    isValid: true,
    isProblematic: false,
    validityMsg: '',
    isTable: false,
  };
}
// MAKE DEFAULT DATA OBJECT ends

// TOP ROW OF DATA PROBLEMATIC CHECK
// Called from validateDataArray. This is a non-fatal check that
// cell A1 is empty; and that other cells in top data row aren't numbers
export function topRowOfDataProblematicCheck(hArray, dObj) {
  // First element (cell A1) should be empty
  // if (hArray[0].trim().length > 0) {
  //   dObj.isProblematic = true;
  //   dObj.validityMsg =
  //     'cell A1 of data sheet should be empty, consistent with header row...';
  //   return;
  // }
  // Subsequent headers shouldn't ALL be numbers
  const checkHeads = (head, hNo) => {
    let result = true;
    if (hNo > 0 && !isNaN(head)) {
      result = false;
    }
    return result;
  };
  const noNumberHeads = hArray.every(checkHeads);
  if (!noNumberHeads) {
    dObj.isProblematic = true;
    dObj.validityMsg = 'your series header names include numbers. Is this OK?';
  }
}
// TOP ROW OF DATA PROBLEMATIC CHECK ends

// VALIDATE DATA ARRAY
// Called from unpickData. Runs simple validity checks
// on the array...
export function validateDataArray(dArray) {
  // Object to return:
  const dataObj = makeDefaultDataObject();
  // First, very basic data validity check: have
  // we enough rows and columns?
  enoughRowsAndColumns(dArray, dataObj);
  if (!dataObj.isValid) {
    return dataObj;
  }
  // Check there are no duplicate headers in 1st row
  const arrayOfDups = DupUtils.dupsInArray(dArray[0]);
  if (arrayOfDups.length > 0) {
    const dupString = arrayOfDups[0].string;
    // const dupIndex = `A${+arrayOfDups[0].index + 2}`;
    dataObj.isValid = false;
    dataObj.validityMsg = `the header ${dupString} appears more than once. Header names must be unique.`;
    return dataObj;
  }
  // Check that all *values* are numbers
  const badValObj = checkAllValsAreNumbers(dArray);
  // If vals aren't all numbers, the assumption is that it's a table.
  // I'm setting the 'bad value' flag; but it may never be used...
  if (badValObj.badVal) {
    dataObj.validityMsg = `data in row ${badValObj.row},
      column ${badValObj.column} is not valid for this chart type.`;
    dataObj.isTable = true;
  }
  // Check for a non-fatal error where user has omitted headers,
  // causing Sibyl to treat top row of datasheet as headers...
  topRowOfDataProblematicCheck(dArray[0], dataObj);
  // So we have enough data; headers are unique;
  // and all values are numbers, or this is a table
  dataObj.dataArray = dArray;
  return dataObj;
}
// VALIDATE DATA ARRAY ends

// ARRAYIFY DATA
// Called from unpickData to force data to cloned array
export function arrayifyData(myData) {
  // If data are TSV, I have to arrayify
  let dataArray = [];
  if (typeof myData === 'string') {
    dataArray = convertTsvToArray(myData);
  } else {
    dataArray = JSON.parse(JSON.stringify(myData));
  }
  return dataArray;
}
// ARRAYIFY DATA ends

// UNPICK DATA
// Top-level handler.
// Called from DataTemp.processNewData and MonteuxImport.unpickRawData
// Args are:
//    - the raw data for one panel (as either TSV or an array)
//    - an object containing any prefs I need from DPs (currently timeformats and dayInMs)
export function unpickData(myData, dataPrefs) {
  // Ensure data are a 2D array (rows / columns)
  const dataArray = arrayifyData(myData);
  // Check basic integrity... and whether data are compatible with
  // a chart, rather than a table (in which case, flag 'isTable' = true).
  const dataObj = validateDataArray(dataArray);
  if (!dataObj.isValid) {
    // Return irredeemably bad data now, with the error message:
    return dataObj;
  }
  // Data are in array form and (in theory) structurally OK
  // Isolate headers:
  dataObj.headers = dataObj.dataArray[0];
  // Isolate and unpick categories
  const catArray = CategoryUtils.isolateCategories(dataObj.dataArray);
  // Category time formatting:
  if (dataObj.isTable) {
    dataObj.categoryType = 'string';
  } else {
    const triagedCatObj = CategoryUtils.triageCategories(
      catArray,
      dataPrefs.timeFormats,
      dataPrefs.dayInMilliSeconds,
    );
    // triagedCatObj has props:
    //    catArray: array of categories, dates as dd Mmmm yyyy
    //    categoryType, timeFormats, yearsAdjustedBy, catError
    // Bale out if there was a category error:
    // NOTE: I might report back a more specific category error message...
    if (triagedCatObj.catError) {
      return { isValid: false, validityMsg: triagedCatObj.validityMsg };
    }
    dataObj.categories = triagedCatObj.catArray;
    dataObj.timeFormats = Object.assign({}, triagedCatObj.timeFormats);
    dataObj.categoryType = triagedCatObj.categoryType;
    dataObj.yearsAdjustedBy = triagedCatObj.yearsAdjustedBy;
    // Overwrite cats in data array with reformatted cats
    if (dataObj.categoryType.includes('time')) {
      // Time-based categories: reset the categories in the data array
      // to triaged version
      CategoryUtils.overlayCategories(dataObj.categories, dataObj.dataArray);
      // If data are weekly, interpolate days
      // Comm'd out, May'20. Leave weeks alone!
      // if (dataObj.timeFormats.interval === 'weeks') {
      //   interpolateWeekdays(dataObj);
      // }
    }
    // dataObj has props:
    //    categories (array of cats only)
    //    categoryType
    //    dataArray (2D array of data)
    //    headers
    //    isValid & validityMsg
    //    timeFormats (things D3 needs to know to draw axis)
    //    yearsAdjustedBy (for dates pre-1000)
  }
  return dataObj;
}
// UNPICK DATA ends

// INTERPOLATE WEEKDAYS
// Called from unpickData to convert arrays of categories and data-values from
// weekly to daily interval.
// NOTE: no longer called, but retained for possible future utility
export function interpolateWeekdays(dataObj) {
  const catArray = dataObj.categories;
  const dataArray = dataObj.dataArray;
  const dLen = catArray.length;
  // First and last dates in ms
  const firstDay = Date.parse(dataObj.categories[0]);
  const lastDay = Date.parse(dataObj.categories[dLen - 1]);
  const oneDay = 1000 * 60 * 60 * 24;
  // Daily arrays:
  const dailyCategories = [];
  // Data array seeded with headers
  const dailyDataArray = [dataArray[0]];
  // How many values per 'row'? (I.e. series)
  const valCount = dailyDataArray[0].length - 1;
  // Loop by days
  for (let dayVal = firstDay; dayVal <= lastDay; dayVal += oneDay) {
    const dayDate = new Date(dayVal);
    // Unambiguous dd Mmm yyyy
    // NOTE: can I guarantee this, though...?
    let dStr = dayDate.getDate();
    dStr = `${dStr} ${DateCheckUtils.getMonthList(false)[dayDate.getMonth()]}`;
    dStr = `${dStr} ${dayDate.getFullYear()}`;
    // Build up array of categories (just dates)
    // (There's duplication of category and data arrays)
    dailyCategories.push(dStr);
    // Does date exist in original dataArray? If so use it; otherwise create a 'blank'
    const dPoint = dataArray.find(pt => Date.parse(pt[0]) === Date.parse(dStr));
    if (typeof dPoint === 'undefined') {
      const ptArray = [dStr];
      // Blank values
      for (let valNo = 0; valNo < valCount; valNo++) {
        ptArray.push('');
      }
      dailyDataArray.push(ptArray);
    } else {
      dailyDataArray.push(dPoint);
    }
  }
  // Update the data object
  dataObj.categories = dailyCategories;
  dataObj.dataArray = dailyDataArray;
  // Update timeFormats
  dataObj.timeFormats.dayCount = 1;
  dataObj.timeFormats.increment = 1;
  dataObj.timeFormats.interval = 'days';
}
// INTERPOLATE WEEKDAYS ends
