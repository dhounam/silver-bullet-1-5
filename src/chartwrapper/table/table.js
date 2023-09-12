// NOTE: while I'm messing around...
// /* eslint-disable no-unused-vars */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TableText from './tabletext'
import TableRules from './tablerules'
import TableFills from './tablefills'

class SilverTable extends Component {
  render() {
    const config = this.props.config
    const chartIndex = config.chartIndex
    // Name parent group:
    const outerId = `table-outer-group-${chartIndex}`
    const textId = `table-text-group-${chartIndex}`
    const rulesId = `table-rules-group-${chartIndex}`
    const fillsId = `table-fills-group-${chartIndex}`
    const tableTextJsx = <TableText config={config} idName={textId} />
    const tableRulesJsx = <TableRules config={config} idName={rulesId} />
    const tableFillsJsx = <TableFills config={config} idName={fillsId} />

    // const { width, height, x, y } = this.props.config.innerBox;
    // NOTE: I can draw a temporary 'inner box'
    // so I can see what I've got...
    // const rectStyle = {
    //   fill: '#aa5',
    //   width,
    //   height,
    //   x,
    //   y,
    //   opacity: 0.25,
    // };
    // If comm'd in, next moves down to top of JSX
    // <rect style={rectStyle} />

    // <g className="table-fills" id={fillsId}>
    //   {tableFillsJsx}
    // </g>

    const chartComponentsJSX = (
      <g className="outer-table-group" id={outerId}>
        {tableFillsJsx}
        {tableRulesJsx}
        {tableTextJsx}
      </g>
    )
    return chartComponentsJSX
  }
}

SilverTable.propTypes = {
  config: PropTypes.object.isRequired,
}

export default SilverTable