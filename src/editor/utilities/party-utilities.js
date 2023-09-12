// Called from EditorConfigUtils for custom UK and US party colours

// PASS PARTY COLOURS FLAG TO CONFIG OBJECT
// Called from EditorConfigUtils.reconcileEdConfiganelSeriesToConfig
// Legends check 2 flags to determine whether key strings
// should be set to party colours.
// NOTE: For now (Nov'19) I'm forcing OFF.
export function passPartyColoursFlagToConfigObject(
  configSeries,
  // eslint-disable-next-line no-unused-vars
  ukParties,
  // eslint-disable-next-line no-unused-vars
  usParties,
) {
  configSeries.ukParties = ukParties;
  configSeries.usParties = usParties;
  // configSeries.ukParties = false;
  // configSeries.usParties = false;
}
// PASS PARTY COLOURS FLAG TO CONFIG OBJECT ends

// CHECK FOR PARTIES
// Called from EditorConfigUtils.reconcileEdConfigPanelSeriesToConfig to check
// for party names in series headers
export function checkForParties(headers, isUK) {
  // I need headers as a single string, losing cats header and making all lower case
  const myHeaders = [...headers];
  myHeaders.shift();
  const hString = myHeaders.join(',').toLowerCase();
  let target = 2;
  let testArray = ['republican', 'democrat'];
  if (isUK) {
    target = 3;
    // 'lib' to cover 'liberal' and 'libdem'
    testArray = ['conservative', 'labour', 'lib'];
  }
  // Search for party names in headers string
  // If there's just *one* occurence of each of the party names,
  // we're good to go with party colours
  let partyTest = 0;
  for (let pNo = 0; pNo < testArray.length; pNo++) {
    const regex = new RegExp(testArray[pNo], 'g');
    const matches = (hString.match(regex) || []).length;
    if (matches === 1) {
      // if (hString.includes(testArray[pNo])) {
      partyTest++;
    }
  }
  // Did we get enough hits...?
  return partyTest === target;
}
// CHECK FOR PARTIES ends

// FIND PARTY IN HEADER
// Called from applyPartyColours. Searches in one header for a
// party name and, if found, returns that name
// NOTE: names in the list must match names of party colours
export function findPartyInHeader(header, isUK) {
  // List of party names (UK or US)
  let partyList = ['democrat', 'republican'];
  if (isUK) {
    partyList = [
      'conservative',
      'labour',
      'lib',
      'brexit',
      'snp',
      'ukip',
      'green',
      'plaid',
      'other',
    ];
  }
  let result = '';
  // Loop through all party names looking for a hit in this header
  // NOTE: is there a more efficient way of doing this?
  for (let pNo = 0; pNo < partyList.length; pNo++) {
    const pName = partyList[pNo];
    if (header.includes(pName)) {
      result = pName;
      break;
    }
  }
  return result;
}
// FIND PARTY IN HEADER ends

// APPLY PARTY COLOURS
// Called from EditorConfigUtils.reconcileEdConfigPanelSeriesToConfig to
// overwrite default colours with party colours
// Args are the array of series colours (currently set to
// the standard defaults); array of headers; UK/US flag
export function applyPartyColours(colours, headers, isUK) {
  for (let hNo = 1; hNo < headers.length; hNo++) {
    const head = headers[hNo].toLowerCase();
    const pName = findPartyInHeader(head, isUK);
    // Overwrite colour
    if (pName.length > 0) {
      colours[hNo - 1] = pName;
    }
  }
}
// APPLY PARTY COLOURS ends
