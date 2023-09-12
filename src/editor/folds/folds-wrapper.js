import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DesignFoldBody from './design-fold-body';
import ScalesFoldBody from './scales-fold-body';
import AdvancedFoldBody from './advanced-fold-body';

class FoldWrapper extends Component {
  // *** REACT LIFECYCLE STUFF ***

  // CONSTRUCTOR
  // Sets up the various event listeners...
  // ...and the global value-container
  constructor(props) {
    super(props);
    this.state = {
      foldsList: props.config.foldsList,
      updateEditor: false,
    };
    // Events
    this.handleFoldHeaderClick = this.handleFoldHeaderClick.bind(this);
    this.handleDesignFoldCallback = this.handleDesignFoldCallback.bind(this);
    this.handleScalesFoldCallback = this.handleScalesFoldCallback.bind(this);
    this.handleAdvancedFoldCallback = this.handleAdvancedFoldCallback.bind(
      this,
    );
  }
  // CONSTRUCTOR ends

  // COMPONENT WILL RECEIVE PROPS
  UNSAFE_componentWillReceiveProps() {
    this.setState({
      // updateEditor: newProps.config.updateEditor,
      updateEditor: false,
    });
  }
  // COMPONENT WILL RECEIVE PROPS ends

  // COMPONENT DID UPDATE
  // Any callback from an individual fold precipitates
  //  a re-render, after which we update Editor...
  componentDidUpdate() {
    if (this.state.updateEditor) {
      // const vals = {
      // design: this.state.designVals,
      // style: this.state.style,
      // advanced: this.state.advanced,
      // };
      // this.props.onValuesToEditor(vals);
      this.props.onValuesToEditor(this.state.foldVals);
    }
  }
  // COMPONENT DID UPDATE ends

  handleDesignFoldCallback(vals) {
    const foldVals = {
      fold: 'design',
      vals,
    };

    this.setState({
      foldVals,
      updateEditor: true,
    });
  }

  handleScalesFoldCallback(vals) {
    const foldVals = {
      fold: 'scales',
      vals,
    };

    this.setState({
      foldVals,
      updateEditor: true,
    });
  }

  handleAdvancedFoldCallback(vals) {
    const foldVals = {
      fold: 'advanced',
      vals,
    };
    this.setState({
      foldVals,
      updateEditor: true,
    });
  }

  // HANDLE FOLD HEADER CLICK
  // Header click opens a fold
  handleFoldHeaderClick(event) {
    event.preventDefault();

    // get id of new tab
    const newTab = event.target.getAttribute('href').substr(1);

    this.setState(previousState => {
      const foldDefs = previousState.foldsList;

      // set active tab to true
      for (const key in foldDefs) {
        foldDefs[key].open = key === newTab;
      }
      return {
        foldsList: foldDefs,
        updateEditor: false,
      };
    }, this.props.handleHeightChange);
  }
  // HANDLE FOLD HEADER CLICK ends

  // MAKE FOLDS JSX
  // Called from render to assemble JSX
  makeFoldsJsx() {
    const foldDefs = this.state.foldsList;
    // JSX for individual body components
    const designConfig = this.props.config.designConfig;
    const scalesFoldConfig = this.props.config.scalesFoldConfig;
    const advancedFoldConfig = this.props.config.advancedConfig;

    // But scales fold may be disabled
    foldDefs.design.disabled = designConfig.disabled;
    foldDefs.scales.disabled = scalesFoldConfig.disabled;
    foldDefs.advanced.disabled = advancedFoldConfig.disabled;
    const bodies = {
      design: (
        <DesignFoldBody
          config={designConfig}
          onValuesToFoldsWrapper={this.handleDesignFoldCallback}
        />
      ),
      scales: (
        <ScalesFoldBody
          config={scalesFoldConfig}
          onValuesToFoldsWrapper={this.handleScalesFoldCallback}
        />
      ),
      advanced: (
        <AdvancedFoldBody
          config={advancedFoldConfig}
          onValuesToFoldsWrapper={this.handleAdvancedFoldCallback}
        />
      ),
    };
    return (
      <div className="folds-wrapper">
        {process.env.REACT_APP_TEST === true && (
          <div className="folds-badge-test">TEST VERSION</div>
        )}
        <ul className="folds-tab">
          {Object.keys(foldDefs).map(fName => (
            <li
              key={fName}
              className={[
                `tab-${fName}`,
                foldDefs[fName].open ? 'tab-active' : '',
                foldDefs[fName].disabled ? 'tab-disabled' : '',
                fName === 'scales' && scalesFoldConfig.scales.tickCountsMisMatch
                  ? 'tab-alert'
                  : '',
              ].join(' ')}
            >
              <a href={`#${fName}`} onClick={this.handleFoldHeaderClick}>
                {fName}
              </a>
            </li>
          ))}
        </ul>
        <div className="folds-container">
          {Object.keys(foldDefs).map(fName => (
            <div
              key={fName}
              className={[
                'tab-content',
                foldDefs[fName].open ? 'tab-content-active' : '',
              ].join(' ')}
            >
              {bodies[fName]}
            </div>
          ))}
        </div>
      </div>
    );
  }
  // MAKE FOLDS JSX ends

  // RENDER
  // Returns folds wrapper and individual folds
  render() {
    const foldsJsx = this.makeFoldsJsx();
    return foldsJsx;
  }
}

FoldWrapper.propTypes = {
  config: PropTypes.object.isRequired,
  onValuesToEditor: PropTypes.func.isRequired,
  handleHeightChange: PropTypes.func.isRequired,
};

export default FoldWrapper;
