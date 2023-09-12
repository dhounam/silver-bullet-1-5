// Child of scales-fold-body. Handles scale factoring
// for left/right scales. As of Oct'20, this is no longer called

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ScaleFactor extends Component {
  static get defaultProps() {
    return {
      thouLen: 3,
      millLen: 6,
    };
  }

  constructor(props) {
    super(props);
    this.state = {};
    // Events
    this.handleLeftFactorChange = this.handleLeftFactorChange.bind(this);
    this.handleRightFactorChange = this.handleRightFactorChange.bind(this);
  }

  // HANDLE LEFT/RIGHT FACTOR CHANGE
  // Returns left/right factor objects as inherited in props.config,
  // with updated left/right factor...
  handleLeftFactorChange({ target: { value } }) {
    const config = this.props.config;
    const factorResult = config.values;
    factorResult.left.factor = config.factorsArray[value].value;
    factorResult.updateChart = true;
    factorResult.factorSide = 'left';
    // factorResult.left = parseInt(value, 10);
    this.props.onFactorsToScalesBody(factorResult);
  }

  handleRightFactorChange({ target: { value } }) {
    const config = this.props.config;
    const factorResult = config.values;
    factorResult.right.factor = config.factorsArray[value].value;
    factorResult.updateChart = true;
    factorResult.factorSide = 'right';
    // factorResult.right = parseInt(value, 10);
    this.props.onFactorsToScalesBody(factorResult);
  }
  // HANDLE LEFT/RIGHT FACTOR CHANGE ends

  // GET FACTORS ARRAY
  // Called from factorJsx to assemble array for dropdown
  getFactorsArray(config, isLeft) {
    const fList = config.factorsArray;
    const fArray = [fList[0]];
    let len = config.values.right.maxLen;
    if (isLeft) {
      len = config.values.left.maxLen;
    }
    if (len >= this.props.thouLen) {
      fArray.push(fList[1]);
    }
    if (len >= this.props.millLen) {
      fArray.push(fList[2]);
    }
    const factors = fArray.map((opt, index) => (
      <option key={index} value={index}>
        {opt.display}
      </option>
    ));
    return factors;
  }
  // GET FACTORS ARRAY ends

  // FACTOR-JSX
  // Called from render to assemble jsx
  factorJsx() {
    // config has 2 nodes--
    //  values: right/left factor values
    //  factorsArray: lookup of factor options
    const config = this.props.config;
    const leftFactorsList = this.getFactorsArray(config, true);
    const rightFactorsList = this.getFactorsArray(config, false);
    // Get index of inherited left/right factor
    // NOTE: I right that a for-loop is fastest? And should I
    // farm this out...?
    let leftVal = 0;
    let rightVal = 0;
    for (let iii = 0; iii < leftFactorsList.length; iii++) {
      // if (leftFactorsList[iii].props.value === config.left) {
      if (config.factorsArray[iii].value === config.values.left.factor) {
        leftVal = iii;
        break;
      }
    }
    for (let iii = 0; iii < rightFactorsList.length; iii++) {
      // if (rightFactorsList[iii].props.value === config.right) {
      if (config.factorsArray[iii].value === config.values.right.factor) {
        rightVal = iii;
        break;
      }
    }
    // Class en/disable, and label
    const leftLabel = config.values.left.label;
    let rowLeftClass = 'factors-row';
    let rowRightClass = 'factors-row';
    let leftClassName = 'dropdown factor-left-dropdown';
    if (!config.values.left.enable) {
      leftClassName = `${leftClassName} dropdown-disabled`;
      rowLeftClass = `${rowLeftClass} disabled`;
    }
    const rightLabel = config.values.right.label;
    let rightClassName = 'dropdown factor-right-dropdown';
    if (!config.values.right.enable) {
      rightClassName = `${rightClassName} dropdown-disabled`;
      rowRightClass = `${rowRightClass} disabled`;
    }
    return (
      <div className="scales-factor-div">
        <div className="silver-label factor-label">Factor</div>

        <div className="factors-list">
          <div className={rowLeftClass}>
            <div>{leftLabel}</div>
            <select
              className={leftClassName}
              value={leftVal}
              onChange={this.handleLeftFactorChange}
              required
            >
              {leftFactorsList}
            </select>
          </div>

          <div className={rowRightClass}>
            <div>{rightLabel}</div>
            <select
              className={rightClassName}
              value={rightVal}
              onChange={this.handleRightFactorChange}
              required
            >
              {rightFactorsList}
            </select>
          </div>
        </div>
      </div>
    );
  }
  // FACTOR-JSX ends

  // RENDER
  render() {
    return this.factorJsx();
  }
}

ScaleFactor.propTypes = {
  thouLen: PropTypes.number,
  millLen: PropTypes.number,
  config: PropTypes.object,
  onFactorsToScalesBody: PropTypes.func,
};

export default ScaleFactor;
