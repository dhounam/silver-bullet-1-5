// Child of design-fold-body. Handles blobs
// Component seems happy to be stateless...

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Blobs extends Component {
  // *** REACT LIFECYCLE ***

  constructor(props) {
    super(props);
    this.state = {};
    // Events
    this.handleBlobHeaderChange = this.handleBlobHeaderChange.bind(this);
    this.handleBlobShapeChange = this.handleBlobShapeChange.bind(this);
  }

  // *** REACT LIFECYCLE STUFF ENDS ***

  // HANDLE BLOB HEADER CHANGE
  handleBlobHeaderChange({ target: { value } }) {
    const column = Number(value);
    const header = this.props.config.headers[column];
    const isRect = this.props.config.isRect;
    const blobResult = {
      source: 'blobs',
      column,
      isRect,
      header,
    };
    this.props.onValuesToDesignBody(blobResult);
  }
  // HANDLE BLOB HEADER CHANGE ends

  handleBlobShapeChange({ target: { innerHTML } }) {
    const isRect = innerHTML.toLowerCase() === 'block';
    const column = Number(this.props.config.column);
    const blobResult = {
      source: 'blobs',
      isRect,
      column,
      header: this.props.config.headers[column],
    };
    this.props.onValuesToDesignBody(blobResult);
  }

  blobsJsx() {
    // I want a main label; minor label, dropdown;
    // minor label 2 buttons
    let componentClass = 'blobs-div';
    if (this.props.config.disabled) {
      componentClass = `${componentClass} blobs-disabled`;
    }
    // Dropdown content
    const headArray = this.props.config.headers;
    const options = headArray.map((opt, index) => (
      <option key={index} value={index}>
        {opt}
      </option>
    ));
    const val = this.props.config.column;
    // Bubble/block selection
    const isRect = this.props.config.isRect;
    // Base className
    let blockClass = 'silver-button blobs-block';
    let bubbleClass = 'silver-button blobs-bubble';
    if (isRect) {
      blockClass = `${blockClass} button-selected`;
    } else {
      bubbleClass = `${bubbleClass} button-selected`;
    }
    return (
      <div className={componentClass}>
        <div className="silver-label-head blobs-label-main">Blobhead</div>

        <div className="blobs-group-dropdown">
          <span className="silver-label blobs-label-dropdown">Convert</span>
          <select
            className="dropdown blobs-dropdown"
            value={val}
            onChange={this.handleBlobHeaderChange}
            required
          >
            {options}
          </select>
          <span className="silver-label blobs-label-toggle">to</span>
        </div>

        <button
          type="button"
          className={bubbleClass}
          onClick={this.handleBlobShapeChange}
        >
          bubble
        </button>
        <button
          type="button"
          className={blockClass}
          onClick={this.handleBlobShapeChange}
        >
          block
        </button>
      </div>
    );
  }

  // RENDER
  render() {
    return this.blobsJsx();
  }
}

Blobs.propTypes = {
  config: PropTypes.object,
  onValuesToDesignBody: PropTypes.func,
};

export default Blobs;
