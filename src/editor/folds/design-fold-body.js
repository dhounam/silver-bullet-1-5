import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ChartType from './bodyparts/chart-type';
import Blobs from './bodyparts/blobs';
import Legend from './bodyparts/legend';

class DesignFoldBody extends Component {
  // *** REACT LIFECYCLE STUFF ***

  // CONSTRUCTOR
  // Sets up the various event listeners...
  // ...and the global value-container
  constructor(props) {
    super(props);
    // Component is stateless
    this.state = {
      // updateEditor: false,
    };
    // Events
    this.handleChartTypeChange = this.handleChartTypeChange.bind(this);
    this.handleBlobChange = this.handleBlobChange.bind(this);
    this.handleLegendChange = this.handleLegendChange.bind(this);
  }
  // CONSTRUCTOR ends

  // HANDLE CHART TYPE CHANGE
  handleChartTypeChange(vals) {
    this.props.onValuesToFoldsWrapper(vals);
  }
  // HANDLE CHART TYPE CHANGE ends

  // HANDLE BLOB CHANGE
  handleBlobChange(vals) {
    this.props.onValuesToFoldsWrapper(vals);
  }
  // HANDLE BLOB CHANGE ends

  // HANDLE LEGEND CHANGE
  handleLegendChange(vals) {
    this.props.onValuesToFoldsWrapper(vals);
  }
  // HANDLE LEGEND CHANGE ends

  // *** REACT LIFECYCLE STUFF ENDS ***

  // DESIGN BODY JSX
  // Calls sub-functions to construct individual elements and clusters
  designBodyJsx() {
    let { chartType, legend, blobs } = this.props.config;
    return (
      <div className="fold-body">
        <ChartType
          config={chartType}
          onValuesToDesignBody={this.handleChartTypeChange}
        />
        <Legend
          config={legend}
          onValuesToDesignBody={this.handleLegendChange}
        />
        <Blobs
          config={blobs}
          onValuesToDesignBody={this.handleBlobChange}
        />
      </div>
    );
  }
  // DESIGN BODY JSX ends

  // RENDER
  render() {
    return this.designBodyJsx();
  }
}

DesignFoldBody.propTypes = {
  config: PropTypes.object,
  // Callback of returned values
  onValuesToFoldsWrapper: PropTypes.func,
};

export default DesignFoldBody;
