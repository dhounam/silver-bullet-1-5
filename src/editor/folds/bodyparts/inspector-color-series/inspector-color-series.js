import React, { Component } from 'react';
import SibylEventEmitter from '../../../../util/event/EventEmitter';
import { EVENT_SEND_COLOUR_MAP, EVENT_UPDATE_COLOUR_MAP } from '../../../../util/event/EventNames';
import {SortableContainer, SortableElement} from 'react-sortable-hoc';
import globalAssets from '../../../assets/globalAssets';
import { replace, values, truncate, isEqual, findKey, isUndefined } from 'lodash';
import { arrayMoveImmutable } from 'array-move';
import { GithubPicker } from 'react-color';

let Subscription = null

class InspectorColorSeries extends Component {

  constructor(props) {
    super(props);
    this.state = {
      panels: undefined,
      colorPickerIndex: undefined,
      colorKeys: [],
      colors: [],
      labels: [],
      color: undefined //hex value of the selected color
    };
  }



  componentWillMount() {    
    Subscription = SibylEventEmitter.addListener(EVENT_SEND_COLOUR_MAP, (data) => {
      let {panels, colourMaps} = data;
      this.setState({
        ...data,
        colorKeys:colourMaps[panels.active].range(),
        colors:   colourMaps[panels.active].range().map( colour => globalAssets.ColourLookup.colours[colour]),
        labels:   colourMaps[panels.active].domain()
      });
    });    
  }



  componentWillUnmount() {
    Subscription.remove();
  }



  // if there has been any change on color values or color keys, notify it.
  // Do not notify if the update is just because the arrays are still empty
  // and we have received the data
  componentDidUpdate(prevProps, prevState) {
    if(!isEqual(prevProps.panels, this.props.panels) && this.state.colourMaps) {
      let colourMaps = this.state.colourMaps,
        panels = this.props.panels;

      this.setState({
        panels:   panels,
        colorKeys:colourMaps[panels.active].range(),
        colors:   colourMaps[panels.active].range().map( colour => globalAssets.ColourLookup.colours[colour]),
        labels:   colourMaps[panels.active].domain()
      });
    }
  }



  render() {
    // sortable react elements for color labels
    const SortableItemLabel = SortableElement(({value}) => <li>{truncate(replace(value, /<br>/g, ' '))}</li>);
    const SortableListLabel = SortableContainer(({items}) => {
      return (
        <ul>
          {items.map((value, index) => (
            <SortableItemLabel key={`item-${value}`} index={index} value={value} />
          ))}
        </ul>
      );
    });

    // sortable react elements for color rects
    const SortableItemColor = SortableElement(({value}) => <li className="color" style={{backgroundColor: value}}/>);
    const SortableListColor = SortableContainer(({items}) => {
      return (
        <ul>
          {items.map((value, index) => (
            <SortableItemColor key={`item-${value}`} index={index} value={value} />
          ))}
        </ul>
      );
    });

    return (
      <div className="inspector-color-series-div">        
        <div className="silver-label-head">
          Color series
          {
            !isUndefined(this.state.panels) && <span> (panel {this.state.panels.active+1} of {this.state.panels.total})</span>
          }
        </div>
        <div className="data-series">

          {/* color picker, positioned dynamically next to the clicked color */}
          <div style={{position: "relative", left: 5, top: ((this.state.colorPickerIndex+1)*26)}}>
            {
              !isUndefined(this.state.colorPickerIndex)? <div className="color-picker-placeholder">
                <div className="color-picker-fadeoff" onClick={ () => this.setState({ colorPickerIndex: undefined }) }/>
                <GithubPicker 
                  colors={values(globalAssets.ColourLookup.colours)}
                  color={this.state.color}
                  onChangeComplete={(color) => {                    
                    let colors = [...this.state.colors],
                    colorKeys = [...this.state.colorKeys];
                    colors[this.state.colorPickerIndex] = color.hex;  
                    colorKeys[this.state.colorPickerIndex] = findKey(globalAssets.ColourLookup.colours, value => value === color.hex);
                    
                    SibylEventEmitter.emit(EVENT_UPDATE_COLOUR_MAP, {colorKeys, labels:this.state.labels});
                    this.setState({colors, colorKeys});
                  }}
                />
              </div> : null
            }
          </div>
          
          {/* buttons to trigger the color picker */}
          <div className="data-series-color-picker">
            <ul>
            {
              this.state.colors.map( 
                (color, index) => 
                  <li key={index} onClick={() => {this.setState({ colorPickerIndex: index, color: color })}}>+</li>                  
                )                
            }
            </ul>
          </div>
          
          {/* color samples */}
          <div className="data-series-color">
            <SortableListColor helperClass="inspector-color-series-sorted-element colour" items={this.state.colors} onSortEnd={({oldIndex, newIndex}) => {
              let colorKeys = arrayMoveImmutable(this.state.colorKeys, oldIndex, newIndex),
                  colors = arrayMoveImmutable(this.state.colors, oldIndex, newIndex); 
              SibylEventEmitter.emit(EVENT_UPDATE_COLOUR_MAP, {colorKeys, labels:this.state.labels});
              this.setState({colorKeys, colors});
            }}/>
          </div>

          {/* labels */}
          <div className="data-series-label">
            <SortableListLabel helperClass="inspector-color-series-sorted-element label" items={this.state.labels} onSortEnd={({oldIndex, newIndex}) => {
              let labels = arrayMoveImmutable(this.state.labels, oldIndex, newIndex);
              SibylEventEmitter.emit(EVENT_UPDATE_COLOUR_MAP, {colorKeys:this.state.colorKeys, labels});
              this.setState({labels});
            }}/>
          </div>
        </div>        
      </div>
    );
  }
}

export default InspectorColorSeries;