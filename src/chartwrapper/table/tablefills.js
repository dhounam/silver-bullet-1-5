import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

class TableFills extends Component {
  // constructor(props) {
  //   super(props);
  // }

  // COMPONENT DID MOUNT
  componentDidMount() {
    this.updateFills()
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    this.updateFills()
  }

  getContentHeight(config) {
    const contentLength = config.chartData.length
    const linespacing = config.tableProperties.text.content.paragraph
    return contentLength * linespacing
  }

  drawRule(rProps, rGrp) {
    rGrp
      .append('line')
      .attr({
        class: 'top-rule',
        x1: rProps.x1,
        x2: rProps.x2,
        y1: rProps.y,
        y2: rProps.y,
        id: `${rProps.id}~~~stroke:${rProps.stroke}`,
      })
      .style({
        'stroke-width': rProps.width,
        stroke: rProps.stroke,
      })
  }

  prepareTopRule(config, rGrp) {
    const rPrefs = config.tableProperties.rules.top
    const iBox = config.innerBox
    const x1 = iBox.x
    const x2 = x1 + iBox.width
    const y = iBox.y + rPrefs.belowText
    const rProps = {
      x1,
      x2,
      y,
      width: rPrefs.width,
      strokeName: rPrefs.stroke,
      stroke: config.colourLookup[rPrefs.stroke],
      id: 'table-top-rule',
    }
    this.drawRule(rProps, rGrp)
  }

  prepareBottomRule(config, rGrp) {
    const rPrefs = config.tableProperties.rules.bottom
    const iBox = config.innerBox
    const x1 = iBox.x
    const x2 = x1 + iBox.width
    let y = iBox.y + this.getContentHeight(config)
    y += rPrefs.belowText
    const rProps = {
      x1,
      x2,
      y,
      width: rPrefs.width,
      strokeName: rPrefs.stroke,
      stroke: config.colourLookup[rPrefs.stroke],
      id: 'table-bottom-rule',
    }
    this.drawRule(rProps, rGrp)
  }

  appendFill(fGrp, fProps) {
    fGrp.append('rect').attr({
      x: fProps.x,
      y: fProps.y,
      width: fProps.width,
      height: fProps.height,
      fill: fProps.fill,
      id: `table-tint~~~fill:${fProps.fillName}`,
    })
  }

  drawFills(config, fillsGrp) {
    // Number of rows
    const cLen = config.chartData.length
    // From top of inner box (header baseline)
    const topY = config.innerBox.y
    const height = config.tableProperties.text.content.paragraph
    const fillName = config.tableProperties.tint.fill
    const fill = config.colourLookup[fillName]
    const belowText = config.tableProperties.tint.belowText
    const rectProps = {
      x: config.innerBox.x,
      y: topY,
      width: config.innerBox.width,
      height,
      fill,
      fillName,
      belowText,
    }
    for (let rowNo = 0; rowNo < cLen; rowNo++) {
      if (rowNo % 2 === 0) {
        rectProps.y = topY + rowNo * height + belowText
        this.appendFill(fillsGrp, rectProps)
      }
    }
  }

  // UPDATE RULES
  updateFills() {
    const config = this.props.config
    // Group
    const idName = this.props.idName
    const fillsGrp = d3.select(`#${idName}`)
    this.drawFills(config, fillsGrp)
  }
  // UPDATE RULES ends

  // RENDER:
  render() {
    return <g className={this.props.config.className} id={this.props.idName} />
  }
}

TableFills.propTypes = {
  config: PropTypes.object,
  idName: PropTypes.string,
}

export default TableFills
