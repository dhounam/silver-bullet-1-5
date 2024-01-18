import * as d3 from 'd3'

// UPDATE NUMBER BOX
// Called from Background.callNumberBox. This one's
// cheap and cheerful...
export function updateNumberBox(config, bgName) {
  const backgroundGroup = d3.select(bgName)
  // Remove existing
  backgroundGroup.select('.numberbox-group').remove()
  const nbData = []
  const nbVal = config.background.strings.numberBox.content
  // Exclude empty string, pass numbers and '?'
  // (also trapped in numberbox-editor)
  let valIsGood = false
  if (nbVal.toString().length > 0) {
    if (nbVal === '?' || !isNaN(nbVal)) {
      valIsGood = true
    }
  }
  if (valIsGood) {
    nbData.push(config.background.strings.numberBox)
    const nbGroup = backgroundGroup.selectAll('.numberbox-group').data(nbData)
    nbGroup
      .enter()
      .append('g')
      .attr({
        id: 'numberbox-group',
        class: 'numberbox-group',
      })
    const nbRect = nbGroup.append('rect')
    const nbNumber = nbGroup.append('text')
    updateRect(nbRect, config)
    updateNumber(nbNumber, config)
  }
}
// UPDATE NUMBER BOX ends

// UPDATE RECT
export function updateRect(nbRect, config) {
  const nbProps = config.background.strings.numberBox
  const dimensions = config.background.outerbox.dimensions
  const rectStrokeColour = nbProps.rectstroke
  console.log(rectStrokeColour);
  nbRect
    .style({
      // Stroke added Jan'24
      // Colour returned whether stroked or not
      stroke: config.metadata.colours[rectStrokeColour],
      'stroke-width': nbProps.rectstrokewidth,
      fill: () => {
        const fillName = nbProps.rectfill
        return config.metadata.colours[fillName]
      },
    })
    .attr({
      x: dimensions.width - nbProps.x - nbProps.rectwidth,
      y: nbProps.y,
      width: nbProps.rectwidth,
      height: nbProps.rectheight,
      id: () => {
        let id = 'chartnumber-rect~~~'
        id = `${id}fill:${nbProps.rectfill}`
        return id
      },
    })
}
// UPDATE RECT ends

// UPDATE NUMBER
export function updateNumber(nbNumber, config) {
  const nbProps = config.background.strings.numberBox
  const dimensions = config.background.outerbox.dimensions
  const emVal = config.metadata.emVal
  nbNumber
    .text((ddd) => {
      return ddd.content
    })
    .style({
      fill: () => {
        const fillName = nbProps.textfill
        return config.metadata.colours[fillName]
      },
      'font-family': nbProps.font,
      'font-size': nbProps.fontsize,
      'text-anchor': nbProps.anchor,
    })
    .attr({
      x: dimensions.width - nbProps.x - nbProps.rectwidth / 2,
      y: () => {
        // Y anchor point is halfway down the rect,
        // then half font-size
        let yPos = nbProps.y + nbProps.rectheight / 2
        yPos += (nbProps.fontsize * emVal) / 2
        return yPos
      },
      id: () => {
        // Text needs just'n and fill (width, see below)
        let id = 'chartnumber-text~~~justification:center,'
        id = `${id}fill:${nbProps.textfill}`
        return id
      },
    })
}
// UPDATE NUMBER ends
