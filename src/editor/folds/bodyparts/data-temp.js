// Display textfield, into which raw tab-separated data can be pasted
// for processing. This component will be hidden eventually,
// but kept for possible use...

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as RawDataUtils from '../../utilities/payload-utilities/rawdata-utilities';

class DataTemp extends Component {
  static get defaultProps() {
    return {
      commaSubstitute: 'commasubstitute',
    };
  }

  constructor(props) {
    super(props);
    // Events on text area
    this.handleTextAreaTabEvent = this.handleTextAreaTabEvent.bind(this);
    this.handleTextAreaBlurEvent = this.handleTextAreaBlurEvent.bind(this);
    this.handleTextAreaPasteEvent = this.handleTextAreaPasteEvent.bind(this);
  }
  // CONSTRUCTOR ends

  // PROCESS NEW DATA
  // Called from data-blur. Arg is a line/tab-separated string of raw data
  processNewData(rawData) {
    // No data? Nark off.
    if (rawData.length === 0) {
      return;
    }
    // I have to send in a few prefs
    const dataPrefs = this.props.config.requiredDataPrefs;
    // Returns an object with 'arrayified' raw data and other properties
    const dataObject = RawDataUtils.unpickData(rawData, dataPrefs);
    // Incorporate into a Monteux-consistent object and fire off...
    const monteuxlikeObject = {
      source: 'rawData',
      global: {
        values: {},
      },
      panelArray: [
        {
          metaData: {
            values: {},
          },
          rawData: {
            values: dataObject,
          },
        },
      ],
    };
    this.props.onValuesToAdvancedBody(monteuxlikeObject);
  }
  // PROCESS NEW DATA ends

  // UN-COMMA
  // Called from lineCsvToTsv
  // Arg is one line, separated by commas -- but maybe
  // with commas as part of quote-enclosed sub-strings
  unComma(str) {
    // Find any substrings inside quotes
    // and replace internal commas with substitute
    // Next is regex for both single and double quotes
    // const qRegX = /("(.*?)")|('(.*?)')/g
    // For now, at least, just double:
    const qRegX = /"(.*?)"/g;
    const matches = str.match(qRegX);
    for (const match in matches) {
      const thisMatch = matches[match];
      const fixMatch = thisMatch.replace(/,/g, this.props.commaSubstitute);
      str = str.replace(thisMatch, fixMatch);
    }
    return str;
  }
  // UN-COMMA ends

  // LINE CSV TO TSV
  // Called from csvToTsv. Arg is a single line of CSV to convert
  lineCsvToTsv(str) {
    // Replace 'internal' commas with substitute, so
    // now we have items separated by commas
    const myStr = this.unComma(str);
    // Split on commas
    const firstArray = myStr.split(/,/g);
    const secondArray = [];
    const subRegExp = new RegExp(this.props.commaSubstitute, 'g');
    for (let iii = 0; iii < firstArray.length; iii++) {
      let item = firstArray[iii];
      if (item.length > 0) {
        // Strip loose quotes and replace the internal substitute commas
        // with the real thing
        item = item.replace(/"/g, '').replace(subRegExp, ',');
        secondArray.push(item);
      }
    }
    // Return as tab-sep'd string
    return secondArray.join('\t');
  }
  // LINE CSV TO TSV ends

  // CSV TO TSV
  // Called from handleTextAreaPasteEvent
  csvToTsv(str) {
    // Split into lines
    const lArray = str.split(/\n/g);
    // const result = [];
    // for (let lNo = 0; lNo < lArray.length; lNo++) {
    //   result.push(this.lineCsvToTsv(lArray[lNo]));
    // }
    const result = lArray.map(oneLine => {
      return this.lineCsvToTsv(oneLine);
    });
    return result.join('\n');
  }
  // CSV TO TSV ends

  // TEXT IS TSV
  textIsTsv(content) {
    // Number of tabs should >= number of lines
    const tabRegExp = /\t/g;
    const lineRegExp = /\n/g;
    const tabCount = (content.match(tabRegExp) || []).length;
    const lineCount = (content.match(lineRegExp) || []).length;
    const isTsv = tabCount >= lineCount;
    return isTsv;
  }
  // TEXT IS TSV ends

  // TEXT IS CSV
  textIsCsv(content) {
    // Number of tabs should >= number of lines
    const commaRegExp = /,/g;
    const lineRegExp = /\n/g;
    const commaCount = (content.match(commaRegExp) || []).length;
    const lineCount = (content.match(lineRegExp) || []).length;
    const isCsv = commaCount >= lineCount;
    return isCsv;
  }
  // TEXT IS CSV ends

  // HANDLE TEXT AREA PASTE EVENT
  // Event handler for paste. Converts pasted CSV text to TSV
  handleTextAreaPasteEvent(event) {
    const target = event.target;
    let content = event.clipboardData.getData('Text');
    // If this is already TSV, leave it alone
    if (!this.textIsTsv(content)) {
      // If CSV, convert
      if (this.textIsCsv(content)) {
        content = this.csvToTsv(content);
      }
    }
    setTimeout(() => {
      target.value = content;
    }, 10);
  }
  // HANDLE TEXT AREA PASTE EVENT ends

  // HANDLE TEXT AREA TAB EVENT
  // Called from textarea > keydown to pre-empt default
  // tab-switches-focus and put a tab in chartdata field
  handleTextAreaTabEvent(event) {
    const tabCode = 9;
    if (event.keyCode === tabCode) {
      // prevent the focus loss
      event.preventDefault();
      const target = event.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const textBefore = value.substring(0, start);
      const textAfter = value.substring(end);
      // set textarea value to: text before cursor + tab + text after cursor
      target.value = `${textBefore}\t${textAfter}`;
      // put cursor at right position again (add one for the tab)
      target.selectionStart = start + 1;
      target.selectionEnd = start + 1;
    }
  }
  // HANDLE TEXT AREA TAB EVENT ends

  // HANDLE TEXTAREA BLUR EVENT
  // Listener for textarea blur
  handleTextAreaBlurEvent(evt) {
    const newData = evt.target.value;
    this.processNewData(newData);
  }
  // HANDLE TEXTAREA BLUR EVENT ends

  // *** EVENT LISTENERS END ***

  // *** JSX ***

  // MAKE RAW DATA TEXT AREA
  // Text input for raw data
  // Called from makeChartDataFormJsx
  makeRawDataTextArea() {
    // This is a 'simple' textarea with event(s).
    //    intercept tabs: prevent default behaviour and insert a tab char inline
    //    intercept blur: passes on textarea's contents...
    //    intercept paste: to convert TSV to CSV
    //    (NB: CSS word-wrap:off doesn't apparently work on textareas...)
    const placeHolder =
      'Paste tab-separated data here. Click away to process...';
    let className = 'chartdata-textarea';
    // See AdvancedFoldBody.doesDataFieldDisable:
    if (this.props.config.disableDataField) {
      className = `${className} chartdata-textarea-disabled`;
    }
    return (
      <textarea
        className={className}
        wrap="off"
        placeholder={placeHolder}
        onKeyDown={this.handleTextAreaTabEvent}
        onChange={this.handleTextAreaChangeEvent}
        onBlur={this.handleTextAreaBlurEvent}
        onPaste={this.handleTextAreaPasteEvent}
      />
    );
  }
  // MAKE RAW DATA TEXT AREA ends

  // FOLD BODY JSX
  // Calls sub-functions to construct individual elements and clusters
  foldBodyJsx() {
    // Raw data textarea
    const rawDataTextArea = this.makeRawDataTextArea();
    return <form className="data-temp-div">{rawDataTextArea}</form>;
  }
  // FOLD BODY JSX ends

  // RENDER
  render() {
    return this.foldBodyJsx();
  }
}

DataTemp.propTypes = {
  config: PropTypes.object,
  commaSubstitute: PropTypes.string,
  // Callback with returned data
  onValuesToAdvancedBody: PropTypes.func,
};

export default DataTemp;
