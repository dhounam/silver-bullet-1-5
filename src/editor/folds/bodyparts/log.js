// Child of scales-fold-body.
// Handles line:left/right or scatter:x/y log scale

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Log extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    // Events
    this.handleLogChangeLeft = this.handleLogChangeLeft.bind(this);
    this.handleLogChangeRight = this.handleLogChangeRight.bind(this);
  }

  // *** REACT LIFECYCLE STUFF ENDS ***

  // SEND VALUES
  // Called from checkbox event handlers. Assembles the
  // object to pass back upstairs...
  sendValues(side, log) {
    const logObj = {
      component: 'log',
      log,
      side,
      updateChart: true,
    };
    // const { config } = this.props;
    // const logObj = {
    //   left: {
    //     enabled: config.left.enabled,
    //     log: config.left.log,
    //   },
    //   right: {
    //     enabled: config.right.enabled,
    //     log: config.right.log,
    //   },
    //   updateChart: true,
    //   component: 'log',
    // };
    // logObj[side].log = log;
    // // But if chart is mixed, inactive side is aligned to active
    // // NOTE: is a log scale possible with mixed chart?
    // // I suppose line and, say, stepline is possible...
    // if (config.isMixed) {
    //   if (side === 'left') {
    //     logObj.right.log = log;
    //   } else {
    //     logObj.left.log = log;
    //   }
    // }
    this.props.onValuesToScalesBody(logObj);
  }
  // SEND VALUES ends

  // HANDLE LOG CHANGE LEFT/RIGHT
  // Event handlers for the checkboxes
  handleLogChangeLeft({ target: { checked } }) {
    this.sendValues('left', checked);
  }

  handleLogChangeRight({ target: { checked } }) {
    this.sendValues('right', checked);
  }

  // LOG JSX
  // Called from render to assemble JSX
  logJsx() {
    const { config } = this.props;
    // config has left/right with props log and enabled
    let cNameLeft = 'silver-checkbox log-left-checkbox';
    let cNameRight = 'silver-checkbox log-right-checkbox';
    if (!config.left.enabled) {
      cNameLeft = `${cNameLeft} checkbox-disabled`;
    }
    if (!config.right.enabled) {
      cNameRight = `${cNameRight} checkbox-disabled`;
    }
    const logLeft = config.left.log;
    const logRight = config.right.log;
    // Axis label names
    const labelLeft = config.left.label;
    const labelRight = config.right.label;
    return (
      <div className="scales-log-div">
        <div
          className={`log-label ${
            !config.right.enabled && !config.left.enabled ? 'disabled' : ''
          }`}
        >
          <span className="silver-label" htmlFor="log-checkbox">
            Log scale
          </span>
        </div>

        <div className="log-group-list">
          <div className={`log-row ${!config.right.enabled ? 'disabled' : ''}`}>
            <div>{labelRight}</div>
            <input
              className={cNameRight}
              type="checkbox"
              onChange={this.handleLogChangeRight}
              checked={logRight}
            />
          </div>

          <div className={`log-row ${!config.left.enabled ? 'disabled' : ''}`}>
            <div>{labelLeft}</div>
            <input
              className={cNameLeft}
              type="checkbox"
              onChange={this.handleLogChangeLeft}
              checked={logLeft}
            />
          </div>
        </div>
      </div>
    );
  }

  // RENDER
  render() {
    return this.logJsx();
  }
}

Log.propTypes = {
  config: PropTypes.object,
  onValuesToScalesBody: PropTypes.func,
};

export default Log;
