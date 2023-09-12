// Child of advanced-fold-body. Handles double and mixed scale prefs

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class DoubleScale extends Component {
  // *** REACT LIFECYCLE ***

  // Setting mixed/double-scale chart type options here
  static get defaultProps() {
    return {
      chartTypes: ['line', 'stepline', 'pointline', 'column', 'stacked column'],
      invertedChartTypes: ['line', 'stepline', 'pointline'],
    };
  }

  constructor(props) {
    super(props);
    this.state = {};
    // Events
    this.handleSplitAfterChange = this.handleSplitAfterChange.bind(this);
    this.handleLeftTypeChange = this.handleLeftTypeChange.bind(this);
    this.handleRightTypeChange = this.handleRightTypeChange.bind(this);
    this.handleDoubleOrMixed = this.handleDoubleOrMixed.bind(this);
  }

  // *** REACT LIFECYCLE STUFF ENDS ***

  // UNPICK CHART TYPE
  // Called from alignScaleProps. Passed a chart-type index, this looks up
  // the type string in the array, then returns an editorConfig-friendly object with
  // appropriate 'type' and 'stacked' options
  // NOTE: watch this, if other chart types become 'doubleable'...
  unpickChartType(typeIndex) {
    const typeArray = this.props.chartTypes;
    const typeStr = typeArray[typeIndex];
    const typeObj = { type: '', stacked: false };
    if (typeStr === 'line') {
      typeObj.type = 'line';
    } else if (typeStr === 'stepline') {
      typeObj.type = 'stepline';
    } else if (typeStr === 'pointline') {
      typeObj.type = 'pointline';
    } else {
      typeObj.type = 'column';
    }
    if (typeStr.toLowerCase().includes('stack')) {
      typeObj.stacked = true;
    }
    return typeObj;
  }
  // UNPICK CHART TYPE ends

  // ALIGN SIDES
  // Called from alignScaleProps. If I'm changing from single to
  // mixed/double, sets the hitherto-disabled 'side' to the
  // current chart-type
  alignSides(dScale) {
    if (
      dScale.chartType.left.type === 'none' ||
      dScale.chartType.left.type === 'table'
    ) {
      dScale.chartType.left.type = dScale.chartType.right.type;
    } else if (
      dScale.chartType.right.type === 'none' ||
      dScale.chartType.right.type === 'table'
    ) {
      dScale.chartType.right.type = dScale.chartType.left.type;
    }
  }
  // ALIGN SIDES ends

  // ALIGN SCALE PROPS
  // Called from the various event handlers to assemble and send the callback
  alignScaleProps(source, val) {
    const doubleScale = this.props.config;
    const oldSplit = doubleScale.splitDataAtCol;
    if (source === 'style') {
      // Single/mixed/double
      doubleScale.scale = val;
      if (val === 'single') {
        // Force single to zero
        doubleScale.splitDataAtCol = 0;
      } else {
        // Mixed or double: min 1
        doubleScale.splitDataAtCol = Math.max(oldSplit, 1);
        // If we're changing from single to mixed/double, I need
        // to align disabled 'side'
        this.alignSides(doubleScale);
      }
    } else if (source === 'split') {
      // Changed split column
      doubleScale.splitDataAtCol = val;
    } else if (source === 'leftType') {
      doubleScale.chartType.left = this.unpickChartType(val);
    } else if (source === 'rightType') {
      doubleScale.chartType.right = this.unpickChartType(val);
    }
    doubleScale.component = 'doublescale';
    doubleScale.updateChart = true;
    this.props.onValuesToScalesBody(doubleScale);
  }
  // ALIGN SCALE PROPS ends

  // EVENT HANDLERS
  //
  handleSplitAfterChange({ target: { value } }) {
    // Add 1 to dropdown selection value to align
    const uppedVal = Number(value) + 1;
    this.alignScaleProps('split', uppedVal);
  }

  handleLeftTypeChange({ target: { value } }) {
    this.alignScaleProps('leftType', Number(value));
  }

  handleRightTypeChange({ target: { value } }) {
    this.alignScaleProps('rightType', Number(value));
  }

  handleDoubleOrMixed(e) {
    this.alignScaleProps('style', e);
  }

  //
  getSelectVal(str) {
    return this.props.chartTypes.indexOf(str);
  }

  // DOUBLE JSX
  // Called from render to assemble all JSX
  doubleJsx() {
    const scaleProps = this.props.config;
    // Over all component class:
    let componentClass = 'double-scale-div';
    if (scaleProps.disableDouble) {
      componentClass = `${componentClass} double-scale-disabled`;
    }

    // Single, mixed or double?
    const { scale } = scaleProps;
    // 'After series' dropdown
    // Default (single) is empty:
    let options = [];
    if (scale !== 'single') {
      const headArray = scaleProps.headers;
      options = headArray.map((opt, index) => (
        <option key={index} value={index}>
          {opt}
        </option>
      ));
    }
    // Chart type options are set as local props. They can be different,
    // left and right, depending upon whether scales are inverted!
    let leftArray = this.props.chartTypes;
    if (this.props.config.invert.left) {
      leftArray = this.props.invertedChartTypes;
    }
    let rightArray = this.props.chartTypes;
    if (this.props.config.invert.right) {
      rightArray = this.props.invertedChartTypes;
    }
    const leftTypes = leftArray.map((opt, index) => (
      <option key={index} value={index}>
        {opt}
      </option>
    ));
    const rightTypes = rightArray.map((opt, index) => (
      <option key={index} value={index}>
        {opt}
      </option>
    ));
    // Default selection
    // Value is indexed from zero in this component, for dropdown
    // whereas other components index from 1
    const splitAt = Math.max(scaleProps.splitDataAtCol - 1, 0);
    // Classes:
    let singleClass = 'silver-button single-button';
    let doubleClass = 'silver-button double-button';
    let mixedClass = 'silver-button mixed-button';
    let afterSeriesClass = 'dropdown double-series';

    let rowClass = 'double-scale-row';
    let leftClass = 'dropdown double-left-type';
    let rightClass = 'dropdown double-right-type';

    // Refine class-setting
    if (scale === 'double') {
      doubleClass = `${doubleClass} button-selected`;
    } else if (scale === 'mixed') {
      mixedClass = `${mixedClass} button-selected`;
    } else {
      singleClass = `${singleClass} button-selected`;
      leftClass = `${leftClass} dropdown-disabled`;
      rightClass = `${rightClass} dropdown-disabled`;
      afterSeriesClass = `${afterSeriesClass} dropdown-disabled`;
      rowClass = `${rowClass} disabled`;
    }

    // If scale is mixed or double, work out select values
    let leftVal = 0;
    let rightVal = 0;
    if (scale !== 'single') {
      let leftStr = scaleProps.chartType.left.type;
      if (scaleProps.chartType.left.stacked) {
        leftStr = `stacked ${leftStr}`;
      }
      leftVal = this.props.chartTypes.indexOf(leftStr);
      let rightStr = scaleProps.chartType.right.type;
      if (scaleProps.chartType.right.stacked) {
        rightStr = `stacked ${rightStr}`;
      }
      rightVal = this.props.chartTypes.indexOf(rightStr);
    }

    return (
      <div className={componentClass}>
        <span className="silver-label double-scale-label">Double scale</span>
        <div className="double-scale-list">
          <div className="double-scale-dropdowns">
            <div className={rowClass}>
              <span className="silver-label after-col-label">After series</span>
              <select
                className={afterSeriesClass}
                value={splitAt}
                onChange={this.handleSplitAfterChange}
                required
              >
                {options}
              </select>
            </div>
            <div className={rowClass}>
              <span className="silver-label">Left series</span>
              <select
                className={leftClass}
                value={leftVal}
                onChange={this.handleLeftTypeChange}
                required
              >
                {leftTypes}
              </select>
            </div>
            <div className={rowClass}>
              <span className="silver-label">Right series</span>
              <select
                className={rightClass}
                value={rightVal}
                onChange={this.handleRightTypeChange}
                required
              >
                {rightTypes}
              </select>
            </div>
          </div>

          <div className="double-scale-buttons">
            <button
              type="button"
              className={singleClass}
              onClick={() => this.handleDoubleOrMixed('single')}
            >
              single
            </button>
            <button
              type="button"
              className={mixedClass}
              onClick={() => this.handleDoubleOrMixed('mixed')}
            >
              mixed
            </button>
            <button
              type="button"
              className={doubleClass}
              onClick={() => this.handleDoubleOrMixed('double')}
            >
              double
            </button>
          </div>
        </div>
      </div>
    );
  }
  // DOUBLE JSX ends

  // RENDER
  render() {
    return this.doubleJsx();
  }
}

DoubleScale.propTypes = {
  config: PropTypes.object,
  chartTypes: PropTypes.array,
  invertedChartTypes: PropTypes.array,
  onValuesToScalesBody: PropTypes.func,
};

export default DoubleScale;
