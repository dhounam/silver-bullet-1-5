// Function dupsInArray is called to check for duplicate
// header and category strings

// FIND DUP IN ARRAY
// Called from dupsInArray. Returns an array of dups (string and index)
export function findDupIndex(dArray) {
  const duplicate = dArray.reduce((acc, currentValue, index, array) => {
    if (array.indexOf(currentValue) !== index && !acc.includes(currentValue)) {
      acc.push({
        string: currentValue,
        index,
      });
    }
    return acc;
  }, []);
  return duplicate;
}
// FIND DUP IN ARRAY ends

// DUPS IN ARRAY
// Called from RawDataUtils.validateDataArray to flag duplicate series headers
// And from CategoryUtils.validateCategories to flag duplicate category strings
// Returns array of duplicates (string and index)
export function dupsInArray(hArray) {
  const originalLen = hArray.length;
  const strippedLen = Array.from(new Set(hArray)).length;
  let dups = [];
  if (strippedLen < originalLen) {
    dups = findDupIndex(hArray);
  }
  return dups;
}
// DUPS IN ARRAY ends
