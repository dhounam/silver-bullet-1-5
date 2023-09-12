// Footer component includes file-naming and SVG/PNG export
// Child of Editor
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

import BaseLinePhotoIcon from '../icons/baseline-photo-icon';
import BaseLineCameraIcon from '../icons/baseline-camera-icon';
import InsertChartIcon from '../icons/insert-chart-icon';

// SVG external functions
import Export from '../../export/export';
import SvgConfig from '../../export/svgconfig.json';
import * as Filename from '../utilities/filename';

class FooterWrapper extends Component {
  // *** REACT LIFECYCLE STUFF ***

  static get defaultProps() {
    // Timeout is a suck-it-and-see delay
    // before resizing for PNG/GIFexport
    return {
      timeout: 200,
    };
  }

  constructor(props) {
    super(props);
    // Events
    this.handleSvgExportClick = this.handleSvgExportClick.bind(this);
    this.handlePngExportClick = this.handlePngExportClick.bind(this);
    this.handleGifExportClick = this.handleGifExportClick.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleSectionChange = this.handleSectionChange.bind(this);
  }

  // *** EVENT HANDLERS ***

  // HANDLE SVG-EXPORT CLICK
  // Calls external function in export.js
  handleSvgExportClick() {
    const colourSpace = this.props.config.colourSpace;
    const fileName = this.props.config.fileNameObj.name;
    const { dimensions } = this.props.config;
    const exProps = {
      colourSpace,
      dimensions,
      fileName,
      isPng: false,
      isSvg: true,
      svgConfig: SvgConfig,
    };
    setTimeout(() => {
      Export(exProps);
    }, this.props.timeout);
  }

  // UPSIZE SVG
  // Called from handlePngExportClick. Bumps up
  // the size of the SVG so that exported PNG/GIF
  // is larger than life.
  // (Export.downsizeSvg returns to original size)
  upsizeSvg(scaleBy, imgDims, exportCallback, ecArgs) {
    const chart = d3.select('.silver-chartwrapper > svg');
    // The img element scales from the centre, so when I scale the SVG
    // gets shunted out of sight and I have to translate it back
    // Half width and height of the img element
    const halfWidth = imgDims.width / 2;
    const halfHeight = imgDims.height / 2;
    // It's initially at '0,0' which means, by some logic that I can only
    // make sense of by drawing it, that I have to move it by
    // (scaleBy - 1) times the halfWidth/Height
    const moveFactor = scaleBy - 1;
    const translateX = moveFactor * halfWidth;
    const translateY = moveFactor * halfHeight;

    // FIXME: PNG export doesn't work well on Safari (no scaling)
    // https://stackoverflow.com/questions/48248512/svg-transform-rotate180-does-not-work-in-safari-11
    chart.attr(
      'transform',
      `translate(${translateX}, ${translateY}) scale(${scaleBy}, ${scaleBy})`,
    );
    chart.attr('width', imgDims.width);
    chart.attr('height', imgDims.height);
    exportCallback(ecArgs);
  }
  // UPSIZE SVG ends

  // HANDLE PNG-EXPORT CLICK
  handlePngExportClick() {
    const fileName = this.props.config.fileNameObj.name;
    // Get the width to which we resize the PNG
    const { dimensions } = this.props.config;
    // const {pngWidth} = dimensions;
    const scaleBy = this.props.config.pngFactor;
    const pngDims = {
      width: dimensions.width * scaleBy,
      height: dimensions.height * scaleBy,
    };
    // We bump up the SVG, then send a callback to
    // complete the process
    const ecArguments = {
      isSvg: false,
      dimensions: pngDims,
      fileName,
      svgConfig: SvgConfig,
      isPng: true,
    };
    // Bump up the SVG, after a moment
    setTimeout(() => {
      this.upsizeSvg(scaleBy, pngDims, Export, ecArguments);
    }, this.props.timeout);
    // Call Export's default function to create and download image
    // (that sets a second, longer timeout)
    // Export(false, pngDims, fileName, SvgConfig, true);
  }
  // HANDLE PNG-EXPORT CLICK ends

  // HANDLE GIF-EXPORT CLICK
  handleGifExportClick() {
    const fileName = this.props.config.fileNameObj.name;
    // Get the width to which we resize the PNG
    const { dimensions } = this.props.config;
    // const {pngWidth} = dimensions;

    // Per EIU request GIF files are only scaled by 2x
    const scaleBy = this.props.config.gifFactor;
    const pngDims = {
      width: dimensions.width * scaleBy,
      height: dimensions.height * scaleBy,
    };
    // Bump up the SVG, after a moment
    const ecArguments = {
      isSvg: false,
      dimensions: pngDims,
      fileName,
      svgConfig: SvgConfig,
      isPng: false,
    };
    setTimeout(() => {
      this.upsizeSvg(scaleBy, pngDims, Export, ecArguments);
    }, this.props.timeout);
    // Call Export's default function to create and download image
    // (that sets a second, longer timeout)
    // Export(false, pngDims, fileName, SvgConfig, false);
  }
  // HANDLE GIF-EXPORT CLICK ends

  // HANDLE DATE CHANGE
  handleDateChange({ target: { value } }) {
    // Value is index of item selected
    const fnObj = this.props.config.fileNameObj;
    // We want yyyymmdd
    const date = fnObj.dates.datesYmd[value];
    // Get section
    const section = fnObj.sections.list[fnObj.sections.index].code;
    const vals = {
      date,
      dateIndex: value,
      section,
      sectionIndex: fnObj.sections.index,
    };
    this.props.onValuesToEditor(vals);
  }
  // HANDLE DATE CHANGE ends

  // HANDLE SECTION CHANGE
  handleSectionChange({ target: { value } }) {
    // Value is index of item selected
    const fnObj = this.props.config.fileNameObj;
    // Selected element: we want code only
    const section = this.props.config.fileNameObj.sections.list[value].code;
    // Get date
    const date = fnObj.dates.datesYmd[fnObj.dates.dateIndex];
    const vals = {
      date,
      dateIndex: fnObj.dates.dateIndex,
      section,
      sectionIndex: value,
    };
    this.props.onValuesToEditor(vals);
  }
  // HANDLE SECTION CHANGE ends

  getMdDateFromYyyyMmDd(ymd) {
    // Month and day
    const mNo = ymd.substr(4, 2);
    const dNo = ymd.substr(6, 2);
    const mNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    let mmmDd = mNames[mNo - 1];
    mmmDd = `${mmmDd} ${dNo}`;
    return mmmDd;
  }

  // SET EXPORT BUTTONS DISABILITY
  // Called from makeFooterJsx to determine whether export
  // buttons are disabled because section is still set to default
  // (but only if there are alternatives to the default)
  // As of Aug'20, no longer called
  setExportButtonsDisability(fnObj) {
    let disabled = false;
    const sectionLen = fnObj.sections.list.length;
    const defaultSection = fnObj.sections.default;
    const currentSection = Filename.getFilenameSectionId(fnObj.name);
    if (sectionLen > 1) {
      disabled = currentSection === defaultSection;
    }
    return disabled;
  }
  // SET EXPORT BUTTONS DISABILITY ends

  // MAKE FOOTER JSX
  // Assembles all JSX
  makeFooterJsx() {
    const config = this.props.config;
    // fnObj has properties: dates, sections and fileName
    const fnObj = Object.assign({}, config.fileNameObj);
    // Get date element (yyyymmdd) from filename. Get its index
    // in the array of yyymmdd dates
    const fileDate = fnObj.name.split('_')[0];
    const datesYmd = fnObj.dates.datesYmd;
    const datesMd = fnObj.dates.datesMd;
    // If the date isn't found, prefix it to the yyyymmdd and MMMdd arrays
    if (!datesYmd.includes(fileDate)) {
      datesYmd.unshift(fileDate);
      const newMdDate = this.getMdDateFromYyyyMmDd(fileDate);
      datesMd.unshift(newMdDate);
    }
    // Selection index in dropdown
    const dateVal = datesYmd.indexOf(fileDate);
    // Next is a hang-over. NOTE: kill dateIndex in Editor
    // const dateVal = fnObj.dates.dateIndex;
    //
    // Populate dropdown
    const dateArray = fnObj.dates.datesMd;
    const dateOptions = dateArray.map((opt, index) => (
      <option key={index} value={index}>
        {opt}
      </option>
    ));
    const sectionArray = fnObj.sections.list;
    const sectionOptions = sectionArray.map((opt, index) => (
      <option key={index} value={index}>
        {opt.name}
      </option>
    ));
    const sectionVal = fnObj.sections.index;
    const fileName = fnObj.name;
    const exportWrapperClass = 'export-wrapper';
    // Comm'd out Aug'20: don't disable export buttons
    // if section is still default
    // let exportWrapperClass = 'export-wrapper';
    // const disabled = this.setExportButtonsDisability(fnObj);
    // if (disabled) {
    //   exportWrapperClass = `${exportWrapperClass} export-wrapper-disabled`;
    // }
    const pngClass = 'silver-button export-png-div';
    const gifClass = 'silver-button export-gif-div';
    return (
      <div className="footer-wrapper">
        <div className="filename-wrapper">
          <span className="filename-label-1">Export</span>
          <select
            className="dropdown filename-date-select"
            value={dateVal}
            onChange={this.handleDateChange}
            required
          >
            {dateOptions}
          </select>
          <select
            className="dropdown filename-section-select"
            value={sectionVal}
            onChange={this.handleSectionChange}
            required
          >
            {sectionOptions}
          </select>
          <span className="filename-label-3">{fileName}</span>
        </div>
        <div className={exportWrapperClass}>
          <button
            type="button"
            className="silver-button export-svg-div"
            onClick={this.handleSvgExportClick}
          >
            <InsertChartIcon size={16} /> SVG
          </button>
          <button
            type="button"
            className={pngClass}
            onClick={this.handlePngExportClick}
          >
            <BaseLinePhotoIcon size={16} /> PNG
          </button>
          <button
            type="button"
            className={gifClass}
            onClick={this.handleGifExportClick}
          >
            <BaseLineCameraIcon size={16} /> GIF
          </button>
        </div>
      </div>
    );
  }
  // MAKE FOOTER JSX ends

  // RENDER
  render() {
    return this.makeFooterJsx();
  }
}

FooterWrapper.propTypes = {
  config: PropTypes.object.isRequired,
  onValuesToEditor: PropTypes.func,
  timeout: PropTypes.number,
};

export default FooterWrapper;
