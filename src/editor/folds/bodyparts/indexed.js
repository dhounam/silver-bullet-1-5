// Handles indexed dot option

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Indexed extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    // Events
    this.handleIndexedChange = this.handleIndexedChange.bind(this);
  }

  // *** REACT LIFECYCLE STUFF ENDS ***

  // HANDLE INDEXED CHANGE
  // Event handler for the checkbox. Sends a boolean upwards...
  handleIndexedChange({ target: { checked } }) {
    const vals = {
      component: 'indexed',
      indexFlag: checked,
      updateChart: true,
    };
    this.props.onValuesToScalesBody(vals);
  }

  // INDEXED JSX
  // Called from render to assemble JSX
  indexedJsx() {
    const { config } = this.props;
    const disable = config.indexPoint < 0;
    const isIndexed = config.indexFlag;
    let cName = 'silver-checkbox indexed-checkbox';
    if (disable) {
      cName = `${cName} checkbox-disabled`;
    }
    return (
      <div className={`indexed-div ${disable ? 'disabled' : ''}`}>
        <div className="indexed-label silver-label">Index</div>
        <div className="indexed-group">
          <div>Index series</div>

          <input
            className={cName}
            type="checkbox"
            onChange={this.handleIndexedChange}
            checked={isIndexed}
          />
        </div>
      </div>
    );
  }

  // RENDER
  render() {
    return this.indexedJsx();
  }
}

Indexed.propTypes = {
  config: PropTypes.object,
  onValuesToScalesBody: PropTypes.func,
};

export default Indexed;
