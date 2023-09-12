import React, { Component } from 'react';
import PropTypes from 'prop-types';

class AxisHeaders extends Component {
  static get defaultProps() {
    return {};
  }

  constructor(props) {
    super(props);
    this.handleAxisHeaderBlur = this.handleAxisHeaderBlur.bind(this);
  }

  componentDidMount() {
    this.fillFields();
  }

  componentDidUpdate() {
    this.fillFields();
  }

  // FILL FIELDS
  // Called from componentDidMount and componentDidUpdate
  // to stuff new props cheaply and cheerfully into fields
  fillFields() {
    this.xaxisheader.value = this.props.config.xaxis.content;
    // Only xaxis
    // this.yaxisheaderleft.value = this.props.config.yaxisleft.content;
    // this.yaxisheaderright.value = this.props.config.yaxisright.content;
    // this.zaxisheader.value = this.props.config.zaxis.content;
  }

  updateEditor() {
    const vals = {
      source: 'axisHeaders',
      xaxis: this.xaxisheader.value,
      // Only xaxis
      // yaxisleft: this.yaxisheaderleft.value,
      // yaxisright: this.yaxisheaderright.value,
      // zaxis: this.zaxisheader.value,
    };
    this.props.onValuesToAdvancedBody(vals);
  }

  // HANDLE STRING BLUR
  // Every time we tab or click out of a field,
  // gather all the string values and kick them upstairs
  handleAxisHeaderBlur() {
    this.updateEditor();
  }
  // HANDLE STRING BLUR ends

  // MAKE AXIS HEADER JSX
  // Allows for x, y and z axis headers, although only xaxis header now used
  makeAxisHeaderJsx(axis) {
    const config = this.props.config;
    let headerDivClass = 'axis-header-div';
    let labelClass = 'silver-label';
    let inputClass = 'text-field';
    let refName = '';
    let label = '';
    if (axis === 'xaxis') {
      if (!config.xaxis.enabled) {
        headerDivClass = `${headerDivClass} axis-header-div-disabled`;
      }
      labelClass = `${labelClass} xaxis-header-label`;
      inputClass = `${inputClass} xaxis-header-input`;
      refName = 'xaxisheader';
      label = 'X axis header';
    } else if (axis === 'yaxis-left') {
      if (!config.yaxisleft.enabled) {
        headerDivClass = `${headerDivClass} axis-header-div-disabled`;
      }
      labelClass = `${labelClass} yaxisleft-header-label`;
      inputClass = `${inputClass} yaxisleft-header-input`;
      refName = 'yaxisheaderleft';
      label = 'Y axis left header';
    } else if (axis === 'yaxis-right') {
      if (!config.yaxisright.enabled) {
        headerDivClass = `${headerDivClass} axis-header-div-disabled`;
      }
      labelClass = `${labelClass} yaxisright-header-label`;
      inputClass = `${inputClass} yaxisright-header-input`;
      refName = 'yaxisheaderright';
      label = 'Y axis right header';
    } else {
      if (!config.zaxis.enabled) {
        headerDivClass = `${headerDivClass} axis-header-div-disabled`;
      }
      labelClass = `${labelClass} zaxis-header-label`;
      inputClass = `${inputClass} zaxis-header-input`;
      refName = 'zaxisheader';
      label = 'Z axis header';
    }
    return (
      <div className={headerDivClass}>
        <span className={labelClass}>{label}</span>
        <input
          id={inputClass}
          ref={c => {
            this[refName] = c;
          }}
          className={inputClass}
          onBlur={this.handleAxisHeaderBlur}
        />
      </div>
    );
  }
  // MAKE AXIS HEADER JSX ends
  // For refs, use:
  // ref={(c) => { this.<refname> = c;}}

  // MAKE AXIS HEADERS JSX
  makeAxisHeadersJsx() {
    // As of Sep'20, only xaxis input
    const xAxisJsx = this.makeAxisHeaderJsx('xaxis');
    // const yAxisLeftJsx = this.makeAxisHeaderJsx('yaxis-left');
    // const yAxisRightJsx = this.makeAxisHeaderJsx('yaxis-right');
    // const zAxisJsx = this.makeAxisHeaderJsx('zaxis');
    return <div className="axis-headers-div">{xAxisJsx}</div>;
    // {yAxisLeftJsx}
    // {yAxisRightJsx}
    // {zAxisJsx}
  }
  // MAKE AXIS HEADERS JSX ends

  // RENDER
  render() {
    return this.makeAxisHeadersJsx();
  }
}

AxisHeaders.propTypes = {
  config: PropTypes.object.isRequired,
  onValuesToAdvancedBody: PropTypes.func.isRequired,
};

export default AxisHeaders;
