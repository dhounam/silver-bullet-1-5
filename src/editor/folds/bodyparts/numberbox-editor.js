import React, { Component } from 'react';
import PropTypes from 'prop-types';

class NumberBoxEditor extends Component {
  static get defaultProps() {
    return {};
  }

  constructor(props) {
    super(props);
    this.handleNumberBoxBlur = this.handleNumberBoxBlur.bind(this);
  }

  componentDidMount() {
    this.fillField();
  }

  componentDidUpdate() {
    this.fillField();
  }

  fillField() {
    this.numberboxinput.value = this.props.config.value;
  }

  handleNumberBoxBlur({ target }) {
    const val = target.value;
    // Must be a number or empty string
    // (Checked again chartside)
    if (isNaN(val) && val !== '?') {
      target.value = '';
    } else {
      const vals = {
        source: 'numberBox',
        val,
      };
      this.props.onValuesToAdvancedBody(vals);
    }
  }

  makeNumberBoxJsx() {
    const refName = 'numberboxinput';
    return (
      <div className="numberbox-div">
        <span className="silver-label numberbox-label">Chart number</span>
        <input
          id="text-field"
          ref={c => {
            this[refName] = c;
          }}
          className="text-field numberbox-input"
          onBlur={this.handleNumberBoxBlur}
        />
      </div>
    );
  }

  // RENDER
  render() {
    return this.makeNumberBoxJsx();
  }
}

NumberBoxEditor.propTypes = {
  config: PropTypes.object,
  onValuesToAdvancedBody: PropTypes.func.isRequired,
};

export default NumberBoxEditor;
