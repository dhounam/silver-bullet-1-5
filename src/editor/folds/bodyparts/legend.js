// Child of design-fold-body. Handles legend columns-count and header

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Legend extends Component {
  // *** REACT LIFECYCLE ***

  // CONSTRUCTOR
  // Sets up the structure and 'reactions' of the controls
  constructor(props) {
    super(props);
    this.state = {
      header: this.props.config.header,
    };
    // Events
    this.handleColumnsChange = this.handleColumnsChange.bind(this);
    this.handleHeaderChange = this.handleHeaderChange.bind(this);
    this.handleHeaderBlur = this.handleHeaderBlur.bind(this);
  }
  // CONSTRUCTOR ends

  // COMPONENT WILL RECEIVE PROPS
  // If header has changed, update in state
  UNSAFE_componentWillReceiveProps(newProps) {
    const header = newProps.config.header;
    if (header !== this.props.config.header) {
      this.setState({
        header,
      });
    }
  }
  // COMPONENT WILL RECEIVE PROPS ends

  // COMPONENT DID UPDATE
  // Any user gesture precipitates a state-change and re-render,
  // after which we update Editor...
  // componentDidUpdate() {
  //   if (this.state.updateEditor) {
  //     this.props.onValuesToDesignBody(this.state.legend);
  //   }
  // }
  // COMPONENT DID UPDATE ends

  // *** REACT LIFECYCLE STUFF ENDS ***

  // HANDLE COLUMNS CHANGE
  // Unpick and dispatch callback
  handleColumnsChange({ target: { value } }) {
    const columns = Number(value);
    const legendResult = this.props.config;
    legendResult.source = 'legend';
    legendResult.columns = columns;
    this.props.onValuesToDesignBody(legendResult);
  }
  // HANDLE COLUMNS CHANGE ends

  handleHeaderChange({ target: { value } }) {
    const header = value;
    // NOTE: remainder comm'd out because errors... And
    // anyway I need to decide what I want to do...
    this.setState({ header });
  }

  // HANDLE HEADER BLUR
  // Unpick and dispatch callback
  handleHeaderBlur({ target: { value } }) {
    let header = value.trim();
    const legendResult = this.props.config;
    legendResult.source = 'legend';
    legendResult.header = header;
    // Force undefined to empty string
    if (typeof header === 'undefined') {
      header = '';
    }
    this.setState({ header });
    this.props.onValuesToDesignBody(legendResult);
  }
  // HANDLE HEADER BLUR ends

  legendJsx() {
    // I want a main label; minor label, dropdown, minor label
    let componentClass = 'legend-div';
    if (this.props.config.disabled) {
      componentClass = `${componentClass} legend-disabled`;
    }
    const columns = this.props.config.columns;
    const options = [];
    const max = this.props.config.max;
    for (let iii = 0; iii <= max; iii++) {
      options.push(
        <option key={iii} value={iii}>
          {iii}
        </option>,
      );
    }
    const header = this.state.header;
    return (
      <div className={componentClass}>
        <div className="silver-label-head legend-label-main">Legend</div>
        <div className="legend-input-header-wrapper">
          <input
            type="text"
            id="legend-input-header"
            className="text-field legend-input-header"
            onBlur={this.handleHeaderBlur}
            onChange={this.handleHeaderChange}
            value={header}
            placeholder="Add legend header…"
          />
        </div>

        <div className="legend-columns">
          <span className="silver-label legend-label-across">Columns</span>
          <select
            className="dropdown legend-dropdown"
            value={columns}
            onChange={this.handleColumnsChange}
            required
          >
            {options}
          </select>
        </div>
      </div>
    );
    // Note that header div has no default innerHTML string
  }

  // RENDER
  render() {
    return this.legendJsx();
  }
}

Legend.propTypes = {
  config: PropTypes.object,
  onValuesToDesignBody: PropTypes.func,
};

export default Legend;
