// Button to share current panel's scale properties to other panels

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ShareScale extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    // Events
    this.handleButtonClick = this.handleButtonClick.bind(this);
  }

  // HANDLE BUTTON CLICK
  // Event handler for the button. Sends a nudge upstairs...
  handleButtonClick() {
    const vals = {
      component: 'share-scale',
      shareScale: true,
      updateChart: true,
    };
    this.props.onValuesToScalesBody(vals);
  }
  // HANDLE BUTTON CLICK ends

  // IS BUTTON DISABLED
  isButtonDisabled() {
    // NOTE: DURING INITIAL DEVEL THIS IS BACK TO FRONT
    // const canShare = this.props.canShareScale;
    // NEXT IS THE RIGHT ONE:
    const canShare = !this.props.canShareScale;
    return canShare;
  }
  // IS BUTTON DISABLED ENDS

  // SHARE-SCALE JSX
  // Called from render to assemble JSX
  shareScaleJsx() {
    // Disable button if:
    //    only one panel
    //    log scale
    //    double scale
    const disable = this.isButtonDisabled();
    let cName = 'silver-button share-scale-button';
    if (disable) {
      cName = `${cName} button-disabled`;
    }
    return (
      <div className={`share-scale-div ${disable ? 'disabled' : ''}`}>
        <button
          type="button"
          className={cName}
          onClick={this.handleButtonClick}
        >
          Share scale
        </button>
      </div>
    );
  }

  // RENDER
  render() {
    return this.shareScaleJsx();
  }
}

ShareScale.propTypes = {
  canShareScale: PropTypes.bool,
  onValuesToScalesBody: PropTypes.func,
};

export default ShareScale;
