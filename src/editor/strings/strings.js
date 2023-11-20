/* eslint-disable jsx-a11y/no-autofocus */

// FIXME: May 2019, footnote handling needs refactoring
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import EconomistIcon from '../icons/economist-icon';
import EiuIcon from '../icons/eiu-icon';
// Nov'23, 'Refinitiv' was replaced by 'LSEG Workspace'; however
// we continue to use the original Refinitiv icon
import RefinitivIcon from '../icons/refinitiv-icon';

class Strings extends Component {
  // CONSTRUCTOR
  // Creates empty array of footnote items
  // Sets up the event listener
  constructor(props) {
    super(props);
    this.state = {
      // This will be an array of objects, each with props 'symbol' and 'content'
      // I suspect, July'20, that this may be redundant
      activeFootnotes: [],
      focusFootnote: '',
      // Tracking old values of all except footnotes
      // Inputs for these values are uncontrolled
      title: 'To come',
      subtitle: 'To come',
      subsubtitle: '',
      panelheader: '',
      source: 'to come',
    };
    this.handleStringBlur = this.handleStringBlur.bind(this);
    this.handleAddFootnote = this.handleAddFootnote.bind(this);
    this.handleSpecialSourceString = this.handleSpecialSourceString.bind(this);
  }
  // CONSTRUCTOR ends

  UNSAFE_componentWillReceiveProps(newProps) {
    const values = newProps.config.values;
    this.setState({
      title: values.title,
      subtitle: values.subtitle,
      subsubtitle: values.subsubtitle,
      panelHeader: values.panelHeader,
      source: values.source,
    });
  }

  componentDidMount() {
    this.fillFields();
  }

  componentDidUpdate() {
    this.fillFields();
  }

  // *** REACT LIFECYCLE STUFF ENDS ***

  // GET FOOTNOTES
  // Called from handleStringBlur to concatenate footnote strings
  // (I can't get list from state, because last-added content
  // isn't in state yet)
  getFootnotes() {
    // const symbolList = this.props.footnoteSymbols;
    const symbolList = this.props.config.values.footnoteSymbols;
    // Collect all existing footnote strings in an array
    const fArray = [];
    // Loop thro all potential symbols
    // But also set a counter that will pick up symbols from symbolList
    let symbolCount = 0;
    for (let iii = 0; iii < symbolList.length; iii++) {
      const symbol = symbolList[iii];
      const thisInputName = `footnote-input-${symbol}`;
      const thisInput = this[thisInputName];
      if (thisInput !== null && typeof thisInput !== 'undefined') {
        // If input exists, get its content
        const fContent = thisInput.value;
        if (fContent.trim().length > 0) {
          fArray.push({
            symbol: symbolList[symbolCount],
            content: fContent,
          });
          symbolCount++;
        }
      }
    }
    // So fArray is an array of existing footnotes,
    // with symbols in default sequence
    // Set state to array
    const stringArray = [];
    for (let iii = 0; iii < fArray.length; iii++) {
      const { symbol } = fArray[iii];
      const { content } = fArray[iii];
      const oneString = `${symbol}${content}`;
      stringArray.push(oneString);
    }
    this.setState({ activeFootnotes: fArray });
    // Convert the array to a string
    // Sending the 4-space separator now is a waste of time, since
    // Background.wrapText arrayifies anyway...
    // NOTE: so I should just send the array in the first place!
    return stringArray.join(' ');
  }
  // GET FOOTNOTES ends

  // COLLECT FOOTNOTES FROM INPUTS
  // Called from handleAddFootnote. Retrieves existing
  // footnote field contents
  collectFootnotesFromInputs() {
    const fArray = [];
    const outerThis = this;
    // const symbols = this.props.footnoteSymbols;
    const symbols = this.props.config.values.footnoteSymbols;
    const parent = this['footnote-strings-body'];
    const fCount = parent.childElementCount;
    for (let iii = 0; iii < fCount; iii++) {
      const symbol = symbols[iii];
      const iName = `footnote-input-${symbol}`;
      const input = outerThis[iName];
      if (typeof input !== 'undefined') {
        const content = input.value;
        if (content.length > 0) {
          fArray.push({ symbol, content });
        }
      }
    }
    return fArray;
  }

  forceNewFootnoteDiv(newDiv, showClass) {
    if (!newDiv.classList.contains(showClass)) {
      newDiv.classList.add(showClass);
      newDiv.children[1].focus();
    }
  }

  // HANDLE ADD FOOTNOTE
  // Handler for '+' button click. Loops through footnote divs
  // until it finds the first empty one, which it sets to visible
  // with focus.
  // The Timeout is necessary because if user clicks '+' after
  // editing a footnote, the latter's blur event fires the callback
  // to Editor with the existing footnotes; and this then
  // precipitates a rerender of this component that hides the
  // newly-visible footnote div. So Timeout just ensures that
  // the field is made visible after the blur sequence has
  // concluded...
  handleAddFootnote() {
    const mainClass = 'one-footnote-div';
    const showClass = 'one-footnote-div-visible';
    const allFootnotes = document.getElementsByClassName(mainClass);
    for (let fNo = 0; fNo < allFootnotes.length; fNo++) {
      const fDiv = allFootnotes[fNo];
      if (!fDiv.classList.contains(showClass)) {
        // First non-visible
        fDiv.classList.add(showClass);
        fDiv.children[1].focus();
        // See above
        setTimeout(() => {
          this.forceNewFootnoteDiv(fDiv, showClass);
        }, 10);
        break;
      }
    }
  }
  // HANDLE ADD FOOTNOTE ends

  // FILL FIELDS
  // Called from componentDidMount and componentDidUpdate
  // to stuff new props cheaply and cheerfully into fields
  fillFields() {
    this.title.value = this.props.config.values.title;
    this.subtitle.value = this.props.config.values.subtitle;
    this.subsubtitle.value = this.props.config.values.subsubtitle;
    this.source.value = this.props.config.values.source;
    this.panelHeader.value = this.props.config.values.panelHeader;
    this.fillFootnoteFields();
  }
  // FILL FIELDS ends

  // FILL FOOTNOTE FIELDS
  fillFootnoteFields() {
    const fString = this.props.config.values.footnote;
    // Arrayify:
    let fArray = [];
    let propList = [];
    if (fString.length > 0) {
      fArray = this.footnoteStringToArray(fString);
      // Now turn each fnote into a symbol/content object
      // Convert single string to array of individual footnotes
      propList = this.footnoteStringsToObjects(fArray);
    }
    const showClass = 'one-footnote-div-visible';
    // const symbols = this.props.footnoteSymbols;
    const symbols = this.props.config.values.footnoteSymbols;
    for (let fNo = 0; fNo < symbols.length; fNo++) {
      const symbol = symbols[fNo];
      const thisFoot = `footnote-input-${symbol}`;
      const parentDiv = this[thisFoot].parentElement;
      let fContent = '';
      if (fNo < propList.length) {
        fContent = propList[fNo].content;
        if (!parentDiv.classList.contains(showClass)) {
          parentDiv.classList.add(showClass);
        }
      } else {
        parentDiv.classList.remove(showClass);
      }
      this[thisFoot].value = fContent;
    }
  }
  // FILL FOOTNOTE FIELDS ends

  // ENFORCE CHAR-SPACE IN SOURCE
  // Called from checkSourcePunctuation to enforce semi/colon + 1-space
  enforceCharSpaceInSource(str, char, charSpace) {
    const myArray = str.split(char);
    for (let i = 1; i < myArray.length; i++) {
      myArray[i] = myArray[i].trim();
    }
    return myArray.join(charSpace);
  }
  // ENFORCE CHAR-SPACE IN SOURCE ends

  // CHECK SOURCE PUNCTUATION
  // Called from filterSource to ensure that semi/colons are
  // followed by 1 space.
  checkSourcePunctuation(source) {
    const specialStrings = this.props.config.values.specialSourceStrings;
    let str = source.trim();
    if (str.length === 0) {
      return str;
    }
    const sColon = specialStrings.semicolon;
    const scSpace = specialStrings.semicolonSpace;
    const colon = specialStrings.colon;
    const cSpace = specialStrings.colonSpace;
    if (str.includes(colon)) {
      str = this.enforceCharSpaceInSource(str, colon, cSpace);
    }
    if (str.includes(sColon)) {
      str = this.enforceCharSpaceInSource(str, sColon, scSpace);
    }
    return str;
  }
  // CHECK SOURCE PUNCTUATION ends

  // NO SPACE BEFORE BR
  // Remove rogue spaces before hard return tag.
  // But NOTE: text-wrapping adds a space after return anyway --
  // something to do with italics tag!
  noSpaceBeforeBr(str) {
    const specialStrings = this.props.config.values.specialSourceStrings;
    str = str.replace(specialStrings.spaceBr, specialStrings.br);
    return str;
  }
  // NO SPACE BEFORE BR ends

  // FULL STOP FOR EIU SOURCE
  // EIU needs full stop at end of source
  fullStopForEiuSource(str) {
    if (this.props.config.values.user === 'eiu') {
      const lastChar = str.slice(-1);
      if (lastChar !== '.') {
        str = `${str}.`;
      }
    }
    return str;
  }
  // FULL STOP FOR EIU SOURCE ends

  // ITALICISE ONE ECONOMIST
  // Called from italiciseAllEconomists, checks that 'The Economist'
  // has italics tags
  italiciseOneEconomist(str) {
    const specialStrings = this.props.config.values.specialSourceStrings;
    const ecoStrPlain = specialStrings.ecoStrPlain;
    const ecoStrItal = specialStrings.ecoStrItal;
    if (str.includes(ecoStrPlain)) {
      if (!str.includes(ecoStrItal)) {
        str = str.replace(ecoStrPlain, ecoStrItal);
      }
    }
    return str;
  }
  // ITALICISE ONE ECONOMIST ends

  // ITALICISE THE ECONOMIST
  // Called from filterSource. italicises 'The Economist'
  // but not 'The Economist Intelligence Unit'
  italiciseTheEconomist(source) {
    const specialStrings = this.props.config.values.specialSourceStrings;
    const semicolon = specialStrings.semicolon;
    // The string could include both simple 'Eco' and 'EIU',
    // so arrayify
    // (element 0 will include prefix, but I don't think that matters)
    const sArray = source.split(semicolon);
    const italicisedSource = sArray.map(oneSource => {
      if (!oneSource.includes(specialStrings.eiuStr)) {
        // Ignore EIU; check others
        oneSource = this.italiciseOneEconomist(oneSource);
      }
      return oneSource;
    });
    // Return as string
    return italicisedSource.join(semicolon);
  }
  // ITALICISE THE ECONOMIST ends

  // FILTER SOURCE
  // Called from handleStringBlur. Before source string is dispatched,
  // verify source/sources is OK, and check Economist strings
  filterSource(source) {
    if (source.length > 0) {
      // Prepend a source label, if missing
      if (!source.includes('Source')) {
        source = `Source: ${source}`;
      }
      // Italicise The Economist --
      // but not in The Economist Intelligence Unit
      source = this.italiciseTheEconomist(source);
      // Just check for semi-colons for source/sources...
      if (source.includes(';')) {
        source = source.replace('Source:', 'Sources:');
      } else {
        source = source.replace('Sources:', 'Source:');
      }
    } else {
      // Currently (re-)set to empty string.
      // But should this be 'Source: to come'?
      source = '';
    }
    source = this.checkSourcePunctuation(source);
    // One final check: no space before '<br>'
    source = this.noSpaceBeforeBr(source);
    // And one final, final, inferential check:
    // EIU source must end with full stop
    source = this.fullStopForEiuSource(source);
    return source;
  }
  // FILTER SOURCE ends

  updateEditor() {
    // Run source thro filter
    const source = this.filterSource(this.source.value);
    // Collect footnotes, as a string
    const footnote = this.getFootnotes();
    const vals = {
      strings: {
        title: this.title.value,
        subtitle: this.subtitle.value,
        subsubtitle: this.subsubtitle.value,
        source,
        footnote,
        panelHeader: this.panelHeader.value,
      },
      // And send number of footnotes
      footnoteCount: this.state.activeFootnotes.length,
    };
    this.props.onValuesToEditor(vals);
  }

  // CHECK VAL CHANGED
  // Called from handleStringBlur. If the new value is
  // different from that held in state, update state to
  // new val, and return true
  checkValChanged(evt) {
    const newVal = evt.target.value;
    const id = evt.target.id;
    const oldVal = this.state[id];
    // console.log(`newVal: ${newVal};  oldVal: ${oldVal}`);
    let hasChanged = newVal !== oldVal;
    // KLUDGE to fix very occasional issue where there've been multiple footnotes
    // and the first has been emptied, causing the others to 'close up';
    // culminating in only one footnote remaining, whereupon...
    // ...if that final footnote is emptied, the string persists on the chart
    if (id === 'footnoteinput-0') {
      if (newVal === '' && oldVal === '') {
        hasChanged = true;
      }
    }
    // KLUDGE ends
    if (hasChanged) {
      this.setState({
        [id]: newVal,
      });
    }
    return hasChanged;
  }
  // CHECK VAL CHANGED

  // HANDLE STRING BLUR
  // Cheap and cheerful. Every time we tab or click out
  // of an input, check whether val has changed and, if
  // so, fire off the callback
  handleStringBlur(evt) {
    if (this.checkValChanged(evt)) {
      this.updateEditor();
      this.setState({ focusFootnote: '' });
    }
  }
  // HANDLE STRING BLUR ends

  // HANDLE SPECIAL SOURCE STRING
  // Append or remove special string to/from the source string
  // Param flags 'eco/eiu/lseg'
  handleSpecialSourceString(whichSource) {
    // Current content of the field
    const sourceInput = this.source;
    let sourceString = sourceInput.value;
    // Strings from DPs
    const specialStrings = this.props.config.values.specialSourceStrings;
    // Now: Eco, EIU or LSEG?
    // Eco is default:
    // Economist with preceding semi-colon...
    let stringAfterSemicolon = specialStrings.ecoStrAfterSemicolon;
    // ...or preceding colon...
    let stringAfterColon = specialStrings.ecoStrAfterColon;
    // ...or on its own
    let stringOnly = specialStrings.ecoStrItal;
    // EIU or LSEG
    if (whichSource === 'eiu') {
      stringAfterSemicolon = specialStrings.eiuStrAfterSemicolon;
      stringAfterColon = specialStrings.eiuStrAfterColon;
      stringOnly = specialStrings.eiuStr;
    } else if (whichSource === 'lseg') {
      stringAfterSemicolon = specialStrings.lsegStrAfterSemicolon;
      stringAfterColon = specialStrings.lsegStrAfterColon;
      stringOnly = specialStrings.lsegStr;
    }
    // 'to come'
    const addToCome = specialStrings.tocomeAfterColon;
    const removeToCome = specialStrings.tocomeBeforeSemicolon;
    if (sourceString.includes(stringAfterSemicolon)) {
      // If string is a subsequent source, delete it
      sourceString = sourceString.replace(stringAfterSemicolon, '');
    } else if (sourceString.includes(stringAfterColon)) {
      // If it's the ONLY source
      if (sourceString.includes('Source:')) {
        // 'Source' is singular, so there's only one citation,
        // and it's our string:
        sourceString = sourceString.replace(stringAfterColon, addToCome);
      } else {
        // Delete string if first of several sources
        sourceString = sourceString.replace(
          `${stringAfterColon}${specialStrings.semicolon}`,
          specialStrings.colon,
        );
      }
    } else {
      // If it isn't already a source, append it
      if (sourceString === 'Source: ') {
        sourceString = `${sourceString}${stringOnly}`;
      } else {
        sourceString = `${sourceString}${stringAfterSemicolon}`;
      }
      // and, since we now have a source, delete 'to come; ' (if found)
      sourceString = sourceString.replace(removeToCome, '');
    }
    this.source.value = sourceString;
    this.updateEditor();
    this.setState({ focusFootnote: '' });
  }
  // HANDLE SPECIAL SOURCE STRING ends

  // FOOTNOTE STRING TO ARRAY
  // Called from unpickFootnotes, converts complete footnote string
  // into an array of individual items
  footnoteStringToArray(fString) {
    // const symbols = this.props.footnoteSymbols;
    const symbols = this.props.config.values.footnoteSymbols;
    // First do a crude split
    const crudeArray = fString.split(' ');
    // The problem is, of course, that any one footnote may have internal spaces, so...
    const goodArray = [];
    for (let iii = crudeArray.length - 1; iii > 0; iii--) {
      const fNote = crudeArray[iii];
      const symbol = fNote.substring(0, 1);
      if (symbols.includes(symbol)) {
        goodArray.unshift(fNote);
      } else {
        // If there's no symbol, append string to previous element
        crudeArray[iii - 1] = `${crudeArray[iii - 1]} ${fNote}`;
      }
    }
    // Since I'm appending 'unsymboled' strings to previous
    // elements in crudeArray, I can't count down to zero;
    // so explicitly prepend first element:
    goodArray.unshift(crudeArray[0]);
    return goodArray;
  }
  // FOOTNOTE STRING TO ARRAY ends

  // FOOTNOTE STRINGS TO OBJECTS
  footnoteStringsToObjects(fArray) {
    // const symbols = this.props.footnoteSymbols;
    const symbols = this.props.config.values.footnoteSymbols;
    // Now, on each, separate into symbol and content
    const fObjArray = fArray.map(fNote => {
      const fObj = {};
      for (let iii = symbols.length - 1; iii >= 0; iii--) {
        const symbol = symbols[iii];
        if (fNote.includes(symbol)) {
          fObj.symbol = symbol;
          fObj.content = fNote.replace(symbol, '');
          break;
        }
      }
      return fObj;
    });
    return fObjArray;
  }
  // FOOTNOTE STRINGS TO OBJECTS ends

  // FOOTNOTE ARRAYS DIFFER
  footnoteArraysDiffer(listA, listB) {
    let result = false;
    if (listA.length !== listB.length) {
      result = true;
    } else if (listA.length === 0) {
      result = true;
    } else {
      for (let iii = 0; iii < listA.length; iii++) {
        const itemA = listA[iii];
        const itemB = listB[iii];
        if (itemA.symbol !== itemB.symbol || itemA.content !== itemB.content) {
          result = true;
          break;
        }
      }
    }
    return result;
  }
  // FOOTNOTE ARRAYS DIFFER ends

  // MAP FOOTNOTE ELEMENTS
  // Called from makeFootnotesJSX
  mapFootnoteElements() {
    // const symbols = this.props.footnoteSymbols;
    const symbols = this.props.config.values.footnoteSymbols;
    const feMap = symbols.map((symbol, fIndex) => {
      const fNoteInputKey = `footnote-input-${symbol}`;
      return (
        <div key={fIndex} className="one-footnote-div">
          <span className="footnote-symbol-label">{symbol}</span>
          <input
            className="silver-input text-field  footnote-content-input"
            ref={c => {
              this[fNoteInputKey] = c;
            }}
            id={`footnoteinput-${fIndex}`}
            onBlur={this.handleStringBlur}
          />
        </div>
      );
    });
    return feMap;
  }
  // MAP FOOTNOTE ELEMENTS ends

  // MAKE FOOTNOTES JSX
  // Constructs Footnotes fieldset. The number of footnote inputs is
  // determined by list in state
  makeFootnotesJsx() {
    // List of 'active' footnotes
    let fList = this.state.activeFootnotes;
    // If the 'focus' is empty, that means we've got props from upstairs
    // which override the footnotes (if any) held in state
    if (this.state.focusFootnote.length === 0) {
      const fString = this.props.config.values.footnote;
      // Arrayify:
      let fArray = [];
      let propList = [];
      if (fString.length > 0) {
        fArray = this.footnoteStringToArray(fString);
        // Now turn each fnote into a symbol/content object
        // Convert single string to array of individual footnotes
        propList = this.footnoteStringsToObjects(fArray);
      }
      // So if props version is different, it overrides...
      // ...but I may have to allow for final empty content in state version
      if (this.footnoteArraysDiffer(propList, fList)) {
        fList = propList;
      }
    }
    // Stack of divs for individual footnotes
    const footnoteElementArray = this.mapFootnoteElements(fList);
    const footnotesCollection = (
      <div className="footnote-strings-div">
        <div className="footnote-strings-header">
          <span className="silver-label footnote-label">Footnotes</span>
          <button
            type="button"
            className="silver-button footnote-add-div"
            onClick={this.handleAddFootnote}
          >
            <span>+</span>
          </button>
        </div>
        <div
          className="footnote-strings-body"
          ref={c => {
            this['footnote-strings-body'] = c;
          }}
        >
          {footnoteElementArray}
        </div>
      </div>
    );
    // </div>
    return footnotesCollection;
  }
  // MAKE FOOTNOTES JSX ends

  // MAKE ONE TOP DIV JSX
  // Called from makeTopJsx to generate a single string input
  // (sub/sub/title + panelHeader)
  makeOneTopDivJsx(label, id) {
    const placeholder = `Add ${id.toLowerCase()}`;
    let className = 'string-set-div';
    // But panel header hides if only one panel
    if (id.includes('panel')) {
      const { panelTotal } = this.props.config.values;
      if (panelTotal < 2) {
        className = `${className}-hidden`;
      }
    }
    return (
      <div className={className}>
        <span className="silver-label strings-label">{label}</span>
        <input
          id={id}
          ref={c => {
            this[id] = c;
          }}
          className="text-field strings-input"
          autoComplete="off"
          placeholder={placeholder}
          onBlur={this.handleStringBlur}
        />
      </div>
    );
  }
  // MAKE ONE TOP DIV JSX

  // MAKE TOP JSX
  // JSX for title, subtitle, subsubtitle & panel-header
  makeTopJsx() {
    const titleDiv = this.makeOneTopDivJsx('Title', 'title');
    const panelHeaderDiv = this.makeOneTopDivJsx('Panel header', 'panelHeader');
    const subtitleDiv = this.makeOneTopDivJsx('Subtitle', 'subtitle');
    const subsubtitleDiv = this.makeOneTopDivJsx('Sub-subtitle', 'subsubtitle');
    return (
      <div className="top-strings-div">
        {titleDiv}
        {panelHeaderDiv}
        {subtitleDiv}
        {subsubtitleDiv}
      </div>
    );
  }
  // MAKE TOP JSX ends

  // SOURCE INCLUDES JUST ECONOMIST
  // Called from makeSourcesJsx. Returns true if the source
  // includes 'The Economist' in isolation
  sourceIncludesJustEconomist(source, hasLongEiu) {
    let hasEco = false;
    const specialStrings = this.props.config.values.specialSourceStrings;
    const ecoRx = new RegExp(specialStrings.ecoStrPlain, 'g');
    const ecoMatch = source.match(ecoRx);
    if (ecoMatch !== null) {
      let ecoCount = ecoMatch.length;
      // Count occurrences. Discount long EIU string.
      if (hasLongEiu) {
        ecoCount--;
      }
      hasEco = ecoCount > 0;
    }
    return hasEco;
  }
  // SOURCE INCLUDES JUST ECONOMIST ends

  // MAKE SOURCES JSX
  // Source field, plus Economist, EIU and LSEG buttons
  makeSourcesJsx() {
    const specialStrings = this.props.config.values.specialSourceStrings;
    const source = this.props.config.values.source;
    // Flags for highlighting (string exists in source)
    const hasEiu = source.includes(specialStrings.eiuStr);
    const hasLongEiu = source.includes(specialStrings.eiuLongStr);
    const hasEconomist = this.sourceIncludesJustEconomist(source, hasLongEiu);
    // NB: Nov'23, 'Refinitiv' string replaced by 'LSEG'; but
    // button and icon retain original ID
    const hasLseg = source.includes(specialStrings.lsegStr);
    return (
      <div className="source-strings-div">
        <div className="source-strings-div-header">
          <span className="silver-label strings-label">Source</span>
          <button
            type="button"
            className={`silver-button append-economist-button ${
              hasEconomist ? 'button-selected' : ''
            }`}
            onClick={() => this.handleSpecialSourceString('eco')}
            title="Appends The Economist to the sources"
          >
            <EconomistIcon size={10} />
          </button>
          <button
            type="button"
            className={`silver-button append-eiu-button ${
              hasEiu ? 'button-selected' : ''
            }`}
            onClick={() => this.handleSpecialSourceString('eiu')}
            title="Appends EIU to the sources"
          >
            <EiuIcon size={10} />
          </button>
          <button
            type="button"
            className={`silver-button append-refinitiv-button ${
              hasLseg ? 'button-selected' : ''
            }`}
            onClick={() => this.handleSpecialSourceString('lseg')}
            title="Appends LSEG Workspace to the sources"
          >
            <RefinitivIcon size={10} />
          </button>
        </div>
        <input
          id="source"
          ref={c => {
            this.source = c;
          }}
          className="silver-input strings-input text-field"
          autoComplete="off"
          onBlur={this.handleStringBlur}
        />
      </div>
    );
  }
  // MAKE SOURCES JSX ends

  // STRINGS JSX
  // Called from render
  // Calls sub-functions to construct individual elements
  stringsJsx() {
    // Top set (above chart): title, subtitle, panel header, sub-subtitle
    const topJsx = this.makeTopJsx();
    // Sources
    const sourcesJsx = this.makeSourcesJsx();
    // Footnotes
    const footnotesJsx = this.makeFootnotesJsx();
    return (
      <div className="strings-wrapper">
        {topJsx}
        {sourcesJsx}
        {footnotesJsx}
      </div>
    );
  }
  // STRINGS JSX ends

  // RENDER
  render() {
    return this.stringsJsx();
  }
}

Strings.propTypes = {
  config: PropTypes.object.isRequired,
  onValuesToEditor: PropTypes.func.isRequired,
};

export default Strings;
