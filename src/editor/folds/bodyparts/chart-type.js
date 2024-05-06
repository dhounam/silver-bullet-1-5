// NOTE: for chartTypeJsx:
/* eslint-disable complexity */
// Child of design-fold-body. Handles chart type and stacking

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ColumnIcon from '../../icons/chart-column';
import BarIcon from '../../icons/chart-bar';
import LineIcon from '../../icons/chart-line';
import TableIcon from '../../icons/chart-table';
import PointlineIcon from '../../icons/chart-pointline';
import SteplineIcon from '../../icons/chart-stepline';
import ThermoHorizontalIcon from '../../icons/chart-thermo-horizontal';
import ThermoVerticalIcon from '../../icons/chart-thermo-vertical';
import ScatterIcon from '../../icons/chart-scatter';
import SizedScatterIcon from '../../icons/chart-sized-scatter';
import PieIcon from '../../icons/chart-pie';
import HalfPieIcon from '../../icons/chart-half-pie';

class ChartType extends Component {
  static get defaultProps() {
    return {
      typeDefs: [
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-column',
          display: 'column',
          text: 'column',
          cbString: 'column',
          canStack: true,
          canLog: false,
          orientation: 'vertical',
          icon: <ColumnIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-bar',
          display: 'bar',
          text: 'bar',
          cbString: 'bar',
          // Flag determines whether stack options are active
          canStack: true,
          canLog: false,
          // horizontal/vertical/both/none
          orientation: 'horizontal',
          icon: <BarIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-line',
          display: 'line',
          text: 'line',
          cbString: 'line',
          // Lines can't stack yet...
          canStack: true,
          canLog: true,
          orientation: 'vertical',
          icon: <LineIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-table',
          display: 'table',
          text: 'table',
          cbString: 'table',
          // Lines can't stack yet...
          canStack: true,
          canLog: false,
          orientation: 'vertical',
          icon: <TableIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-pointline',
          display: 'pointline',
          text: 'pointline',
          cbString: 'pointline',
          canStack: false,
          canLog: true,
          orientation: 'vertical',
          icon: <PointlineIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-stepline',
          display: 'stepline',
          text: 'stepline',
          cbString: 'stepline',
          canStack: false,
          canLog: true,
          orientation: 'vertical',
          icon: <SteplineIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-thermohorizontal',
          display: 'thermo horizontal',
          text: 'thermo',
          cbString: 'thermohorizontal',
          canStack: false,
          canLog: true,
          orientation: 'horizontal',
          icon: <ThermoHorizontalIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-thermovertical',
          display: 'thermo vertical',
          text: 'thermo',
          cbString: 'thermovertical',
          canStack: false,
          canLog: true,
          orientation: 'vertical',
          icon: <ThermoVerticalIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-scatter',
          display: 'scatter',
          text: 'scatter',
          cbString: 'scatter',
          canStack: false,
          canLog: true,
          orientation: 'both',
          icon: <ScatterIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-sizedscatter',
          display: 'sized scatter',
          text: 'sized scatter',
          cbString: 'sizedscatter',
          canStack: false,
          canLog: true,
          orientation: 'both',
          icon: <SizedScatterIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-pie',
          display: 'pie',
          text: 'pie',
          cbString: 'pie',
          canStack: false,
          canLog: false,
          orientation: 'none',
          icon: <PieIcon />,
        },
        {
          group: 'type',
          generalClass: 'silver-button',
          specificClass: 'type-halfpie',
          display: 'half pie',
          text: 'half pie',
          cbString: 'halfpie',
          canStack: false,
          canLog: false,
          orientation: 'none',
          icon: <HalfPieIcon />,
        },
      ],
      stackDefs: [
        {
          group: 'stack',
          generalClass: 'silver-button',
          specificClass: 'type-sidebyside',
          display: 'unstacked',
          text: 'unstacked',
        },
        {
          group: 'stack',
          generalClass: 'silver-button',
          specificClass: 'type-stacked',
          display: 'stacked',
          text: 'stacked',
        },
      ],
      // Both of next 3 arrays use cbString
      stackableTypes: ['bar', 'column', 'line', 'stepline'],
      unLoggableTypes: ['bar', 'column', 'table', 'pie', 'halfpie'],
      // Chart types that currently work:
      workingTypes: [
        'bar',
        'column',
        'line',
        'table',
        'pointline',
        'stepline',
        'thermohorizontal',
        'thermovertical',
        'scatter',
        'sizedscatter',
        'pie',
        'halfpie',
      ],
    };
  }

  // CONSTRUCTOR
  // Sets up the structure and 'reactions' of the controls
  constructor(props) {
    super(props);
    this.state = {
      // Object to pass back
      typeVals: {
        source: 'chartType',
        type: this.props.config.type,
        stacked: this.props.config.stacked,
        thermoDots: this.props.config.thermoDots,
        scatterLabels: this.props.config.scatterLabels,
        scatterTrendline: this.props.config.scatterTrendline,
      },
      updateEditor: false,
    };
    // Events
    this.handleTypeClick = this.handleTypeClick.bind(this);
    this.handleStackClick = this.handleStackClick.bind(this);
    this.handleThermoDotClick = this.handleThermoDotClick.bind(this);
    this.handleScatterOptionClick = this.handleScatterOptionClick.bind(this);
  }
  // CONSTRUCTOR ends

  // COMPONENT WILL RECEIVE PROPS
  UNSAFE_componentWillReceiveProps(newProps) {
    const oldConfig = this.props.config;
    const newConfig = newProps.config;
    if (
      oldConfig.type !== newConfig.stack ||
      oldConfig.stack !== newConfig.stack
    ) {
      this.setState({
        typeVals: {
          source: 'chartType',
          type: newConfig.type,
          thermoDots: newConfig.thermoDots,
          scatterLabels: newConfig.scatterLabels,
          scatterTrendline: newConfig.scatterTrendline,
          stacked: newConfig.stacked,
          canLayerCake: newConfig.canLayerCake,
          whatChanged: '',
        },
        updateEditor: false,
      });
    }
  }
  // COMPONENT WILL RECEIVE PROPS ends

  // COMPONENT DID UPDATE
  // Any user gesture precipitates a state-change and re-render,
  // after which we update Editor...
  componentDidUpdate() {
    if (this.state.updateEditor) {
      this.props.onValuesToDesignBody(this.state.typeVals);
    }
  }
  // COMPONENT DID UPDATE ends

  // *** REACT LIFECYCLE STUFF ENDS ***

  // HANDLE TYPE CLICK
  handleTypeClick(event) {
    // First, get the typeDef for the existing chart type:
    const oldTypeDef = this.props.typeDefs.filter(
      type => type.cbString === this.props.config.type,
    )[0];
    const oldOrientation = oldTypeDef.orientation;
    const displayed = event.currentTarget.dataset.chart.toLowerCase();
    // Isolate the definition and extract string to return in callback
    const newTypeDef = this.props.typeDefs.filter(
      type => type.display === displayed,
    )[0];
    const cbString = newTypeDef.cbString;
    const cbOrientation = newTypeDef.orientation;

    this.setState(prevState => {
      const typeVals = prevState.typeVals;
      typeVals.type = cbString;
      typeVals.sameOrientation = oldOrientation === cbOrientation;
      // But *can* this style stack? This is a one-way street: if I
      // change from a stacked type to an unstackable one, I have to
      // force the stacking option off...
      if (!this.props.stackableTypes.includes(cbString)) {
        typeVals.stacked = false;
      }
      typeVals.whatChanged = 'type';
      return {
        typeVals,
        updateEditor: true,
      };
    });
  }
  // HANDLE TYPE CLICK ends

  // HANDLE STACK CLICK
  handleStackClick(event) {
    const style = event.currentTarget.dataset.chart.toLowerCase();
    this.setState(prevState => {
      const typeVals = prevState.typeVals;
      typeVals.stacked = style === 'stacked';
      typeVals.whatChanged = 'stacking';
      return {
        typeVals,
        updateEditor: true,
      };
    });
  }
  // HANDLE STACK CLICK ends

  // HANDLE THERMO DOT CLICK
  handleThermoDotClick({ target: { checked } }) {
    this.setState(prevState => {
      const typeVals = prevState.typeVals;
      typeVals.thermoDots = checked;
      typeVals.whatChanged = 'thermo-dots';
      return {
        typeVals,
        updateEditor: true,
      };
    });
  }
  // HANDLE THERMO DOT CLICK ends

  // HANDLE SCATTER LABEL CLICK
  handleScatterOptionClick({ target }) {
    // Labels or trendline?
    const labelsChanged = target.className.includes('labels');
    const checked = target.checked;
    this.setState(prevState => {
      const typeVals = prevState.typeVals;
      if (labelsChanged) {
        typeVals.scatterLabels = checked;
        typeVals.whatChanged = 'scatter-labels';
      } else {
        typeVals.scatterTrendline = checked;
        typeVals.whatChanged = 'scatter-trendline';
      }
      return {
        typeVals,
        updateEditor: true,
      };
    });
  }
  // HANDLE SCATTER LABEL CLICK ends

  // GET ELEMENT JSX
  // Called from chartTypeJsx to assemble jsx for one element
  // Args are the element definition; index; en/disable flag
  getElementJsx(def, keyVal, isDisabled) {
    let element = '';
    if (def.group === 'label') {
      const keyStr = `label-${keyVal}`;
      const cName = `${def.generalClass} ${def.specificClass}`;
      element = (
        <span key={keyStr} className={cName}>
          {def.display}
        </span>
      );
    } else if (def.group === 'type') {
      const keyStr = `type-${keyVal}`;
      let cName = `${def.generalClass} ${def.specificClass}`;
      if (def.cbString === this.state.typeVals.type) {
        cName = `${cName} button-selected`;
      }
      if (isDisabled) {
        cName = `${cName} button-disabled`;
      }
      element = (
        <button
          type="button"
          data-chart={def.display}
          key={keyStr}
          className={cName}
          onClick={this.handleTypeClick}
        >
          {def.icon && def.icon} {def.text}
        </button>
      );
    } else {
      const keyStr = `stack-${keyVal}`;
      let cName = `${def.generalClass} ${def.specificClass}`;
      // Selected? It's binary: stacked or side-by-side
      const isStacked = this.state.typeVals.stacked;
      if (isStacked && def.display === 'stacked') {
        cName = `${cName} button-selected`;
      } else if (!isStacked && def.display === 'unstacked') {
        cName = `${cName} button-selected`;
      }
      if (isDisabled) {
        cName = `${cName} button-disabled`;
      }
      element = (
        <button
          type="button"
          data-chart={def.display}
          key={keyStr}
          className={cName}
          onClick={this.handleStackClick}
        >
          {def.text}
        </button>
      );
    }
    return element;
  }
  // GET ELEMENT JSX ends

  // DATA CANT BE SCATTER CHART
  // Called from chartTypeJsx. Returns True if data aren't compatible
  // with a sized/scatter chart
  dataCantBeScatterChart(chartType, seriesCount) {
    if (seriesCount === 1) {
      return true;
    }
    const three = 3;
    let modVal = seriesCount % 2;
    if (chartType.includes('sized')) {
      modVal = seriesCount % three;
    }
    // So if modVal isn't zero, data are incompatible with a scatter (simple or sized)
    return modVal !== 0;
  }
  // DATA CANT BE SCATTER CHART ends

  // MAKE THERMO DOT CHECKBOX
  makeThermoDotCheckbox() {
    // Class names
    const labClass = 'silver-label thermo-dot-option-label';
    const cbClass = 'silver-checkbox thermo-checkbox';
    // Div is enabled only if chart-type is thermometer
    let divClass = 'thermo-dot-option-div';
    let ticked = this.props.config.thermoDots;
    if (!this.props.config.type.includes('thermo')) {
      divClass = `${divClass} thermo-dot-option-disabled`;
      ticked = false;
    }
    const element = (
      <div key="thermo-dot-option-div" className={divClass}>
        <label className={labClass} htmlFor={cbClass}>
          Use dots
          <input
            className={cbClass}
            type="checkbox"
            onChange={this.handleThermoDotClick}
            checked={ticked}
          />
        </label>
      </div>
    );
    return element;
  }
  // MAKE THERMO DOT CHECKBOX ends

  // MAKE ONE SCATTER OPTS CHECKBOX
  // Called from makeScatterOptionsCheckboxes to build
  // scatter labels or trendline options
  makeOneScatterOptsCheckbox(ticked, isLabels, canLabel) {
    // Class names
    let labClass = 'silver-label scatter-trend-option-label';
    let cbClass = 'silver-checkbox scatter-trend-checkbox';
    let optionStr = 'Trend line';
    if (isLabels) {
      labClass = 'silver-label scatter-labels-option-label';
      cbClass = 'silver-checkbox scatter-labels-checkbox';
      if (!canLabel) {
        labClass = `${labClass} scatter-labels-disabled`;
        cbClass = `${cbClass} scatter-labels-disabled`;
      }
      optionStr = 'Label points';
    }
    return (
      <label className={labClass} htmlFor={cbClass}>
        {optionStr}
        <input
          className={cbClass}
          type="checkbox"
          onChange={this.handleScatterOptionClick}
          checked={ticked}
        />
      </label>
    );
  }
  // MAKE ONE SCATTER OPTS CHECKBOX ends

  // MAKE SCATTER OPTIONS CHECKBOXES
  makeScatterOptionsCheckboxes() {
    // Div is enabled only if chart-type is SCATTER
    let divClass = 'scatter-options-div';
    const scattersCanLabel = this.props.config.scattersCanLabel;
    let labelTicked = this.props.config.scatterLabels;
    let trendTicked = this.props.config.scatterTrendline;
    // Not scatter: kill everything
    if (!this.props.config.type.includes('scatter')) {
      divClass = `${divClass} scatter-options-disabled`;
      labelTicked = false;
      trendTicked = false;
    }
    const optionKey = 'scatter-options-key';
    const elementA = this.makeOneScatterOptsCheckbox(
      labelTicked,
      true,
      scattersCanLabel,
    );
    const elementB = this.makeOneScatterOptsCheckbox(trendTicked, false);
    return (
      <div key={optionKey} className={divClass}>
        {elementA}
        {elementB}
      </div>
    );
  }
  // MAKE SCATTER OPTIONS CHECKBOXES ends

  // CHART TYPE JSX
  // Calls sub-functions to construct individual elements and clusters
  chartTypeJsx() {
    const config = this.props.config;
    // If chart is mixed or double-scaled, or if data includes non-numbers,
    // this entire component may be disabled
    const allOff = config.typeDisabled;
    // If log scale, disable bars, columns, pies...
    const { isLog } = config;
    // Flag to en/disable stacked options, according to chart type
    let disableStacked = true;
    // Stackable chart types is empty by default...
    const stackableTypes = this.props.stackableTypes;
    // Ditto *UN*-loggable (exclusionary)
    const unLoggableTypes = this.props.unLoggableTypes;
    // Loop through chart type properties
    const typeDefs = this.props.typeDefs;
    // Array of definitions to return:
    const elementArray = [];
    for (let iii = 0; iii < typeDefs.length; iii++) {
      const tDef = typeDefs[iii];
      // Can this chart type enable?
      let tDisabled = false;
      if (this.props.config.stacked) {
        // If data are currently stacked, only enable this chart type
        // if it's stackable
        tDisabled = !stackableTypes.includes(tDef.cbString);
      } else if (tDef.cbString === 'line') {
        // Columns and bars can stack when there are mixed values in a series
        // (indicated by the 'canLayerCake' flag). But if either of those
        // chart types has left stacking on, I can't switch to a line chart...
        if (config.stacked) {
          tDisabled = !config.canLayerCake;
        }
      } else if (tDef.cbString.includes('scatter')) {
        tDisabled = this.dataCantBeScatterChart(
          tDef.cbString,
          config.seriesCount,
        );
      } else if (tDef.cbString.includes('pie')) {
        tDisabled = config.noPie;
      } else if (
        (config.user === 'eiu' || config.isVideoPreset) &&
        tDef.cbString.includes('table')
      ) {
        // NOTE: kludge to disable tables for EIU & video presets
        tDisabled = true;
      } else if (isLog) {
        // Log check:
        tDisabled = unLoggableTypes.includes(tDef.cbString);
      }
      // NOTE: this clunks

      // Disablement override for types that don't work yet:
      // NOTE: once pies work, this becomes redundant
      if (!tDisabled) {
        tDisabled = !this.props.workingTypes.includes(tDef.cbString);
      }
      const thisEl = this.getElementJsx(typeDefs[iii], iii, tDisabled);
      elementArray.push(thisEl);
      if (tDef.display === this.state.typeVals.type) {
        if (
          this.props.config.type === 'line' ||
          this.props.config.type === 'stepline'
        ) {
          disableStacked = !this.props.config.canLayerCake;
        } else {
          disableStacked = !typeDefs[iii].canStack;
        }
      }
    }

    // Stacking buttons
    const stackDefs = this.props.stackDefs;
    for (let iii = 0; iii < stackDefs.length; iii++) {
      const thisEl = this.getElementJsx(stackDefs[iii], iii, disableStacked);
      elementArray.push(thisEl);
    }
    let componentClass = 'chart-type-div';
    if (allOff) {
      componentClass = `${componentClass} chart-type-disabled`;
    }

    elementArray.push(this.makeThermoDotCheckbox());
    elementArray.push(this.makeScatterOptionsCheckboxes());
    return <div className={componentClass}>{elementArray}</div>;
  }
  // CHART TYPE JSX ends

  // RENDER
  render() {
    return this.chartTypeJsx();
  }
}

ChartType.propTypes = {
  config: PropTypes.object,
  onValuesToDesignBody: PropTypes.func,
  typeDefs: PropTypes.array,
  stackDefs: PropTypes.array,
  stackableTypes: PropTypes.array,
  unLoggableTypes: PropTypes.array,
  workingTypes: PropTypes.array,
};

export default ChartType;
