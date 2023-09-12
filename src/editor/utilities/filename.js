// Filename assembly for
//      new files
//      revising existing file names (date, section or preset)

export function padNumber(number) {
  // We want 3 chars with leading zeroes
  return number.toString().padStart(3, '0');
}

export function getFileNameDate(fnObj, user) {
  const dates = fnObj.dates;
  // Notwithstanding the property name, 'datesYmd', eiu dates
  // are in yyyymm format:
  let fnDate = dates.datesYmd[dates.dateIndex];
  // Belt and braces! (But this really shouldn't be necessary)
  if (user === 'eiu') {
    fnDate = fnDate.substring(0, 6);
  }
  return fnDate;
}

// BUILD NEW FILE NAME
// Called from EditorConfigUtilities.getEdConfigFilenameProperties to assemble actual file name
export function buildNewFileName(fnObj, user) {
  // Start filename with date...
  let fileName = getFileNameDate(fnObj, user);
  // ...section...
  const sections = fnObj.sections;
  fileName = `${fileName}_${sections.list[sections.index].code}`;
  // Inferentially, for economist
  if (user === 'economist') {
    fileName = `${fileName}C`;
  }
  // Number
  let number = fnObj.number;
  if (typeof number === 'undefined') {
    number = 0;
  }
  // 3 chars with leading zeroes
  number = padNumber(number);
  return `${fileName}${number}`;
}
// BUILD NEW FILE NAME ends

// ISOLATE FILE NUMBER
// Called from updateFileName to extract existing file number from name.
// Failsafe lest number wasn't in payload. This should only get called,
// I think, if the data originated in the Advanced tab's text field
export function isolateFileNumber(fnObj) {
  const fName = fnObj.name;
  let fNum = '000';
  if (typeof fName !== 'undefined') {
    // Last 3 charts of existing filename
    const mark = fName.length - 3;
    fNum = fName.substring(mark);
  }
  return fNum;
}
// ISOLATE FILE NUMBER ends

// GET FILENAME SECTION ID
// Called from updateFileName, and from Editor.getSectionIdForNewPreset
// Extracts section id from filename (e.g. 'BR' from 20191012_BRC252)
// NOTE: this may need to mod to allow for codes longer than 2 chars, and
// for Economist 'C' suffix
export function getFilenameSectionId(fName) {
  const fArray = fName.split('_');
  const id = fArray[1].slice(0, 2);
  return id;
}
// GET FILENAME SECTION ID ends

// UPDATE FILE NAME
// Called from Editor.handlesValuesFromFooter to update file name,
// retaining existing counter value. Params are the filename
// definitions object from editorConfig; the section from the footer;
// and the user (economist/eiu)
export function updateFileName(fnObj, sectionId, user) {
  // Start filename with date...
  let fileName = getFileNameDate(fnObj, user);
  // If a section id was passed, use it; otherwise keep existing section
  if (typeof sectionId === 'undefined') {
    // NOTE: I need to change the subhandler for eiu,
    // if it gets codes longer than 2 chars
    sectionId = getFilenameSectionId(fnObj.name);
  }
  // Date + section
  fileName = `${fileName}_${sectionId}`;
  // Economist adds 'C':
  if (user === 'economist') {
    fileName = `${fileName}C`;
  }
  // File number
  let fNum = fnObj.number;
  if (typeof fNum === 'undefined') {
    fNum = isolateFileNumber(fnObj);
  } else {
    fNum = padNumber(fNum);
  }
  return `${fileName}${fNum}`;
}
// UPDATE FILE NAME ends
