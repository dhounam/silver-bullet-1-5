// Swap scales checkbox (currently inoperative)
/* eslint-disable */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Swap extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // Called from render to assemble JSX
  swapJsx() {
    return (
      <div className="swap-div">
        <label className="silver-label-head swap-label" htmlFor="swap-checkbox">
          Swap series
        </label>

        <input type="checkbox" className="silver-checkbox checkbox-disabled" />
      </div>
    );
  }

  // RENDER
  render() {
    return this.swapJsx();
  }
}

Swap.propTypes = {
  config: PropTypes.object,
  onValuesToScalesBody: PropTypes.func,
};

export default Swap;
