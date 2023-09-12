// This component originally parented double scales and indexing
// As of Apr'19, however, it remains as an emergency/dev resource
// normally hidden from view.
// To show or hide, see Editor.get defaultProps, where folds are defined
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DataTemp from './bodyparts/data-temp';
import AxisHeaders from './bodyparts/axis-headers';
import NumberBoxEditor from './bodyparts/numberbox-editor';

class AdvancedFoldBody extends Component {
  constructor(props) {
    super(props);
    // Events
    this.handleDataChange = this.handleDataChange.bind(this);
  }

  // HANDLE DATA CHANGE
  handleDataChange(vals) {
    this.props.onValuesToFoldsWrapper(vals);
  }
  // HANDLE DATA CHANGE ends

  // DOES DATA FIELD DISABLE
  // Called from advancedBodyJsx. This was originally written to determine
  // whether the paste-in data field is visible, according to context.
  // Previously disabled in Monteux versions on infographics server, but
  // visible on localhost or in standalone version.
  // As of Sep'20, the field is always visible. But I've left this function
  // in place, with forced 'return false', in case we change our minds...
  doesDataFieldDisable() {
    // const context = window.location.href;
    // let disableData = false;
    // if (
    //   context.includes('/silver-bullet/sibyl/') ||
    //   context.includes('/z-silver-bullet-test/sibyl/')
    // ) {
    //   disableData = true;
    // }
    // return disableData;
    return false;
  }
  // DOES DATA FIELD DISABLE

  makeDataTempJsx() {
    const requiredDataPrefs = this.props.config.textFieldConfig;
    const disableDataField = this.doesDataFieldDisable();
    const dataConfig = {
      disableDataField,
      requiredDataPrefs,
    };
    return (
      <DataTemp
        config={dataConfig}
        onValuesToAdvancedBody={this.handleDataChange}
      />
    );
  }

  makeAxisHeadersJsx() {
    // const { config } = this.props;
    // const updateEditor = false;
    const axisHeadersConfig = this.props.config.axisHeadersConfig;
    return (
      <AxisHeaders
        config={axisHeadersConfig}
        onValuesToAdvancedBody={this.handleDataChange}
      />
    );
  }

  makeNumberBoxJsx() {
    const numberBoxConfig = this.props.config.numberBoxConfig;
    return (
      <NumberBoxEditor
        config={numberBoxConfig}
        onValuesToAdvancedBody={this.handleDataChange}
      />
    );
  }

  // ADVANCED BODY JSX
  // Calls sub-functions to construct individual elements and clusters
  advancedBodyJsx() {
    const dataTempJsx = this.makeDataTempJsx();
    const axisHeadersJsx = this.makeAxisHeadersJsx();
    const numberBoxJsx = this.makeNumberBoxJsx();
    return (
      <div className="fold-body advanced-body">
        {dataTempJsx}
        {axisHeadersJsx}
        {numberBoxJsx}
      </div>
    );
  }
  // ADVANCED BODY JSX ends

  // RENDER
  render() {
    return this.advancedBodyJsx();
  }
}

AdvancedFoldBody.propTypes = {
  config: PropTypes.object,
  // Callback of returned data
  onValuesToFoldsWrapper: PropTypes.func,
};

export default AdvancedFoldBody;
