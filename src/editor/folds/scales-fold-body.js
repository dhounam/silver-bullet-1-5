import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ScaleSet from './bodyparts/scale';
// As of Oct'20, Factor component excluded
// import ScaleFactor from './bodyparts/factor';
import InvertScale from './bodyparts/invert';
import DoubleScale from './bodyparts/double-scale';
import Indexed from './bodyparts/indexed';
// import Swap from './bodyparts/swap';
import Log from './bodyparts/log';
import ShareScale from './bodyparts/share-scale';

class ScalesFoldBody extends Component {
  // *** REACT LIFECYCLE STUFF ***

  static get defaultProps() {
    return {
      scalesLabelDefs: [
        {
          generalClass: 'silver-label',
          specificClass: 'scales-label-blank',
          display: 'Blank',
        },
        {
          generalClass: 'silver-label',
          specificClass: 'scales-label-high',
          display: 'High',
        },
        {
          generalClass: 'silver-label',
          specificClass: 'scales-label-low',
          display: 'Low',
        },
        {
          generalClass: 'silver-label',
          specificClass: 'scales-label-increment',
          display: 'Increment',
        },
      ],
    };
  }

  // CONSTRUCTOR
  // Sets up the various event listeners...
  // ...and the global value-container
  constructor(props) {
    super(props);
    // Events
    this.handleValuesFromScalesForm = this.handleValuesFromScalesForm.bind(
      this,
    );
    // this.handleFactorValues = this.handleFactorValues.bind(this);
    this.handleInvertValues = this.handleInvertValues.bind(this);
    this.handleDoubleChange = this.handleDoubleChange.bind(this);
    this.handleIndexedChange = this.handleIndexedChange.bind(this);
    this.handleLogChange = this.handleLogChange.bind(this);
    this.handleShareScale = this.handleShareScale.bind(this);
  }
  // CONSTRUCTOR ends

  // TICK COUNTS MATCH
  // Called from handleValuesFromScalesForm. Returns true
  // if tickCount from adjusted side form is the same as
  // the other side
  tickCountsMatch(newSide, newT) {
    let oldSide = 'left';
    if (newSide === 'left') {
      oldSide = 'right';
    }
    const oldT = this.props.config.mmi[oldSide].tickDensity;
    return oldT === newT;
  }
  // TICK COUNTS MATCH ends

  // HANDLE VALUES FROM SCALES FORM
  handleValuesFromScalesForm(values) {
    const scaleResult = values;
    scaleResult.component = 'scales';
    this.props.onValuesToFoldsWrapper(scaleResult);
  }
  // HANDLE VALUES FROM SCALES FORM ends

  // HANDLE FACTOR VALUES
  // Passes on values from Factor component
  // handleFactorValues(values) {
  //   const fResult = values;
  //   // Just add the component flag
  //   fResult.component = 'factor';
  //   this.props.onValuesToFoldsWrapper(fResult);
  // }
  // HANDLE FACTOR VALUES ends

  // HANDLE INVERT VALUES
  // Passes on values from Invert component
  handleInvertValues(values) {
    const iResult = values;
    iResult.component = 'invert';
    this.props.onValuesToFoldsWrapper(iResult);
  }
  // HANDLE INVERT VALUES ends

  // HANDLE DOUBLE CHANGE
  handleDoubleChange(vals) {
    const dResult = vals;
    this.props.onValuesToFoldsWrapper(dResult);
  }
  // HANDLE DOUBLE CHANGE ends

  // HANDLE INDEXED CHANGE
  handleIndexedChange(val) {
    const iResult = val;
    this.props.onValuesToFoldsWrapper(iResult);
  }
  // HANDLE INDEXED CHANGE ends

  // HANDLE LOG CHANGE
  handleLogChange(val) {
    const iResult = val;
    this.props.onValuesToFoldsWrapper(iResult);
  }
  // HANDLE LOG CHANGE ends
  // HANDLE INDEXED CHANGE ends

  // HANDLE SHARE SCALE
  handleShareScale(val) {
    const iResult = val;
    this.props.onValuesToFoldsWrapper(iResult);
  }
  // HANDLE SHARE SCALE ends

  // GET ONE LABEL JSX
  getOneLabelJsx(def, keyStr) {
    const cName = `${def.generalClass} ${def.specificClass}`;
    return (
      <span key={keyStr} className={cName}>
        {def.display}
      </span>
    );
  }
  // GET ONE LABEL JSX ends

  // MAKE SCALES LABELS JSX
  makeScalesLabelsJsx() {
    const labelsArray = [];
    const labelDefs = this.props.scalesLabelDefs;
    for (let iii = 0; iii < labelDefs.length; iii++) {
      // (Arg 3: all labels are un-disabled)
      const thisLab = this.getOneLabelJsx(labelDefs[iii], iii);
      labelsArray.push(thisLab);
    }
    return <div className="scales-values-labels">{labelsArray}</div>;
  }
  // MAKE SCALES LABELS JSX ends

  // MAKE SCALES JSX ARRAY
  // Called from makesScalesJsx, to assemble an array
  // of as many instances of the Scale component as
  // are required
  makeScaleComponentsJsxArray() {
    const jsxArray = [];
    const config = this.props.config.scales;
    // Array of mmi definitions
    const mmiArray = config.mmiArray;
    // I need to compare tick counts
    for (let scNo = 0; scNo < mmiArray.length; scNo++) {
      const scaleConfig = {};
      scaleConfig.mmi = Object.assign({}, mmiArray[scNo]);
      scaleConfig.index = scNo;
      // NOTE: I don't think I need to pass 'other' side's
      // tickDensity. I just need to know whether they
      // match or not...
      scaleConfig.tickCountsMisMatch = config.tickCountsMisMatch;
      scaleConfig.maximumIncrements = config.maximumIncrements;
      const key = `scale-${scNo}`;
      const cName = `scaleset-div scales-values-${scNo}`;
      // Imported child component
      const ScaleComponent = ScaleSet;

      const scaleJsx = (
        <ScaleComponent
          key={key}
          className={cName}
          config={scaleConfig}
          onValuesToScalesBody={this.handleValuesFromScalesForm}
        />
      );

      jsxArray.push(scaleJsx);
    }
    return jsxArray;
  }
  // MAKE SCALES JSX ARRAY ends

  // makeFactorJsx() {
  //   const fConfig = this.props.config.factor;
  //   const fJsx = (
  //     <ScaleFactor
  //       config={fConfig}
  //       onFactorsToScalesBody={this.handleFactorValues}
  //     />
  //   );
  //   return fJsx;
  // }

  makeInvertJsx() {
    const fConfig = this.props.config.invert;
    const fJsx = (
      <InvertScale
        config={fConfig}
        onInvertToScalesBody={this.handleInvertValues}
      />
    );
    return fJsx;
  }

  makeDoubleScaleJsx() {
    const doubleConfig = this.props.config.doubleScale;
    const dsJsx = (
      <DoubleScale
        config={doubleConfig}
        onValuesToScalesBody={this.handleDoubleChange}
      />
    );
    return dsJsx;
  }

  makeIndexedJsx() {
    const indexedConfig = this.props.config.indexed;
    const iJsx = (
      <Indexed
        config={indexedConfig}
        onValuesToScalesBody={this.handleIndexedChange}
      />
    );
    return iJsx;
  }

  makeLogJsx() {
    const logConfig = this.props.config.log;
    const logJsx = (
      <Log config={logConfig} onValuesToScalesBody={this.handleLogChange} />
    );
    return logJsx;
  }

  makeShareScaleJsx() {
    const canShareScale = this.props.config.scales.canShareScale;
    const csJsx = (
      <ShareScale
        canShareScale={canShareScale}
        onValuesToScalesBody={this.handleShareScale}
      />
    );
    return csJsx;
  }

  // MAKE SCALES JSX
  makeScalesJsx() {
    const scaleJsxArray = this.makeScaleComponentsJsxArray();
    const scales = <div className="scales-values-div">{scaleJsxArray}</div>;
    // const factorJsx = this.makeFactorJsx();
    const indexedJsx = this.makeIndexedJsx();
    const invertJsx = this.makeInvertJsx();
    const logJsx = this.makeLogJsx();
    const doubleScaleJsx = this.makeDoubleScaleJsx();
    // Looking ahead: this would generate the 'Share Scale' sub-component
    const shareScaleJsx = this.makeShareScaleJsx();
    // {factorJsx}
    return (
      <div className="fold-body scales-body">
        {scales}
        {indexedJsx}
        {invertJsx}
        {logJsx}
        {doubleScaleJsx}
        {shareScaleJsx}
      </div>
    );
  }
  // MAKE SCALES JSX ends

  // RENDER
  render() {
    const scalesJsx = this.makeScalesJsx();
    return scalesJsx;
  }
}

// PROP TYPES
ScalesFoldBody.propTypes = {
  config: PropTypes.object,
  scalesLabelDefs: PropTypes.array,
  // Callback of returned data
  onValuesToFoldsWrapper: PropTypes.func,
};

export default ScalesFoldBody;
