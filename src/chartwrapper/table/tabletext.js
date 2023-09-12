import * as d3 from 'd3'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

class TableText extends Component {
  // constructor(props) {
  //   super(props);
  // }

  // COMPONENT DID MOUNT
  componentDidMount() {
    this.updateText()
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    this.updateText()
  }

  // APPEND ROW
  // Called from addTableContent to append a row tSpen to the text element
  appendRow(tableText, rowContent, config, isHeader) {
    let x = config.innerBox.x
    const contentPrefs = config.tableProperties.text.content
    x += contentPrefs.padding.left
    // Row anchor uses paragraph (leading is ignored pending further development)
    let dy = contentPrefs.paragraph
    let fill = contentPrefs.fill
    // Similarly: pending further devel, use paragraph for leading
    let leading = contentPrefs.paragraph
    if (isHeader) {
      dy = 0
    }
    const thisRow = tableText
      .append('tspan')
      .text(rowContent)
      .attr({
        x,
        dy,
        id: `table-tspan~~~fill:${fill}, leading:${leading}`,
      })
      .style({
        leading,
      })
    // Headers overwrite style, and id:fill
    if (isHeader) {
      const headPrefs = config.tableProperties.text.header
      const { size, font } = headPrefs
      fill = headPrefs.fill
      leading = headPrefs.paragraph
      thisRow.attr({ id: `table-tspan~~~fill:${fill}` }).style({
        'font-family': font,
        'font-size': `${size}px`,
        fill: config.colourLookup[fill],
        leading,
      })
    }
  }
  // APPEND ROW ends

  // ADD TABLE CONTENT
  // Called from updateText
  addTableContent(tableText, config, contentArray) {
    const cLen = contentArray.length
    for (let rowNo = 0; rowNo < cLen; rowNo++) {
      const rowText = contentArray[rowNo]
      const isHeader = rowNo === 0
      this.appendRow(tableText, rowText, config, isHeader)
    }
  }
  // ADD TABLE CONTENT ends

  // MAKE INITIAL TEXT ELEMENT
  makeInitialTextElement(config) {
    // Group
    const idName = this.props.idName
    const textGrp = d3.select(`#${idName}`)
    // Attributes:
    const textProps = config.tableProperties.text.content
    const { size, font, fill } = textProps
    // For now...
    const leading = textProps.paragraph
    const xPos = config.innerBox.x
    // NOTE: up for refinement...
    const yPos = config.innerBox.y
    const tableText = textGrp
      .append('text')
      .attr({
        x: xPos,
        y: yPos,
        id: `table-text~~~fill:${fill},justification:start,leading:${leading},width:10`,
      })
      .style({
        'font-family': font,
        'font-size': `${size}px`,
        fill: config.colourLookup[fill],
        leading,
      })
      .text('')
    return tableText
  }
  // MAKE INITIAL TEXT ELEMENT ends

  // ARRAYIFY CONTENT
  // Called from updateText. Combines header and content into
  // an array, by rows
  // NOTE: for now, items in any one row are
  // joined with '___'. Eventually, I'll create a 2D array
  arrayifyContent(config) {
    // Headers:
    // SVG doesn't recognise tabs (converts to space chars)
    // so use a string for Illy to find
    const headers = config.headers.join('___')
    // Dig out the table content
    const rawContent = config.chartData
    // This is an array of ojbects, each representing one line:
    //  {
    //   "Column one": "China",
    //   "Column 2": "Something about China",
    // }
    // What we want is a 1D array of strings
    // const contentArray = this.arrayifyContent(rawContent);
    const tableArray = rawContent.map((oneElement) => {
      const keys = Object.keys(oneElement)
      const lineArray = []
      for (const thisKey in keys) {
        lineArray.push(oneElement[keys[thisKey]])
      }
      // FIXME: this join is a temp subterfuge
      return lineArray.join('___')
    })
    // Prefix headers and return
    tableArray.unshift(headers)
    return tableArray
  }
  // ARRAYIFY CONTENT ends

  // UPDATE TEXT
  // Called upon component mount/update
  updateText() {
    const config = this.props.config
    // Assemble the complete array of data (headers and content)
    const contentArray = this.arrayifyContent(config)
    // Put the basic text element on the page
    const tableText = this.makeInitialTextElement(config)
    // Append tSpans
    this.addTableContent(tableText, config, contentArray)
  }
  // UPDATE TEXT ENDS

  // RENDER:
  render() {
    return <g className={this.props.config.className} id={this.props.idName} />
  }
}

TableText.propTypes = {
  config: PropTypes.object,
  idName: PropTypes.string,
}

export default TableText
