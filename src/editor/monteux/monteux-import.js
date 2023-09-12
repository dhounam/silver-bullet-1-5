/*    Catcher for payload from Monteux
      At mount, sets up listener for Monteux events: payloadHandler
      This controls handlers to do initial triage of the payload.
      Each panel's rawData will be passed to handlers in RawDataUtils
      to be unpicked and polished
      Triaged payload is finally sent to Editor
*/

// import React, { Component } from 'react';
import { Component } from 'react';
import PropTypes from 'prop-types';

// Monteux:
import Monteux from './monteux';

// Utilities to filter raw data
import * as RawDataUtils from '../utilities/payload-utilities/rawdata-utilities';

class MonteuxImport extends Component {
  constructor(props) {
    super(props);
    this.payloadHandler = this.payloadHandler.bind(this);
  }

  // COMPONENT DID MOUNT adds window event listener
  componentDidMount() {
    Monteux.listenForMessages(this.payloadHandler, 'monteux');
  }

  // UNPICK RAW DATA
  // Called from unpickOnePanel. Passed the raw-data array,
  // calls a top-level handler in RawDataUtils, where these
  // actual values will be filtered and triaged, and date-series,
  // in particular, will be made consistent
  // Returns an object with the necessary data properties appended
  unpickRawData(dataArray) {
    // A few prefs that Editor dug out...
    const dataPrefs = this.props.config.requiredDataPrefs;
    // Restructure raw data; returns object with properties:
    // dataArray, isValid, validityMsg, categories, timeFormats...
    const dataObject = RawDataUtils.unpickData(dataArray, dataPrefs);
    return dataObject;
  }
  // UNPICK RAW DATA ends

  // UNPICK ONE PANEL
  // Called from triagePayload to convert one panel's metadata and raw data values
  unpickOnePanel(rawPanelObj) {
    // Set up panel-specific object with transferred properties
    const unpickedPanel = {
      metaData: {
        id: rawPanelObj.metaData.id,
      },
      // Linter won't allow 'data'
      rawData: {
        id: rawPanelObj.rawData.id,
      },
    };
    // Convert undefineds into empty strings, etc
    unpickedPanel.metaData.values = this.filterMonteuxValues(
      rawPanelObj.metaData.values,
    );
    // The array of raw data gets some serious unpicking to yield other
    // necessary properties...
    unpickedPanel.rawData.values = this.unpickRawData(
      rawPanelObj.rawData.values,
    );
    return unpickedPanel;
  }
  // UNPICK ONE PANEL ends

  // FILTER MONTEUX VALUES
  // Iterates through a set of metadata or global values, setting
  // any element that is undefined to an empty string; converting
  // 'TRUE' or 'FALSE' to boolean, and stringed numbers to numbers
  filterMonteuxValues(values) {
    for (const key in values) {
      if (values.hasOwnProperty(key)) {
        const thisVal = values[key];
        if (typeof thisVal === 'undefined') {
          values[key] = '';
        } else if (typeof thisVal === 'string') {
          if (isNaN(thisVal)) {
            if (thisVal.toLowerCase() === 'true') {
              values[key] = true;
            } else if (thisVal.toLowerCase() === 'false') {
              values[key] = false;
            } else if (!isNaN(thisVal.replace(/,/g, ''))) {
              values[key] = Number(thisVal.replace(/,/g, ''));
            }
            // Nastily, Number('') returns zero, so...
          } else if (thisVal.length > 0) {
            values[key] = Number(thisVal);
          }
        }
      }
    }
    return values;
  }
  // FILTER MONTEUX VALUES ends

  // TRIAGE PAYLOAD
  // Called from payloadHandler. Passed the 'raw' payload object, it
  // restructures and triages into a new, Editor-ready object...
  triagePayload(rawLoad) {
    // Set up the basic object structure, with
    // properties that are easily transferred...
    const triagedLoad = {
      sheetId: rawLoad.id,
      global: {
        globalId: rawLoad.global.id,
        // Global values: change undefined to empty string:
        values: this.filterMonteuxValues(rawLoad.global.values),
      },
      // Panels (individual charts) need more love and attention...
      panelArray: [],
    };
    const rawPanelArray = rawLoad.panelArray;
    // Unpick individual panels, ignoring any that have no raw data
    // A new data file will, of course, have none
    triagedLoad.panelArray = rawPanelArray
      .filter(onePanel => typeof onePanel.rawData.values !== 'undefined')
      .map(onePanel => this.unpickOnePanel(onePanel));
    return triagedLoad;
  }
  // TRIAGE PAYLOAD ends

  // PAYLOAD HANDLER
  // Handler for Monteux import event, tripped by Monteux event
  // Argument is the payload enclosed in the event
  payloadHandler(payload) {
    // Put the payload through a series of filters...
    const triagedPayload = this.triagePayload(payload);
    // Check that we have some raw data to process
    // (I.e. do nothing at startup or new, blank datasheet)
    if (triagedPayload.panelArray.length > 0) {
      // Dispatch to Editor, with 'payload' flag
      this.props.onValuesToEditor(triagedPayload, true);
    }
  }
  // PAYLOAD HANDLER ends

  // RENDER
  // Nothing rendered
  render() {
    return null;
  }
}

MonteuxImport.propTypes = {
  config: PropTypes.object,
  // Callback of returned data
  onValuesToEditor: PropTypes.func,
};

export default MonteuxImport;
