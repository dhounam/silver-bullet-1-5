/*  Refactored Dec'20
    This has to be a controlled component so that the inputs
    respond immediately (no Submit button).
    Monteux's response to quickly-succeeding events seems erratic.
    So to limit this component to firing off just one event
    if the user types in several numbers in rapid sequence:
    - input calls debounceSizeChange, which:
        - resets state, so that input redisplays, but...
        - ...leaves a flag, state.updateEditor on false
        - debounces a function, handleSizeChange, which
          fires at the end of the sequence and flips
          state.updateEditor, so that the latest height
          and width values can be picked up and kicked
          upstairs...
    On un/controlled React components see:
    https://goshakkk.name/controlled-vs-uncontrolled-inputs-react/
*/
import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Size extends Component {
  static get defaultProps() {
    return {
      minHeight: 50,
      minWidth: 50,
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      height: 0,
      width: 0,
      updateEditor: false,
    };
    // Events
    this.handleSizeChange = this.handleSizeChange.bind(this);
    this.debounceSizeChange = this.debounceSizeChange.bind(this);
    this.debounce = this.debounce.bind(this);
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    const config = newProps.config;
    this.setState({
      height: config.height,
      width: config.width,
      updateEditor: false,
    });
  }

  // Any user gesture resets state. After
  // debouncing, the updateEditor flag gets set true,
  // and we can update Editor...
  componentDidUpdate() {
    if (this.state.updateEditor) {
      const vals = {
        height: this.state.height,
        width: this.state.width,
      };
      this.props.onValuesToSizeAndPreset(vals);
    }
  }

  // DEBOUNCE
  // See: https://redd.one/blog/debounce-vs-throttle
  debounce(func, duration) {
    let timeout;
    return function(...args) {
      const effect = () => {
        timeout = null;
        return func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(effect, duration);
    };
  }
  // DEBOUNCE ends

  // UPDATE STATE
  // Called from debounceSizeChange on every keystroke.
  // Resets state with height and width for controlled
  // inputs. And sets updateEditor to false, so that
  // no callback is sent upstairs
  updateState(tar, newVal) {
    const maxChartWidth = this.props.config.maximumChartWidth;
    this.setState(prevState => {
      let height = prevState.height;
      let width = prevState.width;
      if (tar === 'height') {
        height = newVal;
      } else {
        width = Math.min(newVal, maxChartWidth);
      }
      return {
        height,
        width,
        updateEditor: false,
      };
    });
  }
  // UPDATE STATE ends

  // HANDLE SIZE CHANGE
  // Called after debouncing. All it does is reset the
  // updateEditor flag, so that current state values
  // get sent upstairs
  handleSizeChange() {
    this.setState(prevState => {
      return {
        height: prevState.height,
        width: prevState.width,
        updateEditor: true,
      };
    });
  }
  // HANDLE SIZE CHANGE ends

  // DEBOUNCE SIZE CHANGE
  // Handler for input onChange event
  // From https://medium.com/@anuhosad/debouncing-events-with-react-b8c405c33273
  debounceSizeChange = evt => {
    // Always update state for controlled inputs
    const targ = evt.target;
    const targetId = targ.id.split('-')[1].toLowerCase();
    const newVal = Number(targ.value);
    this.updateState(targetId, newVal);
    // Tell React not to nullify the event object
    evt.persist();
    if (!this.debouncedFn) {
      this.debouncedFn = this.debounce(() => {
        this.handleSizeChange(evt);
      }, 500);
    }
    this.debouncedFn();
  };

  // HANDLE KEY DOWN
  handleKeyDown() {}
  // HANDLE KEY DOWN ends

  // SET CLASS
  // Called from makeSizeJsx to assemble class name
  // for width/height input
  setClass(type) {
    const config = this.props.config;
    const heightError = config.heightError;
    const widthError = config.widthError;
    let className = '';
    if (type === 'width') {
      className = 'number-field width-input';
      if (widthError) {
        className = `${className} size-error`;
      }
    } else {
      className = 'number-field height-input';
      if (heightError) {
        className = `${className} size-error`;
      }
    }
    return className;
  }
  // SET CLASS ends

  // MAKE SIZE JSX
  // Called from sizeJsx to assemble chart size div
  // containing width and height inputs
  makeSizeJsx() {
    const { height, width } = this.state;
    // const height = this.state.height;
    // const width = this.state.width;
    return (
      <div className="size-wrapper">
        <span className="silver-label-head size-label">Size</span>
        <input
          type="number"
          id="size-width-input"
          className={this.setClass('width')}
          min={this.props.minWidth}
          // Remove leading 0s
          value={`${width}`.replace(/^0+/, '')}
          onKeyDown={this.handleKeyDown}
          onChange={this.debounceSizeChange}
          required
        />
        <span className="silver-label x-label" htmlFor="size-height-input">
          ×
        </span>
        <input
          type="number"
          id="size-height-input"
          className={this.setClass('height')}
          step="5"
          min={this.props.minHeight}
          value={`${height}`.replace(/^0+/, '')}
          onKeyDown={this.handleKeyDown}
          onChange={this.debounceSizeChange}
          required
        />
      </div>
    );
  }
  // MAKE SIZE JSX ends

  // SIZE AND PRESET JSX
  // Calls sub-function to construct JSX for size controls
  sizeJsx() {
    const sizeJsx = this.makeSizeJsx();
    return <div className="size-wrapper">{sizeJsx}</div>;
  }
  // SIZE AND PRESET JSX ends

  // RENDER
  render() {
    return this.sizeJsx();
  }
}

// PROP TYPES and DEFAULTS
Size.propTypes = {
  config: PropTypes.object.isRequired,
  minHeight: PropTypes.number,
  minWidth: PropTypes.number,
  onValuesToSizeAndPreset: PropTypes.func.isRequired,
};

export default Size;
