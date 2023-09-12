/* eslint-disable jsx-a11y/no-autofocus */

// FIXME: May 2019, footnote handling needs refactoring
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import EconomistIcon from '../icons/economist-icon';
import EiuIcon from '../icons/eiu-icon';
import RefinitivIcon from '../icons/refinitiv-icon';

class Strings extends Component {
  static get defaultProps() {
    return {
      ecoStrPlain: 'The Economist',
      ecoStrItal: '<i>The Economist</i>',
      ecoStrAfterSemicolon: '; <i>The Economist</i>',
      ecoStrAfterColon: ': <i>The Economist</i>',
      eiuStr: 'The Economist Intelligence Unit',
      eiuStrAfterSemicolon: '; The Economist Intelligence Unit',
      eiuStrAfterColon: ': The Economist Intelligence Unit',
      refStr: 'Refinitiv Datastream',
      refStrAfterSemicolon: '; Refinitiv Datastream',
      refStrAfterColon: ': Refinitiv Datastream',
      semicolon: ';',
      semicolonSpace: '; ',
      colon: ':',
      colonSpace: ': ',
      br: '<br>',
      spaceBr: ' <br>',
      footnoteSymbols: ['*', '†', '‡', '§', '**', '††', '‡‡', '§§'],
    };
  }

  // CONSTRUCTOR
  // Creates empty array of footnote items
  // Sets up the event listener
  constructor(props) {
    super(props);
    this.state = {
      // This will be an array of objects, each with props 'symbol' and 'content'
      // FIXME: I suspect, July'20, that this may be redundant. Revisit...
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
    this.handleEcoString = this.handleEcoString.bind(this);
    this.handleEiuString = this.handleEiuString.bind(this);
    this.handleRefinitivString = this.handleRefinitivString.bind(this);
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

  // *** EVENT LISTENERS ***

  // GET FOOTNOTES
  // Called from handleStringBlur to concatenate footnote strings
  // (I can't get list from state, because last-added content
  // isn't in state yet)
  getFootnotes() {
    const symbolList = this.props.footnoteSymbols;
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
    const symbols = this.props.footnoteSymbols;
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
  // newly-visible footnote div. So Timeout just ensure that
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
    const symbols = this.props.footnoteSymbols;
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
    let str = source.trim();
    if (str.length === 0) {
      return str;
    }
    const sColon = this.props.semicolon;
    const scSpace = this.props.semicolonSpace;
    const colon = this.props.colon;
    const cSpace = this.props.colonSpace;
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
    str = str.replace(this.props.spaceBr, this.props.br);
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
    const ecoStrPlain = this.props.ecoStrPlain;
    const ecoStrItal = this.props.ecoStrItal;
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
    const semicolon = this.props.semicolon;
    // The string could include both simple 'Eco' and 'EIU',
    // so arrayify
    // (element 0 will include prefix, but I don't think that matters)
    const sArray = source.split(semicolon);
    const italicisedSource = sArray.map(oneSource => {
      if (!oneSource.includes(this.props.eiuStr)) {
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
    const hasChanged = newVal !== oldVal;
    if (hasChanged) {
      this.setState({
        [newVal]: newVal,
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

  // HANDLE ECO STRING
  // Append or remove '<i>The Economist</i>' to/from the source string
  handleEcoString() {
    const sourceInput = this.source;
    let sourceString = sourceInput.value;
    // Economist with preceding semi-colon...
    const ecoStrAfterSemicolon = this.props.ecoStrAfterSemicolon;
    // ...or preceding colon
    const ecoStrAfterColon = this.props.ecoStrAfterColon;
    if (sourceString.includes(ecoStrAfterSemicolon)) {
      // If Eco is a subsequent source, delete it
      sourceString = sourceString.replace(ecoStrAfterSemicolon, '');
    } else if (sourceString.includes(ecoStrAfterColon)) {
      // If it's the ONLY source, replace with default
      if (sourceString.includes('Source:')) {
        sourceString = sourceString.replace(ecoStrAfterColon, ': to come');
      } else {
        sourceString = sourceString.replace(`${ecoStrAfterColon};`, ':');
      }
    } else {
      // If it isn't already a source, append it
      sourceString = `${sourceString}${ecoStrAfterSemicolon}`;
    }
    this.source.value = sourceString;
    this.updateEditor();
    this.setState({ focusFootnote: '' });
  }
  // HANDLE ECO STRING ends

  // HANDLE EIU STRING
  // Append or remove 'The Economist Intelligence Unit' to/from the source string
  handleEiuString() {
    let sourceString = this.source.value;
    // Remove EIU-style final full stop(s)
    while (sourceString.slice(-1) === '.') {
      sourceString = sourceString.slice(0, -1);
    }
    // EIU with preceding semi-colon...
    const eiuStrAfterSemicolon = this.props.eiuStrAfterSemicolon;
    // ...or preceding colon
    const eiuStrAfterColon = this.props.eiuStrAfterColon;
    if (sourceString.includes(eiuStrAfterSemicolon)) {
      // If EIU is a subsequent source, delete it
      sourceString = sourceString.replace(eiuStrAfterSemicolon, '');
    } else if (sourceString.includes(eiuStrAfterColon)) {
      // If it's the ONLY source, replace with default
      if (sourceString.includes('Source:')) {
        sourceString = sourceString.replace(eiuStrAfterColon, ': to come');
      } else {
        sourceString = sourceString.replace(`${eiuStrAfterColon};`, ':');
      }
    } else {
      // If it isn't already a source, append it
      sourceString = `${sourceString}${eiuStrAfterSemicolon}`;
    }
    this.source.value = sourceString;
    this.updateEditor();
    this.setState({ focusFootnote: '' });
  }
  // HANDLE EIU STRING ends

  // HANDLE REFINITIV STRING
  // Append or remove 'Refinitiv Datastream' to/from the source string
  handleRefinitivString() {
    let sourceString = this.source.value;
    // Remove EIU-style final full stop(s)
    while (sourceString.slice(-1) === '.') {
      sourceString = sourceString.slice(0, -1);
    }
    // RD with preceding semi-colon...
    const refStrAfterSemicolon = this.props.refStrAfterSemicolon;
    // ...or preceding colon
    const refStrAfterColon = this.props.refStrAfterColon;
    if (sourceString.includes(refStrAfterSemicolon)) {
      // If RD is a subsequent source, delete it
      sourceString = sourceString.replace(refStrAfterSemicolon, '');
    } else if (sourceString.includes(refStrAfterColon)) {
      // If it's the ONLY source, replace with default
      if (sourceString.includes('Source:')) {
        sourceString = sourceString.replace(refStrAfterColon, ': to come');
      } else {
        sourceString = sourceString.replace(`${refStrAfterColon};`, ':');
      }
    } else {
      // If it isn't already a source, append it
      sourceString = `${sourceString}${refStrAfterSemicolon}`;
    }
    this.source.value = sourceString;
    this.updateEditor();
    this.setState({ focusFootnote: '' });
  }
  // HANDLE REFINITIV STRING ends

  // ______________________________
  // *** JSX ASSEMBLY FUNCTIONS ***

  // FOOTNOTE STRING TO ARRAY
  // Called from unpickFootnotes, converts complete footnote string
  // into an array of individual items
  footnoteStringToArray(fString) {
    const symbols = this.props.footnoteSymbols;
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
    const symbols = this.props.footnoteSymbols;
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
    const symbols = this.props.footnoteSymbols;
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
  // includes 'The Economist'
  sourceIncludesJustEconomist(source, hasEiu) {
    let hasEco = false;
    const ecoRx = new RegExp(this.props.ecoStrPlain, 'g');
    const ecoMatch = source.match(ecoRx);
    if (ecoMatch !== null) {
      let ecoCount = ecoMatch.length;
      // Count occurrences. Discount EIU string.
      if (hasEiu) {
        ecoCount--;
      }
      hasEco = ecoCount > 0;
    }
    return hasEco;
  }
  // SOURCE INCLUDES JUST ECONOMIST ends

  // MAKE SOURCES JSX
  // Source field, plus Economist, EIU and Refinitiv buttons
  makeSourcesJsx() {
    const source = this.props.config.values.source;
    // Flags for highlighting (string exists in source)
    const hasEiu = source.includes(this.props.eiuStr);
    const hasEconomist = this.sourceIncludesJustEconomist(source, hasEiu);
    const hasRef = source.includes(this.props.refStr);
    return (
      <div className="source-strings-div">
        <div className="source-strings-div-header">
          <span className="silver-label strings-label">Source</span>
          <button
            type="button"
            className={`silver-button append-economist-button ${
              hasEconomist ? 'button-selected' : ''
            }`}
            onClick={this.handleEcoString}
            title="Appends The Economist to the sources"
          >
            <EconomistIcon size={10} />
          </button>
          <button
            type="button"
            className={`silver-button append-eiu-button ${
              hasEiu ? 'button-selected' : ''
            }`}
            onClick={this.handleEiuString}
            title="Appends The Economist Intelligence Unit to the sources"
          >
            <EiuIcon size={10} />
          </button>
          <button
            type="button"
            className={`silver-button append-refinitiv-button ${
              hasRef ? 'button-selected' : ''
            }`}
            onClick={this.handleRefinitivString}
            title="Appends Refinitiv Datastream to the sources"
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
  footnoteSymbols: PropTypes.array,
  ecoStrPlain: PropTypes.string,
  ecoStrItal: PropTypes.string,
  ecoStrAfterSemicolon: PropTypes.string,
  ecoStrAfterColon: PropTypes.string,
  eiuStr: PropTypes.string,
  eiuStrAfterSemicolon: PropTypes.string,
  eiuStrAfterColon: PropTypes.string,
  refStr: PropTypes.string,
  refStrAfterSemicolon: PropTypes.string,
  refStrAfterColon: PropTypes.string,
  semicolon: PropTypes.string,
  semicolonSpace: PropTypes.string,
  colon: PropTypes.string,
  colonSpace: PropTypes.string,
  br: PropTypes.string,
  spaceBr: PropTypes.string,
};

export default Strings;
