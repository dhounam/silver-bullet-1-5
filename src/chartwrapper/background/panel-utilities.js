// Utilities called from Background

// CREATE LINE-COUNT MAX ARRAY
// Called from Background.adjustInnerBoxAndReturn
// Passed the flat array of header linecounts, it returns
// a 2D array, by rows, of max line counts
export function createLineCountMaxArray(lineCountFlatArray, rowLen) {
  const maxArray = []
  // Array nests by rows
  for (let iii = 0; iii < lineCountFlatArray.length; iii += rowLen) {
    const oneRowArray = lineCountFlatArray.slice(iii, iii + rowLen)
    const rowMax = Math.max(...oneRowArray)
    // Now push the row-max back to a flat array
    // that will (hopefully) match the complete array of IB defs...
    for (let jjj = 0; jjj < rowLen; jjj++) {
      maxArray.push(rowMax)
    }
  }
  return maxArray
}
// CREATE LINE-COUNT MAX ARRAY ends

// ADJUST ALIGNED INNER BOXES
export function adjustAlignedInnerBoxes(iBoxes, maxArray, leading) {
  const ibCount = iBoxes.length
  for (let ibx = 0; ibx < ibCount; ibx++) {
    const thisBox = iBoxes[ibx]
    // Adjust
    const tweak = (maxArray[ibx] - 1) * leading
    thisBox.y += tweak
    thisBox.height -= tweak
  }
}
// ADJUST ALIGNED INNER BOXES ends

// ADJUST NON-ALIGNED INNER BOXES
// Called from Background.adjustInnerBoxAndReturn. Adjusts each IB
// according to number of lines in panel header (does nothing about
// default padding below headers)
export function adjustNonAlignedInnerBoxes(iBoxes, pLinesArray, leading) {
  for (let ibx = 0; ibx < iBoxes.length; ibx++) {
    const iBox = iBoxes[ibx]
    // Lines * leading
    const lTweak = (pLinesArray[ibx] - 1) * leading
    iBox.y += lTweak
    iBox.height -= lTweak
  }
}
// ADJUST NON-ALIGNED INNER BOXES ends
