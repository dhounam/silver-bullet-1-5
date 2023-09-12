// Child of scales-fold-body
// Refactored Sep'19 to work with array of mmi properties
// and (eventually!) to handle log scales

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import * as LogUtils from '../../utilities/log-utilities';
import * as OtherUtils from '../../utilities/other-utilities';

class ScaleSet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mmi: this.props.config.mmi,
    };
    // Events
    this.handleMmiChange = this.handleMmiChange.bind(this);
  }

  // NOTE: make this work... one day...
  // static getDerivedStateFromProps(newProps, prevState) {
  //   const mmi = newProps.config.mmi;
  //   if (typeof mmi.actualMin !== 'undefined') {
  //     return newProps.config.mmi;
  //   }
  //   return null;
  // }

  UNSAFE_componentWillReceiveProps(newProps) {
    const mmi = newProps.config.mmi;
    // To prevent problems at start-up
    if (typeof mmi.actualMin !== 'undefined') {
      this.setState({
        mmi,
      });
    }
  }

  // PASS VALS UP
  // Called from handleMmiChange, if mmi vals pan out, to fire
  // callback via Scales Body to Editor
  passValsUp(mmi) {
    const vals = {
      mmi,
      side: mmi.side,
      updateEditor: true,
      updateChart: true,
      index: this.props.config.index,
    };
    this.props.onValuesToScalesBody(vals);
  }
  // PASS VALS UP ends

  // UNPICK Z MMI VALS
  // For scatter-z, max just has to be > min
  unpickZMmiVals(mmi) {
    return {
      min: mmi.min,
      max: mmi.max,
      valsWork: mmi.max > mmi.min,
    };
  }
  // UNPICK Z MMI VALS ends

  // UNPICK LOG MMI VALS
  // For now, at least, accept values
  // I just need to build the tick-sequence
  unpickLogMmiVals(mmi) {
    const min = Number(mmi.min);
    const max = Number(mmi.max);
    const increment = Number(mmi.increment);
    // const logMmi = Object.assign({}, mmi);
    // This partly duplicates LogUtils.appendLogTickVals
    // I need to extend at bottom and top of scale
    const logMin = LogUtils.getCycleStartOrEnd(min, true);
    const logMax = LogUtils.getCycleStartOrEnd(max, false);
    const logMmi = {
      min: logMin,
      max: logMax,
      increment,
    };
    LogUtils.appendLogTickVals(logMmi);
    // Now trim to actual min and max
    const logArray = logMmi.tickValues;
    if (logArray[0] < min) {
      logArray[0] = min;
    }
    while (logArray[1] <= min) {
      logArray.shift();
    }
    if (logArray[logArray.length - 1] > max) {
      logArray[logArray.length - 1] = max;
    }
    while (logArray[logArray.length - 2] >= max) {
      logArray.pop();
    }
    logMmi.tickDensity = logArray.length;
    logMmi.valsWork = true;
    return logMmi;
  }
  // UNPICK LOG MMI VALS ends

  // UNPICK REGULAR MMI VALS
  unpickRegularMmiVals(mmi) {
    const result = {
      valsWork: false,
    };
    let max = Number(mmi.max);
    let min = Number(mmi.min);
    let increment = Number(mmi.increment);
    // Increment must be > 0
    if (increment <= 0) {
      return result;
    }
    // 'Seed' the array of tickValues with pre-factored minimum
    const tickValues = [min];
    // I need to:
    //  - check that increment is exact divisor of min - max (valsWork)
    //  - get a complete array of values to display (tickValues)
    //  - get the number of values in that array (tickDensity)
    // But I have to work round the Javascript floating point issue
    // So everything has to get factored up until the increment is an integer
    let factoredBy = 1;
    while (!Number.isInteger(increment)) {
      min *= 10;
      max *= 10;
      increment *= 10;
      factoredBy *= 10;
    }
    // Fix any precision errors
    min = OtherUtils.trimDecimals(min);
    max = OtherUtils.trimDecimals(max);
    increment = OtherUtils.trimDecimals(increment);
    factoredBy = OtherUtils.trimDecimals(factoredBy);
    // Now check if values are OK
    if (this.mmiValsWork(min, max, increment)) {
      // If so, fill the array with the de-factored values
      while (min < max) {
        min += increment;
        tickValues.push(min / factoredBy);
      }
      result.tickValues = tickValues;
      result.tickDensity = tickValues.length;
      // Check that new tickDensity matches other side (if any)
      // const densityOK = this.sideDensitiesMatch(result.tickDensity);
      // if (densityOK) {
      // Finally!
      result.valsWork = true;
      // }
    }
    return result;
  }
  // UNPICK REGULAR MMI VALS ends

  // MMI VALS WORK
  // Called from unpickMmiVals, to check that:
  //    increment is exact divisor of min-max
  //    that mixed-val sequence transits zero
  mmiValsWork(min, max, incr) {
    let valsWork = false;
    // Count steps
    const steps = (max - min) / incr;
    // Max number of steps, which must be an integer
    const maximumIncrements = this.props.config.maximumIncrements;
    if (steps <= maximumIncrements && Number.isInteger(steps)) {
      // If values are 'mixed',
      // test that increment must hit zero on its way...
      if (min < 0 && max > 0) {
        for (let iii = 0; iii < steps; iii++) {
          min += incr;
          if (min === 0) {
            valsWork = true;
            break;
          }
        }
      } else {
        valsWork = true;
      }
    }
    return valsWork;
  }
  // MMI VALS WORK ends

  // SIDE DENSITIES MATCH
  // Passed the number of ticks on left or right, checks
  // it's the same as the other side. Scatters allow mismatch.
  sideDensitiesMatch(myDensity) {
    const otherDensity = this.props.config.mmi.otherTickDensity;
    let result = false;
    if (
      this.props.config.isScatter ||
      // Only one side, anyawy
      typeof otherDensity === 'undefined' ||
      // Tick counts match
      myDensity === otherDensity
    ) {
      result = true;
    }
    return result;
  }
  // SIDE DENSITIES MATCH ends

  // CHECK RAW VAL IS OK
  // Arg is a string that must only contain numbers, dp or minus
  // Lone dp or minus is allowed. Increment can't be negative
  checkRawValIsOK(val, isIncrement, isLog, isZ) {
    // NOTE: logic could be better here...
    // Incr, log and scatter-z can't be negative
    if (isIncrement || isLog || isZ) {
      if (+val < 0) {
        return false;
      }
    }
    // Log increment must be 0, 1 or 2
    if (isLog && isIncrement) {
      if (+val > 2) {
        return false;
      }
    } else if (isLog || isZ) {
      // Non-increment-logs and scatter-z can't be zero
      if (Number(val) === 0) {
        return false;
      }
    }
    // Otherwise:
    let isOK = false;
    if (val === '.') {
      isOK = true;
    } else if (val === '-') {
      isOK = true;
    } else if (!isNaN(val)) {
      // Leading/trailing dps or minus pass
      isOK = true;
    }
    return isOK;
  }
  // CHECK RAW VAL IS OK ends

  // CHECK TRAILING DP
  // Called from handleMmiChange. Trailing
  // DP is allowed
  checkTrailingDp(val) {
    let dpTrails = false;
    const dPt = '.';
    if (val.charAt(val.length - 1) === dPt) {
      dpTrails = true;
    }
    return dpTrails;
  }
  // CHECK TRAILING DP ends

  // GET ID ROOT
  // Called from handleMmiChange. If input id is, say 'max-2',
  // returns 'max'
  getIdRoot(id) {
    let idResult = id;
    if (id.includes('-')) {
      const idArray = id.split('-');
      idResult = idArray[0];
    }
    return idResult;
  }
  // GET ID ROOT ends

  // HANDLE MMI CHANGE
  // Event handler for any change to max, min or incr
  handleMmiChange(event) {
    const isLog = this.props.config.mmi.log;
    const mmi = this.state.mmi;
    const rawVal = event.target.value;
    const id = this.getIdRoot(event.target.id);
    const isZ = mmi.label.toLowerCase().includes('z');
    // Allowed values are numbers, '.' and (non-log) '-'
    const isIncrement = id === 'increment';
    // NOTE: this could be done more elegantly
    // but I need to press on, and it is at least clear...
    // First check on the value
    const rawValOK = this.checkRawValIsOK(rawVal, isIncrement, isLog, isZ);
    if (!rawValOK) {
      // Value is crap, but let it stand
      mmi[id] = rawVal;
      this.setState(mmi);
      return;
    }
    // Trailing DP is allowed
    const trailingDP = this.checkTrailingDp(rawVal);
    if (trailingDP) {
      mmi[id] = rawVal;
      this.setState(mmi);
      return;
    }
    // So we've passed first hurdles: whatever the value, it's
    // an acceptable entry. But is it a viable number? If not,
    // update state and bale out
    if (isNaN(rawVal)) {
      mmi[id] = rawVal;
      this.setState(mmi);
      return;
    }
    // Still here? We've got an honest-to-God number. Let's see if
    // we can build a sequence with it...
    mmi[id] = Number(rawVal);
    // Generate an object with all the properties I need
    // to go upstairs. If the tickValue sequence won't
    // work, flag is false
    let unpickedVals = {};
    if (isLog) {
      unpickedVals = this.unpickLogMmiVals(mmi);
    } else if (isZ) {
      unpickedVals = this.unpickZMmiVals(mmi);
    } else {
      unpickedVals = this.unpickRegularMmiVals(mmi);
    }

    if (unpickedVals.valsWork) {
      if (isZ) {
        // NOTE: I'm going round the houses here. Rethink!
        // mmi.min = unpickedVals.min;
        // Force min zero for scatter z-axis
        mmi.min = 0;
        mmi.max = unpickedVals.max;
        // Kludge a couple of anomalies in the object
        // FIXME: tidy up MMI object
        mmi.increment = 1;
        mmi.factor = 1;
      } else {
        // Non-z-scatter need additional props
        mmi.tickDensity = unpickedVals.tickDensity;
        mmi.tickValues = unpickedVals.tickValues;
        // OK, so I have a workable MMI *this* side
        // But there's one final check: if it's a double
        // scale, do sides match? (Returns true if not
        // double scale.)
        const densityOK = this.sideDensitiesMatch(unpickedVals.tickDensity);
        mmi.densityOK = densityOK;
      }
      // Always update Editor if values work
      // since the other side needs to know how many ticks this side has
      // Callback
      this.passValsUp(mmi);
    }
    this.setState(mmi);
  }
  // HANDLE MMI CHANGE ends

  makeTopRow(label) {
    let valHead = 'Scale';
    if (typeof label !== 'undefined' && label.toLowerCase().includes('z')) {
      valHead = 'Dot-size';
    }
    return (
      <div className="scales-row scales-row-labels">
        <span className="silver-label scales-label-axis">{label}</span>
        <span className="silver-label">Data</span>
        <span className="silver-label">{valHead}</span>
      </div>
    );
  }

  makeHighRow(max, setMax) {
    const id = `max-${this.props.config.index}`;
    return (
      <div className="scales-row scales-input-group">
        <div>Max</div>
        <span title={max} className="silver-label scales-max-actual-span">
          {max}
        </span>
        <input
          className="number-field scales-max-input"
          value={setMax}
          id={id}
          autoComplete="off"
          onChange={this.handleMmiChange}
        />
      </div>
    );
  }

  makeLowRow(min, setMin, isZ) {
    const id = `min-${this.props.config.index}`;
    let userInputClassName = 'number-field scales-min-input';
    // For scatter z-axis, disable the minimum user input. Class sets
    // opacity to minimum; and react-disabled below
    if (isZ) {
      userInputClassName = `${userInputClassName} input-disabled`;
    }
    return (
      <div className="scales-row scales-input-group">
        <div>Min</div>
        <span title={min} className="silver-label scales-min-actual-span">
          {min}
        </span>
        <input
          className={userInputClassName}
          value={setMin}
          id={id}
          autoComplete="off"
          onChange={this.handleMmiChange}
          disabled={isZ}
        />
      </div>
    );
  }

  makeNonLogIncrRow(tickClass, ticks, setIncrement) {
    return (
      <div className="scales-row scales-input-group">
        <div>Increment</div>
        <span className={tickClass}>{ticks}</span>
        <input
          className="number-field scales-increment-input"
          value={setIncrement}
          id="increment"
          autoComplete="off"
          onChange={this.handleMmiChange}
        />
      </div>
    );
  }

  buildLogIncrDropdown() {
    // Hard-coding options for now, at least
    const options = ['Single points', 'Half cycles', 'Full cycles'];
    const dropDown = options.map((opt, index) => (
      <option key={index} value={index}>
        {opt}
      </option>
    ));
    return dropDown;
  }

  makeLogIncrRow(setIncrement) {
    const list = this.buildLogIncrDropdown();
    return (
      <div className="scales-row scales-input-group">
        <div>Increment</div>
        <select
          className="number-field scales-increment-input"
          value={setIncrement}
          id="increment"
          onChange={this.handleMmiChange}
        >
          {list}
        </select>
      </div>
    );
  }

  makeIncrRow(tickClass, ticks, setIncrement, isLog, label) {
    let incrRow = '';
    if (!label.toLowerCase().includes('z')) {
      if (isLog) {
        incrRow = this.makeLogIncrRow(setIncrement);
      } else {
        incrRow = this.makeNonLogIncrRow(tickClass, ticks, setIncrement);
      }
    }
    return incrRow;
  }

  // SCALE VALS JSX
  // Called from render to assemble JSX
  scaleValsJsx() {
    const configMmi = this.props.config.mmi;
    const isLog = configMmi.log;
    // The class that determined how this component displayed
    // was set upstairs, in scales-fold-body
    // But I also need to know what values, if any, to display
    const hasVals = typeof this.state.mmi.min !== 'undefined';
    // All default to empty, if no values:
    let setMin = '';
    let setMax = '';
    let setIncrement = '';
    let actualMin = '';
    let actualMax = '';
    let ticks = '';
    let tickClass = 'silver-label scales-density-span ';
    if (hasVals) {
      setMin = this.state.mmi.min;
      setMax = this.state.mmi.max;
      setIncrement = this.state.mmi.increment;
      actualMin = configMmi.actualMin;
      actualMax = configMmi.actualMax;
      // Check for unmatched densities alert
      ticks = this.state.mmi.tickDensity;
      // if (!this.sideDensitiesMatch(ticks)) {
      // No: flag comes in with config
      if (this.props.config.tickCountsMisMatch) {
        tickClass = `${tickClass} silver-label-alert`;
      }
      ticks = `${ticks} ticks`;
    }

    // Format values
    const formatDecimal = d3.format(',4f');
    const max = isNaN(actualMax) ? null : formatDecimal(actualMax);
    const min = isNaN(actualMin) ? null : formatDecimal(actualMin);
    // Individual jsx elements
    const label = configMmi.label;
    let isZ = false;
    if (typeof label !== 'undefined') {
      isZ = label.toLowerCase().includes('z');
    }
    const topRow = this.makeTopRow(configMmi.label);
    const highRow = this.makeHighRow(max, setMax);
    const lowRow = this.makeLowRow(min, setMin, isZ);
    const incrRow = this.makeIncrRow(
      tickClass,
      ticks,
      setIncrement,
      isLog,
      configMmi.label,
    );

    return (
      <div className={this.props.className}>
        {topRow}
        {highRow}
        {lowRow}
        {incrRow}
      </div>
    );
  }
  // SCALE VALS JSX ends

  // RENDER
  render() {
    return this.scaleValsJsx();
  }
}

ScaleSet.propTypes = {
  className: PropTypes.string,
  config: PropTypes.object,
  onValuesToScalesBody: PropTypes.func,
};

export default ScaleSet;
