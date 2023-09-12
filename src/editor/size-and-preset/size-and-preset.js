import React, { Component } from 'react';
import PropTypes from 'prop-types';
// Sub-components
import Preset from './preset';
import Size from './size';

class SizeAndPreset extends Component {
  static get defaultProps() {
    return {};
  }

  constructor(props) {
    super(props);
    this.handleValuesFromSize = this.handleValuesFromSize.bind(this);
    this.handleValuesFromPreset = this.handleValuesFromPreset.bind(this);
  }

  // HANDLE VALUES FROM PRESET
  handleValuesFromPreset(preset) {
    const vals = {
      preset,
      size: this.props.config.size,
    };
    this.props.onValuesToEditor(vals);
  }
  // HANDLE VALUES FROM PRESET ends

  // HANDLE VALUES FROM SIZE
  handleValuesFromSize(size) {
    const vals = {
      preset: this.props.config.preset,
      size,
    };
    this.props.onValuesToEditor(vals);
  }
  // HANDLE VALUES FROM PRESET ends

  // MAKE SIZE JSX
  // Constructs chart size group
  // Sep'20: 'Recommended Height' removed
  makeSizeJsx() {
    const size = this.props.config.size;
    return (
      <Size config={size} onValuesToSizeAndPreset={this.handleValuesFromSize} />
    );
  }
  // MAKE SIZE JSX ends

  // MAKE PRESET JSX
  // Builds preset sub-component
  makePresetJsx() {
    const preset = this.props.config.preset;
    return (
      <Preset
        presetDefinitions={preset}
        onValuesToSizeAndPreset={this.handleValuesFromPreset}
      />
    );
  }
  // MAKE PRESET JSX ends

  // SIZE AND PRESET JSX
  // Calls sub-functions to construct JSX for size controls
  // and preset sub-components
  sizeAndPresetJsx() {
    // Size inputs
    const sizeJsx = this.makeSizeJsx();
    const presetJsx = this.makePresetJsx();
    return (
      <div className="size-and-preset-wrapper">
        {presetJsx}
        {sizeJsx}        
      </div>
    );
  }
  // SIZE AND PRESET JSX ends

  // RENDER
  render() {
    return this.sizeAndPresetJsx();
  }
}

// PROP TYPES and DEFAULTS
SizeAndPreset.propTypes = {
  config: PropTypes.object.isRequired,
  onValuesToEditor: PropTypes.func.isRequired,
};

export default SizeAndPreset;
