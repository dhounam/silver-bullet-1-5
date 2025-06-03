// This is cannibalised from Plunker's
// Word wrap plugin for D3.js
// https://embed.plnkr.co/plunk/YBCAc3

import * as d3 from 'd3';
// import * as ChartUtilities from '../chart-utilities';

/*  These attributes must be set on the incoming
    text elements:
      x
      y
      leading
      anchor
*/

// WRAP ALL TEXT ELEMENTS
// Called from various text-updating functions to wrap
// an array of bound elements. Params are:
//    the array of elements to wrap
//    required properties
//    the original 'this' context
//    callback after wrapping
//    an optional flag to trip debugging
//    NOTE: get rid of the debug flag
export function wrapAllTextElements(
  textElementArray,
  textWrapConfig,
  globalThis,
  afterTextWrap,
  debugFlag,
) {
  // Colours lookup now redundant
  // const colours = textWrapConfig.colours;
  // For callback: no of lines in each element
  // (passed in empty)
  const lineCountArray = [];
  // If the debugFlag exists, trips a debug point
  // NOTE: kill this... eventually
  if (typeof debugFlag !== 'undefined') {
    // eslint-disable-next-line no-debugger
    debugger;
  }
  textElementArray.each(function() {
    const textElement = d3.select(this);
    wrapOneTextElement(textElement, textWrapConfig, lineCountArray);
  });
  // If there's a callback, execute it
  if (typeof afterTextWrap !== 'undefined') {
    afterTextWrap(globalThis, lineCountArray, textWrapConfig);
  }
}
// WRAP ALL TEXT ELEMENTS ends

// WRAP ONE TEXT ELEMENT
// Called from wrapAllTextElements
// Params are a text element and the width to which to wrap
export function wrapOneTextElement(textElement, config, lineCountArray) {
  // Unpack the config properties: wrap width & tag to force line turns
  const wrapWidth = config.wWidth;
  const forceTurn = config.forceTurn;
  const forcePx = config.forcePx;
  // Arrayify text into individual words
  const firstArray = textElement.text().split(' ');
  // forceTurns may occur mid-word, so:
  const wordArray = splitArrayAtReturnTags(firstArray, forceTurn);
  // Next append words one at a time to make a line,
  // checking width until the line breaks (or finding forced turns)
  // In the resulting lineArray:
  //  -  each element representss one line
  //  -  each line-element is a sub-array of words
  const lineArray = [[]];
  let lineCount = 0;
  // Loop by words
  wordArray.forEach(function(ddd) {
    // Append one word at a time a line string
    const lineSoFar = lineArray[lineCount].concat(ddd).join(' ');
    // Test whether it breaks the line
    // NOTE: this seems a bit cumbersome. Can I improve?
    textElement.text(lineSoFar);
    if (ddd.includes(forceTurn)) {
      // Word ends with tag. Push the detagged word
      // to the existing line, and add a new line-element
      // to the array
      lineArray[lineCount].push(ddd.replace(forceTurn, ''));
      lineCount++;
      lineArray[lineCount] = [];
    } else if (lineBreaks(textElement, wrapWidth)) {
      // String should auto-turn. Add new line-element
      // to the array, and push the word there
      lineCount++;
      lineArray[lineCount] = [];
      lineArray[lineCount].push(ddd);
    } else {
      // Just push the word to the existing line
      lineArray[lineCount].push(ddd);
    }
  });
  // I may have an empty first element, which I kill:
  // FIXME: this happens if first word breaks width,
  // so fix upstairs... one day...
  if (lineArray[0].length === 0) {
    lineArray.shift();
  }
  // Re-concatenate sub-arrays of words back into strings
  const joinedArray = lineArray.map(line => line.join(' '));
  // If individual lines contain emphasis tags, I have to
  // separate those out into separate elements, so that
  // each element of the array represents a tspan
  const tSpanReadyArray = makeTspanReadyArray(joinedArray);
  textElement.call(tSpanify, tSpanReadyArray, forcePx);
  // Append the number of *lines* to the counter-array
  lineCountArray.push(joinedArray.length);
}
// WRAP ONE TEXT ELEMENT ends

// MAKE THREE NB-SPACES
// Called from splitArrayAtReturnTags. Just returns
// 3 non-breaking spaces
export function makeThreeNbSpaces() {
  const nbsp = String.fromCharCode(160);
  return `${nbsp}${nbsp}${nbsp}`;
}
// MAKE THREE NB-SPACES ends

// SPLIT ARRAY AT RETURN TAGS
// Called from wrapOneTextElement to handle mid-word return tags
// Result is an array of words, with tag attached to word
// after which we turn the line
export function splitArrayAtReturnTags(myArray, forceTurn) {
  const result = [];
  const threeNbSpaces = makeThreeNbSpaces();
  for (let iii = 0; iii < myArray.length; iii++) {
    const word = myArray[iii];
    if (word.includes(forceTurn)) {
      const splitWord = word.split(forceTurn);
      // If there's a tag, split word there and push
      // (all words except last, with tag)
      const wLen = splitWord.length - 1;
      for (let wNo = 0; wNo < wLen; wNo++) {
        let el = splitWord[wNo];
        // Don't delete the three nbsps that precede
        // a footnote symbol
        if (!el.includes(threeNbSpaces)) {
          el = el.trim();
        }
        if (el.length > 0) {
          // If turned at end of string, ignore empty element
          result.push(`${el}${forceTurn}`);
        }
      }
      // last word (no tag)
      result.push(splitWord[wLen].trim());
    } else {
      // No tag, just push the word
      result.push(word);
    }
  }
  return result;
}
// SPLIT ARRAY AT RETURN TAGS

// LINE BREAKS
// Called from wrapOneTextElement to determine whether text needs
// to autowrap. Removes tags before checking.
export function lineBreaks(textElement, wrapWidth) {
  const tNode = textElement.node();
  const originalContent = tNode.innerHTML;
  // Strip opening and closing emphasis tags
  const openIt = '&lt;i&gt;';
  const closeIt = '&lt;/i&gt;';
  const openBo = '&lt;b&gt;';
  const closeBo = '&lt;/b&gt;';
  let testContent = originalContent.replace(openIt, '');
  testContent = testContent.replace(closeIt, '');
  testContent = testContent.replace(openBo, '');
  testContent = testContent.replace(closeBo, '');
  // Remove any 'nospace' tag (allows mid-word ital'n)
  testContent = testContent.replace('nospacebefore', '');
  testContent = testContent.replace('nospaceafter', '');
  // Test length with stripped content
  tNode.innerHTML = testContent;
  const bbx = tNode.getBBox();
  const turnLine = bbx.width > wrapWidth;
  // Put original content back
  tNode.innerHTML = originalContent;
  return turnLine;
}
// LINE BREAKS ends

// T-SPANIFY
// Called from wrapOneTextElement to append tSpans to the
// text element
// Each element of lineArray is one line of the string
// (as determined by autowrap or hard return). Each line element
// is, in turn, an array of individual words
export function tSpanify(textElement, lineArray) {
  const teX = +textElement.attr('x');
  const leading = +textElement.attr('leading');
  const fontFamily = textElement.style('font-family');
  // Empty the actual text element: we only want t-spans
  textElement.text('');
  textElement
    .selectAll('tspan')
    .data(lineArray)
    .enter()
    .append('tspan')
    .attr({
      x: ddd => {
        let xPos = null;
        if (ddd.newline) {
          xPos = teX;
        }
        return xPos;
      },
      // See below for y
    })
    .style({
      'font-family': ddd => {
        let fam = fontFamily;
        if (ddd.italics) {
          // Kludge, Jan'24. Old 'Econ' fonts append 'Ita';
          // new 'Economist' fonts append 'Italic'
          if (fam.includes('Economist')) {
            fam = `${fam}Italic`;
          } else {
            fam = `${fam}Ita`;
          }
        }
        return fam;
      },
    })
    .text(ddd => ddd.content);

  // I only want to reset y coord on tSpans that
  // start a new line (so don't move italicised spans)
  // Start at y - leading: first 'newline' will bring us
  // into position
  let teY = +textElement.attr('y') - leading;
  textElement.selectAll('tspan').each(function() {
    const thisSpan = d3.select(this);
    thisSpan.attr({
      y: ddd => {
        let yPos = null;
        if (ddd.newline) {
          // Increment y coord
          teY += leading;
          yPos = teY;
        }
        return yPos;
      },
    });
  });
}
// T-SPANIFY ends

// MAKE T-SPAN-READY ARRAY
// Called from wrapOneTextElement.
// The arg is an array of lines of text in a text element
// However, I need to generate separate tSpans for any
// italicised strings. So this function creates those.
export function makeTspanReadyArray(lineArray) {
  // New array of all tspan definitions
  const spannedArray = [];
  const tagRx = /<.*?>/;
  // Initially, italics are off
  let iOn = false;
  for (let lineNo = 0; lineNo < lineArray.length; lineNo++) {
    const thisLine = lineArray[lineNo];
    if (thisLine.match(tagRx) === null) {
      // No tags: append to array,
      // flagged as new line, with inherited italicisation
      spannedArray.push({
        content: thisLine,
        italics: iOn,
        newline: true,
      });
    } else {
      // Pass tagged lines to a handler. The array
      // will be updated by ref with new tpan defs.
      // iOn is italics state at end of line, to carry
      // forward to next...
      iOn = unpickTaggedLine(thisLine, iOn, spannedArray);
    }
  }
  return spannedArray;
}
// MAKE T-SPAN-READY ARRAY ends

// UNPICK TAGGED LINE
// Called from makeTspanReadyArray
// Args are the line of text; the inherited italics flag;
// the ongoing array, to which items will be appended
export function unpickTaggedLine(thisLine, iOn, spannedArray) {
  const tagRx = /<.*?>/g;
  const openItal = '<i>';
  const len = thisLine.length;
  const matches = Array.from(thisLine.matchAll(tagRx));
  // matches is an array of objs with props like:
  //    0: "<i>"
  //    index: 15
  // Start of line:
  let posA = 0;
  // First element will be a new line; for subsequent elements
  // flag is false.
  let newline = true;
  for (let iii = 0; iii < matches.length; iii++) {
    const myMatch = matches[iii];
    const posB = myMatch.index;
    const content = thisLine.substring(posA, posB);
    // Only append the span (and reset newline) if it has content
    if (content.length > 0) {
      spannedArray.push({
        content,
        italics: iOn,
        newline,
      });
      newline = false;
    }
    posA = posB + myMatch[0].length;
    iOn = myMatch[0] === openItal;
  }
  // Append remainder of line
  spannedArray.push({
    content: thisLine.substring(posA, len),
    italics: iOn,
    newline,
  });
  // Return italics state for next line...
  return iOn;
}
// UNPICK TAGGED LINE

// FIX ITALICS TAGS
// I have to 'fix' the text object's 'content' attr,
// since if it contains the <i> or </i> tags, that invalidates the SVG.
// So replace '<>' with '[]'
export function fixItalicsTags(thisText) {
  let iFixStr = thisText.attr('content').replace(/</g, '[');
  iFixStr = iFixStr.replace(/>/g, ']');
  iFixStr = iFixStr.replace('nospacebefore', '');
  iFixStr = iFixStr.replace('nospaceafter', '');
  thisText.attr('content', iFixStr);
}
// FIX ITALICS TAGS ends

// FIX CHEVRONS
// I have to 'fix' the text object's 'content' attr,
// since if it contains the <i> or </i> tags, that invalidates the SVG.
// So replace '<>' with '[]'
export function fixChevrons(thisText) {
  let iFixStr = thisText.attr('content').replace(/</g, '[');
  iFixStr = iFixStr.replace(/>/g, ']');
  iFixStr = iFixStr.replace('nospacebefore', '');
  iFixStr = iFixStr.replace('nospaceafter', '');
  thisText.attr('content', iFixStr);
}
// FIX CHEVRONS ends

// GET TEXT AND TSPANS MOVE
// Variously called to count newline tspans and return
// either the number of lines or the distance by which
// an element has to be moved vertically
export function getTextAndTspansMove(d3El, leading = 1) {
  let tweak = 0;
  if (leading > 1) {
    // To get a move-distance, rather than number of lines
    tweak -= leading;
  }
  d3El.selectAll('tspan').each(function() {
    const thisSpan = d3.select(this);
    const spanY = thisSpan.attr('y');
    if (spanY !== null) {
      tweak += leading;
    }
  });
  return tweak;
}
// GET TEXT AND TSPANS MOVE ends

// MOVE TEXT AND TSPANS
// As previous, except that passed text is a D3 selection
// FIXME: a little consistency wouldn't go amiss
export function moveTextAndTspans(tElement, moveBy) {
  const yPos = +tElement.attr('y');
  tElement.attr('y', yPos + moveBy);
  tElement.selectAll('tspan').each(function() {
    const thisSpan = d3.select(this);
    const spanY = thisSpan.attr('y');
    // Only tweak tspans that start a new line
    if (spanY !== null) {
      thisSpan.attr('y', +spanY + moveBy);
    }
  });
}
// MOVE D3 TEXT AND TSPANS
