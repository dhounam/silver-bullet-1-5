// Assembly and download of PNG and SVG files
// Default function at bottom calls internal functions.
/* eslint-disable no-undef, no-unreachable */

import * as GIF from 'gif.js';
import * as d3 from 'd3';

// DOWNSIZE SVG
// Called from downloadPng/Gif
// Returns SVG to original size after PNG/GIF bump-up
function downsizeSvg() {
  const chart = d3.select('.silver-chartwrapper > svg');
  // Reset attributes
  chart.attr('transform', null);
  chart.attr('width', null);
  chart.attr('height', null);
}
// DOWNSIZE SVG

// DOWNLOAD SVG
// Passed the complete svg text, downloads it to a datastamped .svg file...
function downloadSvg(text, fileName) {
  // Download element
  const aElement = document.createElement('a');
  aElement.setAttribute(
    'href',
    `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`,
  );
  // Append '.svg' suffix
  aElement.setAttribute('download', `${fileName}.svg`);
  document.body.appendChild(aElement);
  // Send click event
  // if (document.createEvent) {
  //   const event = document.createEvent('MouseEvents');
  //   event.initEvent('click', true, true);
  //   aElement.dispatchEvent(event);
  // } else {
  aElement.click();
  // }
  document.body.removeChild(aElement);
}
// DOWNLOAD SVG ends

// COMPLETE SVG
// Called from processExport. Args are the 'raw' svg
// from the chart; chart dimensions; the SVG config object;
// and the colourSpace value
// Prefixes and appends svg header, viewbox, etc to the raw svg
function completeSvg(svgString, dimensions, svgConfig, colourSpace) {
  // Drop the enclosing svg tags from the svgString
  // First tag
  let mySvgStr = svgString.replace(/^<.*?>/, '');
  // Final tag
  mySvgStr = mySvgStr.replace(/<\/svg>/, '');
  // Assemble an SVG file from boilerplate
  let svg = '';
  // Illustrator header (from imported SVG config file)
  for (const tag in svgConfig.svg.openTag) {
    if (svgConfig.svg.openTag.hasOwnProperty(tag)) {
      let myTag = svgConfig.svg.openTag[tag];
      // Catch the artboard settings and insert chart h/w...
      if (myTag.includes('viewBox')) {
        myTag = myTag.replace('width', dimensions.width);
        myTag = myTag.replace('height', dimensions.height);
      }
      svg += myTag;
    }
  }
  // Embed content in group with transform down the page
  if (colourSpace === 'rgb') {
    svg += svgConfig.svg.transformRgb;
  } else {
    svg += svgConfig.svg.transformCmyk;
  }
  // Actual SVG content
  svg += mySvgStr;
  // ...and footer
  svg += svgConfig.svg.footer;
  return svg;
}
// COMPLETE SVG ends

// DOWNLOAD PNG
// Passed the SVG string and its dimensions, throws it at a canvas
// and downloads as PNG
function downloadPng(svgString, dimensions, fileName) {
  const doctype =
    '<?xml version="1.0" standalone="no"?>' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

  // create a file blob of our SVG.
  const blob = new Blob([doctype + svgString], {
    type: 'image/svg+xml',
  });
  const url = window.URL.createObjectURL(blob);

  // Put the svg into an image tag so that the Canvas element can read it in.
  const img = document.createElement('img');
  img.setAttribute('width', dimensions.width);
  img.setAttribute('height', dimensions.height);
  img.setAttribute('style', 'display:none');
  document.body.appendChild(img);

  // onload fires when image has loaded...
  img.onload = () => {
    // Now that the image has loaded, put the image into a canvas element
    const canv = document.createElement('canvas');
    canv.id = 'pngCanvas';
    canv.width = dimensions.width;
    canv.height = dimensions.height;
    canv.setAttribute('style', 'display:none');
    document.body.appendChild(canv);
    const ctx = canv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const canvasUrl = canv.toDataURL('image/png');
    const imgTwo = document.createElement('img');
    imgTwo.setAttribute('width', dimensions.width);
    imgTwo.setAttribute('height', dimensions.height);
    imgTwo.setAttribute('style', 'display:none');
    document.body.appendChild(imgTwo);

    // This is now the base64 encoded version of the PNG
    imgTwo.src = canvasUrl;

    // Download the data...
    const aElement = document.createElement('a');
    aElement.download = `${fileName}.png`;
    aElement.href = canvasUrl;
    document.body.appendChild(aElement);
    aElement.click();
    // ...and get rid of the bodies
    img.parentNode.removeChild(img);
    imgTwo.parentNode.removeChild(imgTwo);
    canv.parentNode.removeChild(canv);
    document.body.removeChild(aElement);
    window.URL.revokeObjectURL(url);
    // Revert to original size
    downsizeSvg();
  };
  // Start loading the image (triggering the fcn above)
  img.src = url;
}
// DOWNLOAD PNG ends

// MAKE GIF
// Called from downloadGif to lever gif.js
function makeGif(
  imgTwo,
  ctx,
  pasteCanvas,
  dimensions,
  url,
  fileName,
  img,
  canv,
) {
  const gif = new GIF({
    workers: 3,
    workerScript: url,
    quality: 1,
    repeat: 0,
    // debug: true,
    width: dimensions.width,
    height: dimensions.height,
  });

  // I have a series of options, according to
  // what gets passed in...
  if (typeof canvas === 'undefined') {
    // Add an image element
    gif.addFrame(img);
  } else if (pasteCanvas) {
    // Or copy the pixels from a canvas context
    gif.addFrame(ctx, { copy: true, delay: 1000 });
  } else {
    // Or add a canvas element
    gif.addFrame(ctx, { delay: 200 });
  }

  gif.on('finished', function(blob) {
    // Download the data...
    const aElement = document.createElement('a');
    aElement.download = `${fileName}.gif`;
    aElement.href = URL.createObjectURL(blob);
    document.body.appendChild(aElement);
    aElement.click();
    // ...and get rid of the bodies
    img.parentNode.removeChild(img);
    imgTwo.parentNode.removeChild(imgTwo);
    canv.parentNode.removeChild(canv);
    document.body.removeChild(aElement);
    window.URL.revokeObjectURL(url);
  });

  gif.render();
}

// DOWNLOAD GIF
// Passed the SVG string and its dimensions, throws it at a canvas
// and downloads as GIF
// NOTE: this duplicates downloadPng like hell. Refactor when working
function downloadGif(svgString, dimensions, fileName) {
  const doctype =
    '<?xml version="1.0" standalone="no"?>' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

  // create a file blob of our SVG.
  const blobA = new Blob([doctype + svgString], {
    type: 'image/svg+xml',
  });
  const url = window.URL.createObjectURL(blobA);

  // Put the svg into an image tag so that the Canvas element can read it in.
  const img = document.createElement('img');
  img.setAttribute('width', dimensions.width);
  img.setAttribute('height', dimensions.height);
  img.setAttribute('style', 'display:none');
  document.body.appendChild(img);
  // onload fires when image has loaded...
  img.onload = () => {
    // Now that the image has loaded, put the image into a canvas element
    const canv = document.createElement('canvas');
    canv.id = 'pngCanvas';
    canv.width = dimensions.width;
    canv.height = dimensions.height;
    canv.setAttribute('style', 'display:none');
    document.body.appendChild(canv);
    const ctx = canv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    // So at this point there's a canvas displaying the chart

    // There's three ways of going at this:
    // To derive the Gif from the entire canvas
    // makeGif(undefined, ctx, false, dimensions);
    // By pasting pixels from the canvas
    // makeGif(undefined, ctx, true, dimensions);
    // Or, from the image
    // makeGif(img, undefined, false, dimensions);
    const canvasUrl = canv.toDataURL('image/gif');
    const imgTwo = document.createElement('img');
    imgTwo.setAttribute('width', dimensions.width);
    imgTwo.setAttribute('height', dimensions.height);
    imgTwo.setAttribute('style', 'display:none');
    document.body.appendChild(imgTwo);

    // This is now the base64 encoded version of the PNG
    imgTwo.src = canvasUrl;

    // load the GIF web worker
    // we have to add the js file in our static folder and then fetch
    // https://observablehq.com/@mbostock/canvas-to-gif
    fetch('gif.worker.js')
      .then(response => response.blob())
      .then(blob =>
        URL.createObjectURL(blob, {
          type: 'text/javascript',
        }),
      )
      .then(workerUrl =>
        makeGif(
          imgTwo,
          undefined,
          false,
          dimensions,
          workerUrl,
          fileName,
          img,
          canv,
        ),
      );
    // Revert to original size
    downsizeSvg();
  };
  // Start loading the image (triggering the fcn above)
  img.src = url;
}
// DOWNLOAD GIF ends

// GET LONGEST SVG STRING
// Called from default. Generates 5 svg strings and returns the longest
function getLongestSvgString(svgAsXml) {
  const svgArray = [];
  for (let sNo = 0; sNo < 5; sNo++) {
    const svgStr = new XMLSerializer().serializeToString(svgAsXml);
    const svgLen = svgStr.length;
    svgArray.push({ svgStr, svgLen });
  }
  // Sort in descending order and return first
  svgArray.sort((a, b) => {
    return b.svgLen - a.svgLen;
  });
  return svgArray[0].svgStr;
}
// GET LONGEST SVG STRING

// PROCESS EXPORT
// Called from default. Args are:
// true for SVG, false for PNG
// dimensions of chart
// File name
// the SVG config object
// NOTE: really, this should be in props here
export function processExport(
  colourSpace,
  dimensions,
  fileName,
  isPng,
  isSvg,
  svgConfig,
) {
  // Pull in the svg and convert to string form:
  // NOTE: this could do with sorting out properly...
  const svgAsXml = document.querySelector('.silver-chartwrapper > svg');
  // const svgString = new XMLSerializer().serializeToString(svgAsXml);
  const svgString = getLongestSvgString(svgAsXml);
  if (isSvg) {
    const svgExport = completeSvg(
      svgString,
      dimensions,
      svgConfig,
      colourSpace,
    );
    // And call function to download
    downloadSvg(svgExport, fileName, svgConfig);
  } else if (isPng) {
    // PNG or GIF
    downloadPng(svgString, dimensions, fileName);
  } else {
    downloadGif(svgString, dimensions, fileName);
  }
}
// PROCESS EXPORT ends

// DEFAULT
// Callback from footer.js > handleSvg/Png/GifExportClick
// Simply unpicks args before calling processExport
export default function(argObj) {
  processExport(
    argObj.colourSpace,
    argObj.dimensions,
    argObj.fileName,
    argObj.isPng,
    argObj.isSvg,
    argObj.svgConfig,
  );
}
// This earlier version used a timeout
// export default function(isSvg, dimensions, fileName, svgConfig, isPng) {
//   setTimeout(() => {
//     processExport(isSvg, dimensions, fileName, svgConfig, isPng);
//   }, 100);
// }
