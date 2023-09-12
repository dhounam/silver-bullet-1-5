// Child of scales-fold-body.
// Handles left/right invert scale

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class InvertScale extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    // Events
    this.handleInvertChangeLeft = this.handleInvertChangeLeft.bind(this);
    this.handleInvertChangeRight = this.handleInvertChangeRight.bind(this);
  }

  // *** REACT LIFECYCLE STUFF ENDS ***

  // SEND VALUES
  // Called from checkbox event handlers. Assembles the
  // object to pass back upstairs...
  sendValues(side, invert) {
    const { config } = this.props;
    const invertObj = {
      left: {
        enabled: config.left.enabled,
        invert: config.left.invert,
      },
      right: {
        enabled: config.right.enabled,
        invert: config.right.invert,
      },
    };
    invertObj[side].invert = invert;
    // But if chart is mixed, inactive side is aligned to active
    if (config.isMixed) {
      if (side === 'left') {
        invertObj.right.invert = invert;
      } else {
        invertObj.left.invert = invert;
      }
    }
    invertObj.updateChart = true;
    this.props.onInvertToScalesBody(invertObj);
  }
  // SEND VALUES ends

  // HANDLE INVERT CHANGE LEFT/RIGHT
  // Event handlers for the checkboxes
  handleInvertChangeLeft({ target: { checked } }) {
    this.sendValues('left', checked);
  }

  handleInvertChangeRight({ target: { checked } }) {
    this.sendValues('right', checked);
  }

  // INVERT JSX
  // Called from render to assemble JSX
  invertJsx() {
    const { config } = this.props;
    // config has left/right with props invert and enabled
    let cNameLeft = 'silver-checkbox invert-left-checkbox';
    let cNameRight = 'silver-checkbox invert-right-checkbox';
    if (!config.left.enabled) {
      cNameLeft = `${cNameLeft} checkbox-disabled`;
    }
    if (!config.right.enabled) {
      cNameRight = `${cNameRight} checkbox-disabled`;
    }
    const invertLeft = config.left.invert;
    const invertRight = config.right.invert;
    return (
      <div className="scales-invert-div">
        <div
          className={`invert-label ${
            !config.right.enabled && !config.left.enabled ? 'disabled' : ''
          }`}
        >
          <label className="silver-label" htmlFor="invert-checkbox">
            Invert
          </label>
        </div>

        <div className="invert-group-list">
          <div
            className={`invert-row ${!config.right.enabled ? 'disabled' : ''}`}
          >
            <div>Right axis</div>
            <input
              className={cNameRight}
              type="checkbox"
              onChange={this.handleInvertChangeRight}
              checked={invertRight}
            />
          </div>

          <div
            className={`invert-row ${!config.left.enabled ? 'disabled' : ''}`}
          >
            <div>Left axis</div>
            <input
              className={cNameLeft}
              type="checkbox"
              onChange={this.handleInvertChangeLeft}
              checked={invertLeft}
            />
          </div>
        </div>
      </div>
    );
  }

  // RENDER
  render() {
    return this.invertJsx();
  }
}

InvertScale.propTypes = {
  config: PropTypes.object,
  onInvertToScalesBody: PropTypes.func,
};

export default InvertScale;
