import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ExpandMoreIcon from '../icons/expand-more';

class Preset extends Component {
  static get defaultProps() {
    return {};
  }

  // Click events on parent and child elements in dropdown
  constructor(...args) {
    super(...args);

    this.state = {
      isMenuOpen: false,
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleClickMenu = this.handleClickMenu.bind(this);
    this.handleClickPreset = this.handleClickPreset.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClick, false);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick, false);
  }

  handleClick(e) {
    // capture clicks outside menu (and button!)
    // https://medium.com/@pitipatdop/little-neat-trick-to-capture-click-outside-react-component-5604830beb7f
    if (this.node.contains(e.target) || this.button.contains(e.target)) return;

    this.setState({
      isMenuOpen: false,
    });
  }

  handleClickMenu() {
    const { isMenuOpen } = this.state;

    this.setState({
      isMenuOpen: !isMenuOpen,
    });
  }

  handleClickPreset({ preset, subPreset }) {
    const { onValuesToSizeAndPreset } = this.props;
    onValuesToSizeAndPreset({ preset, subPreset });
    this.setState({
      isMenuOpen: false,
    });
  }

  render() {
    const { presetDefinitions } = this.props;
    const { isMenuOpen } = this.state;

    // we want to display the same name as in the menu
    // FIXME: maybe there's a better way to do this? changing the source data?
    const displaySetting = presetDefinitions.presetArray
      .find(d => d.parent === presetDefinitions.preset)
      .children.find(d => d.id === presetDefinitions.subPreset).display;

    return (
      <React.Fragment>
        <button
          type="button"
          className={`silver-button preset-button ${
            isMenuOpen ? 'active' : ''
          }`}
          onClick={this.handleClickMenu}
          ref={button => {
            this.button = button;
          }}
        >
          <div className="main-preset">{presetDefinitions.preset}</div>{' '}
          <div className="sub-preset">{displaySetting}</div>{' '}
          <ExpandMoreIcon flip={isMenuOpen} />
        </button>

        <div
          className="preset-menu"
          style={{ display: isMenuOpen ? 'flex' : 'none' }}
          ref={node => {
            this.node = node;
          }}
        >
          {presetDefinitions.presetArray.map(d => (
            <div className="preset-menu-type" key={d.display}>
              <div className="preset-menu-display">{d.display}</div>

              <div className="preset-menu-list">
                {d.children.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`silver-button preset-menu-item ${
                      presetDefinitions.preset === d.parent &&
                      presetDefinitions.subPreset === c.id
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      this.handleClickPreset({
                        preset: d.parent,
                        subPreset: c.id,
                      })
                    }
                  >
                    {c.display}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </React.Fragment>
    );
  }
}

Preset.propTypes = {
  // Incoming object defining presets
  presetDefinitions: PropTypes.object.isRequired,
  // Callback returns parent and child props of element selected
  onValuesToSizeAndPreset: PropTypes.func.isRequired,
};

export default Preset;
