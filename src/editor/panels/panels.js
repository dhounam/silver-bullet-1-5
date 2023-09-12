/* eslint-disable no-console, id-blacklist */
// disabled id-blacklist so that I can work with
// panels.number property. But why have I got
// away with it so long?
import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Panels extends Component {
  // CONSTRUCTOR
  // Sets up the various event listeners...
  // ...and the global value-container
  constructor(props) {
    super(props);
    this.state = {
      panels: props.config.values,
      updateEditor: false,
    };
    // Events
    this.handlePanelChange = this.handlePanelChange.bind(this);
  }
  // CONSTRUCTOR ends

  // COMPONENT WILL RECEIVE PROPS
  UNSAFE_componentWillReceiveProps(newProps) {
    this.setState({
      panels: newProps.config.values,
      updateEditor: newProps.config.values.updateEditor,
    });
  }
  // COMPONENT WILL RECEIVE PROPS ends

  // COMPONENT DID UPDATE
  // Any user gesture precipitates a re-render, after which
  // we update Editor...
  componentDidUpdate() {
    if (this.state.updateEditor) {
      const vals = {
        panels: this.state.panels,
      };
      this.props.onValuesToEditor(vals);
    }
  }
  // COMPONENT DID UPDATE ends

  // VALIDATE PANEL VALUES
  // Checks that any value entered in one of the panel inputs is
  // consistent with existing values. Args are: id of the input, its new value,
  // and the config object
  // NOTE: this needs more work. Among other things, if input is 'total' I
  // ought always be able to reset it, but 'active' and 'row' should adapt
  // if inconsistent...
  validatePanelValues(targetId, val, inPanels) {
    // Clone current CO panel properties & substitute potential new value
    // then run checks...
    const panels = Object.assign({}, inPanels);
    panels.valid = false;
    if (targetId === 'rows') {
      panels.rows = val;
    } else {
      // Clicked icon
      panels.active = val;
      if (val > panels.total) {
        panels.total = val;
      }
    }
    // NOTE: handling of total is all over the place
    // Do we need a +/– control, or is it driven by sheet tabs?
    // Panel-active can't exceed total
    if (panels.active > panels.total) {
      return panels;
    }
    // Row count must be exact divisor of total
    if (panels.total % panels.rows !== 0) {
      return panels;
    }
    // Can't have more rows than total
    if (panels.rows > panels.total) {
      return panels;
    }
    // NOTE: anything else to check...?
    // Still here? New val is OK
    panels.valid = true;
    return panels;
  }
  // VALIDATE PANEL VALUES ends

  // HANDLE PANEL CHANGE
  // NOTE: reset state to precipitate re-render; after which
  // componentDidUpdate does callback to Editor
  handlePanelChange(evt) {
    const panels = JSON.parse(JSON.stringify(this.state.panels));
    // Extract id and val from event
    const targ = evt.target;
    const targetId = targ.id.split('-')[1];
    const newVal = parseInt(targ.value, 10);
    const oldVal = panels[targetId];
    // Validate
    const newVals = this.validatePanelValues(targetId, newVal, panels);
    if (newVals.valid) {
      // New val is OK: update CO...
      panels.active = newVals.active;
      panels.total = newVals.total;
      panels.rows = newVals.rows;
      this.setState({
        panels,
        updateEditor: true,
      });
    } else {
      // Reset target to previous value
      // NOTE: ideally there'd be some sort of alert...
      targ.value = oldVal;
      // And state doesn't change
    }
  }
  // HANDLE PANEL CHANGE ends

  // MAKE PANEL CONTROLS
  // Called by render to construct panel controls
  makePanelControls() {
    const panels = this.state.panels;
    const pNo = panels.active;
    const pRows = panels.rows;
    const pTotal = panels.total;

    // Remember: counting from zero, but panel numbers display from 1
    const panelArray = [];
    for (let iii = 0; iii < pTotal; iii++) {
      panelArray.push(
        <option key={iii} value={iii}>
          {iii + 1}
        </option>,
      );
    }

    // I also need the array for the row dropdown
    const rowArray = [];
    let rowVal = 0;
    let index = 0;
    for (let iii = 1; iii <= pTotal; iii++) {
      if (Number.isInteger(pTotal / iii)) {
        if (iii === pRows) {
          rowVal = iii;
        }
        rowArray.push(
          <option key={index} value={iii}>
            {iii}
          </option>,
        );
        index++;
      }
    }
    //
    return (
      <div className="panel-controls-wrapper">
        <span className="silver-label panel-select-label">Panels</span>
        <select
          className="dropdown panel-panels-select"
          id="panel-panels"
          value={pNo}
          onChange={this.handlePanelChange}
          required
        >
          {panelArray}
        </select>
        <span className="silver-label panel-rows-label">Rows</span>
        <div className="dropdown-border panel-rows-border" />
        <select
          className="dropdown panel-rows-select"
          id="panel-rows"
          value={rowVal}
          onChange={this.handlePanelChange}
          required
        >
          {rowArray}
        </select>
      </div>
    );
  }
  // MAKE PANEL CONTROLS ends

  // RENDER
  render() {
    return this.makePanelControls();
  }
}

Panels.propTypes = {
  config: PropTypes.object.isRequired,
  onValuesToEditor: PropTypes.func.isRequired,
};

export default Panels;
