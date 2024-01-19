import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

class TableFills extends Component {
  // COMPONENT DID MOUNT
  componentDidMount() {
    this.updateSeparators()
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    this.updateSeparators()
  }

  // GET CONTENT HEIGHT
  getContentHeight(config) {
    const contentLength = config.chartData.length
    const linespacing = config.tableProperties.text.content.paragraph
    return contentLength * linespacing
  }
  // GET CONTENT HEIGHT ends

  // APPEND RULE
  appendRule(rProps, rGrp) {
    rGrp
      .append('line')
      .attr({
        class: 'separator-rule',
        x1: rProps.x1,
        x2: rProps.x2,
        y1: rProps.y,
        y2: rProps.y,
        id: `${rProps.id}~~~stroke:${rProps.strokeName}`,
      })
      .style({
        'stroke-width': rProps.strokeWidth,
        stroke: rProps.stroke,
      })
  }
  // APPEND RULE ends

  // APPEND FILL
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
  // APPEND FILL ends

  // DRAW RULES
  drawRules(config, rulesGrp) {
    // Number of rows
    const cLen = config.chartData.length
    // From top of inner box (header baseline)
    const topY = config.innerBox.y
    const height = config.tableProperties.text.content.paragraph
    const sepProps = config.tableProperties.separators
    const strokeName = sepProps.strokeName
    const stroke = config.colourLookup[strokeName]
    const strokeWidth = sepProps.strokeWidth
    const belowText = sepProps.belowText
    const ruleProps = {
      x1: config.innerBox.x,
      x2: config.innerBox.x + config.innerBox.width,
      y: topY,
      stroke,
      strokeName,
      strokeWidth,
      belowText,
    }
    for (let rowNo = 0; rowNo < cLen; rowNo++) {
      ruleProps.y = topY + rowNo * height + belowText
      this.appendRule(ruleProps, rulesGrp)
    }
  }
  // DRAW RULES ends

  // DRAW FILLS
  drawFills(config, fillsGrp) {
    // Number of rows
    const cLen = config.chartData.length
    // From top of inner box (header baseline)
    const topY = config.innerBox.y
    const height = config.tableProperties.text.content.paragraph
    const fillName = config.tableProperties.separators.fill
    const fill = config.colourLookup[fillName]
    const belowText = config.tableProperties.separators.belowText
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
  // DRAW FILLS ends

  // UPDATE SEPARATORS
  // Determines: alternate-fills or rules
  updateSeparators() {
    const config = this.props.config
    // Group
    const idName = this.props.idName
    const separatorsGrp = d3.select(`#${idName}`)
    if (config.tableProperties.separators.drawFills) {
      this.drawFills(config, separatorsGrp)
    } else {
      this.drawRules(config, separatorsGrp)
    }
  }
  // UPDATE SEPARATORS ends

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
