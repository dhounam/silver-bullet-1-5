// Utilities called from Legends and LegendSets

// CREATE ROWED ARRAY
// Called from Legends.handleLegendSetInnerBoxBounds to
// generate an array for panels, by rows
export function createRowedArray(iBoxes, rowLen) {
  const rowedArray = []
  // Array nests by rows
  for (let iii = 0; iii < iBoxes.length; iii += rowLen) {
    rowedArray.push(iBoxes.slice(iii, iii + rowLen))
  }
  return rowedArray
}
// CREATE ROWED ARRAY ends

// GET ROW MAXES ARRAY
// Args are a 'rowed' array of innerbox definitions,
// and the number of rows
export function getRowMaxesArray(rowedArray, rowLen) {
  const maxArray = []
  // Loop by rows
  for (const rNo in rowedArray) {
    const aRow = rowedArray[rNo]
    // Get the max tweak in that row
    const rowMax = Math.max(
      ...aRow.map((obj) => obj.tweak + obj.paddingBelowLegends)
    )
    // For each element in current row, push the row-max to an array
    // that should (!) match the complete array of IB defs...
    for (let iii = 0; iii < rowLen; iii++) {
      maxArray.push(rowMax)
    }
  }
  return maxArray
}
// GET ROW MAXES ARRAY

export function adjustAlignedInnerBoxes(iBoxes, maxArray) {
  const ibCount = iBoxes.length
  for (let ibx = 0; ibx < ibCount; ibx++) {
    const thisBox = iBoxes[ibx]
    // Adjust
    const tuneTweak = maxArray[ibx]
    thisBox.y += tuneTweak
    thisBox.height -= tuneTweak
  }
}

export function adjustNonAlignedInnerBoxes(iBoxes) {
  for (const ibx in iBoxes) {
    const iBox = iBoxes[ibx]
    const adjustment = iBox.tweak + iBox.paddingBelowLegends
    iBox.y += adjustment
    iBox.height -= adjustment
  }
}

/*
What's happening?
1.  Each legendset reports back, adjusts the inner box to its tweak, and marks itself 'drawn'
2.  Upon each report-back, I loop through ALL panels. 
        For each, I check for any overrides (too few series to do legends). In that case,
        I set tweak to zero and mark the box 'drawn'
3.  When all charts have been 'legended', I apply

In LegendSets.returnAdjustedInnerBox:
  default tweak = 0
  the assumption seems to be that IB.y is the set margin below the background strings
    (i.e., generally, 15pts below subtitle baseline)
  if there are internal legends
    I allow for the header -- drop IB.y by padding below header
    I count 'rows' and, for each, add to the tweak:
      the padding below a legend-row
      (rowCount - 1) * leading
            This is to allow for wrapping. For each row, I have a var, rowMaxesArray, an
            array of the max number of (wrapped) lines in each row
    Then I subtract the padding once.
  So in theory I return an adjustment for the number of legend-rows.
  If legends are external, this should be zero
  If one row, it seems to be zero
  If 2 rows, it would be padding (10)

  I'm not getting all that; and it looks to me like I'm setting some sort of default, 
  somewhere down the line. I.e., that my tweak ADDS to a default adjustment. Which, in
  turn, implies that I always make a legend adjustment that gets 'taken back'

*/
