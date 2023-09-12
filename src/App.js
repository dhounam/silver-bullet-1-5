import React, { Component } from 'react';
import './App.css';

// 2 dependents: Chartwrapper and Editor
import { iframeResizer } from './editor/utilities/iframe-resizer';
// import SilverChartWrapper from '@economist/silver-chart';
// Prev doesn't work, so I'm working with a copy of chartwrapper inside silver-bullet (as before)
import SilverChart from './chartwrapper';
import SilverEditor from './editor/editor';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Flag prevents first chart render, so that only Editor renders at mount...
      canDoFirstChartRender: false,
      // Flag to control whether chart-type component can render
      chartTypeComponentCanRender: true,
      // This is never tripped; but left in place in case
      // error callbacks from Chartside are ever restored...
      errorStatus: {
        isError: false,
        fold: '',
        status: '',
      },
    };
    // Bindings
    this.handleConfigFromEditor = this.handleConfigFromEditor.bind(this);
    this.handleErrorReport = this.handleErrorReport.bind(this);
  }

  // *** EVENT HANDLERS ***

  componentDidMount() {
    iframeResizer({ className: '.silver-bullet' });
  }

  // HANDLE CONFIG FROM EDITOR
  // Callback from Editor, with updated config object
  handleConfigFromEditor(config) {
    // Set error status off (this does nothing now)
    const errorStatus = {
      isError: false,
      fold: '',
      status: '',
    };
    this.setState({
      config,
      // Since we have data from Editor, chart can be rendered
      canDoFirstChartRender: true,
      chartTypeComponentCanRender: true,
      errorStatus,
    });
  }
  // HANDLE CONFIG FROM EDITOR ends

  // HANDLE ERROR REPORT
  // Handler for chart-side errors
  // No longer called (Feb'21)
  handleErrorReport(errorObj) {
    // Arg is an object with 'fold' and 'status' properties
    // 'fold' is the inferential name of the component/fold that should look surprised
    // 'status' is a message that may (or may not!) get displayed
    const errorStatus = this.state.errorStatus;
    errorStatus.fold = errorObj.fold;
    errorStatus.status = errorObj.status;
    errorStatus.isError = false;
    if (errorStatus.status.length > 0) {
      errorStatus.isError = true;
      this.setState({
        errorStatus,
        chartTypeComponentCanRender: false,
      });
    }
  }
  // HANDLE ERROR REPORT ends

  // *** EVENT HANDLERS END ***

  // *** JSX ASSEMBLY: EDITOR AND CHARTWRAPPER ***

  // BUILD EDITOR
  buildEditor() {
    const { user } = this.props;
    // Although errorStatus is passed to Editor, it no longer does anything
    return (
      <SilverEditor
        user={user}
        onPassUpdatedConfig={this.handleConfigFromEditor}
        errorStatus={this.state.errorStatus}
      />
    );
  }
  // BUILD EDITOR ends

  // BUILD CHART WRAPPER
  // Called from render to assemble JSX for ChartWrapper
  // Passed prop is the config object
  buildChartWrapper(config) {
    // By default, on mount, return empty div (no chart)
    let cJsx = <div className="chart-wrapper"> </div>;
    if (this.state.canDoFirstChartRender) {
      // Props passed are:
      //    config object;
      //    callback to return status of inner box after other elements drawn
      //      (this callback comes from Chartwrapper, prompted by type component);
      //    flag to control whether that callback can be dispatched...
      cJsx = (
        <div className="chart-wrapper">
          <SilverChart
            // Config object
            config={config}
            // Callback for any chart error removed, Feb'21
            // onPassChartError={this.handleErrorReport}
            chartTypeComponentCanRender={this.state.chartTypeComponentCanRender}
          />
        </div>
      );
    }
    return cJsx;
  }
  // BUILD CHART WRAPPER ends

  // RENDER
  // A NOTE on structure. There's an outermost-wrapper to
  // wrap *everything*. Then a family of siblings corresponding to
  // components

  render() {
    const config = Object.assign({}, this.state.config);
    const editor = this.buildEditor();
    const chartWrapper = this.buildChartWrapper(config);

    return (
      <div className="silver-bullet">
        {editor}
        {chartWrapper}
      </div>
    );
  }
}

export default App;
