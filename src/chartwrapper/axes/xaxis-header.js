// Shared by xaxis-linear and -ordinal

import * as d3 from 'd3'
import * as TextWrapping from '../chartside-utilities/text-wrapping'
import * as ChartUtils from '../chart-utilities'

// UPDATE X-AXIS HEADER
// Called from each caller's componentDidMount and componentDidUpdate
// Args are the caller's 'this' (for post-text-wrapping)
// and config
export function updateXaxisHeader(globalThis, config) {
  const chartIndex = config.chartIndex
  // Context: ticks group
  const headId = `xaxis-header-group-${chartIndex}`
  const headGroup = d3.select(`#${headId}`)
  const headString = config.header
  // No width testing... but NOTE: I may have to revisit
  // Object to pass to wrapText
  const wtConfig = {
    wWidth: config.bounds.width,
    forceTurn: config.forceTurn,
  }
  const hPrefs = config.textPrefs.header
  const anchor = hPrefs.anchor
  // Aug'19: coming at header y-pos from a different angle,
  // relating it to label positions
  // Remember: space has transformed, so we start from zero
  let xPos = 0
  xPos += config.bounds.width / 2
  // For y, zero is top of innerbox
  let yPos = 0
  if (config.orient === 'bottom') {
    // To bottom of chart:
    yPos += config.bounds.height
    // Labels:
    let yPadding = config.textPrefs.padding.axisAtBottom.default
    // But padding is different for broken scatters
    if (
      config.chartType.includes('scatter') &&
      config.breakScaleObj.scatterYaxisBreaks
    ) {
      yPadding = config.textPrefs.padding.axisAtBottom.brokenScatter
    }
    yPos += yPadding
    // If this is an ordinal scale (i.e. dates are possible)...
    if (typeof config.granularity !== 'undefined') {
      if (config.categoryType === 'string') {
        // Adjust for multiline axis labels
        // Would this be better calc'd from the source up?
        // Who knows...?
        yPos += adjustHeadYposForTurnedLabels(yPos, config)
      } else if (
        config.granularity.primary.showLabel &&
        config.hasSecondaryAxis
      ) {
        // If the 1ry axis shows labels AND there's a row of 2ry
        // axis labels, drop the header an extra row...
        yPos += config.textPrefs.rowheight
      }
    }
    // Actual header:
    yPos += hPrefs.margin
  } else {
    yPos -= config.textPrefs.rowheight
    yPos -= hPrefs.margin
  }
  const headArray = [{ content: headString }]
  const boundHead = headGroup.selectAll('text').data(headArray)
  boundHead.enter().append('text')
  boundHead
    .attr({
      class: 'xaxis-header',
      x: xPos,
      y: yPos,
      id: (ddd, iii) => {
        const id = `xaxis-header-${iii}`
        const fill = hPrefs.fill
        const justification = anchor
        const leading = hPrefs.leading
        const tID = ChartUtils.getTextID(id, fill, justification, leading)
        return tID
      },
      leading: hPrefs.leading,
    })
    .style({
      fill: config.textPrefs.fillValue,
      'font-family': hPrefs.font,
      'font-size': `${hPrefs.size}px`,
      'text-anchor': anchor,
    })
    .text((ddd) => ddd.content)

  // Text wrapping (no callback)
  boundHead.call(TextWrapping.wrapAllTextElements, wtConfig, globalThis)

  boundHead.exit().remove()
}
// UPDATE X-AXIS HEADER ends

// GET X-AXIS HEADER MARGIN
// Called from doStringTests to get depth of margin
// for any header. String will NOT autowrap.
export function getXaxisHeaderMargin(config) {
  const header = config.header
  const forceTurn = config.forceTurn
  let margin = 0
  if (header.length > 0) {
    margin += config.textPrefs.header.margin
    // More than one line? Add leading.
    const extraLines = header.split(forceTurn).length - 1
    margin += extraLines * config.textPrefs.header.leading
  }
  return margin
}
// GET X-AXIS HEADER MARGIN ends

// ADJUST HEAD Y-POS FOR TURNED LABELS
// Called from updateXaxisHeader. Finds max number of turned
// lines in axis headers and returns adjustment for axis header
export function adjustHeadYposForTurnedLabels(yPos, config) {
  let lineCount = 0
  const rx = /<br>/g
  const catArray = config.categories
  for (const cat in catArray) {
    const matchArray = catArray[cat].match(rx)
    if (matchArray !== null) {
      lineCount = Math.max(matchArray.length, lineCount)
    }
  }
  return lineCount * config.textPrefs.leading
}
// ADJUST HEAD Y-POS FOR TURNED LABELS ends
