// Editor
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Utilities
import * as EditorUtils from './utilities/editor-utilities';
import * as OtherUtils from './utilities/other-utilities';
import * as EditorConfigDefaultUtils from './utilities/editor-config-default-utilities';
import * as Filename from './utilities/filename';
import * as EditorConfigUtils from './utilities/editor-config-utilities';
import * as ScaleConfigUtils from './utilities/scale-config-utilities';
import * as ScaleCallbackUtils from './utilities/scale-callback-utilities';
import * as AdvancedFoldUtils from './utilities/advanced-fold-utilities';
import * as MonteuxExport from './monteux/monteux-export';
// Sub-components
import SizeAndPreset from './size-and-preset/size-and-preset';
import Panels from './panels/panels';
import Alerts from './panels/alerts';
import Strings from './strings/strings';
import FoldsWrapper from './folds/folds-wrapper';
import FooterWrapper from './footer/footer';
import MonteuxImport from './monteux/monteux-import';
// Assets
import globalAssets from './assets/globalAssets';
import { updateOldSubPreset } from './utilities/payload-utilities/presets-utilities';

let DefaultChartConfig;
let DefaultPreferences;
let PresetPreferences;
let ColourLookup;

class SilverEditor extends Component {
  static get defaultProps() {
    return {
      // 'iden' must match specific fold selector in css
      // 'Design' fold is open by default
      folds: {
        design: {
          iden: 'design',
          display: 'Design',
          open: true,
          disabled: false,
          errorMsg: '',
        },
        scales: {
          iden: 'scales',
          display: 'Scales',
          open: false,
          disabled: false,
          errorMsg: '',
        },
        advanced: {
          iden: 'advanced',
          display: 'Advanced',
          open: false,
          disabled: false,
          errorMsg: '',
        },
      },
      // Styles compatible with double scales
      doubleableStyles: ['line', 'stepline', 'pointline', 'column', 'none'],
    };
  }

  constructor(props) {
    super(props);
    // ***callSibyl*** is a flag that determines whether componentDidUpdate
    // can wake Sibyl up. It's set false by default and when new props
    // arrive from index.js. But any user-event sets true.
    // Ditto ***updateMonteux***, which determines whether EditorConfig data
    // are exported to the data sheets.
    // ***editorConfig*** is this component's internal configuration object
    // ***chartConfig*** is the configuration object that gets passed ChartSide
    // ***headersChanged*** is tripped if the column headers have changed in
    // incoming rawData, indicating possible restructure
    // ***newPayload*** determines whether the calculated min/max/incr should overwrite
    // the user-fields in Scales. False by default; but gets set true on new data acquisition...
    this.state = {
      loadingAssets: true,
      callSibyl: false,
      updateMonteux: false,
      chartConfig: {},
      editorConfig: {},
      headersChanged: false,
      newPayload: false,
    };
    // Subcomponent handlers
    this.handleValuesFromSizeAndPreset = this.handleValuesFromSizeAndPreset.bind(
      this,
    );
    this.handleValuesFromPanels = this.handleValuesFromPanels.bind(this);
    this.handleValuesFromStrings = this.handleValuesFromStrings.bind(this);
    this.handleValuesFromFooter = this.handleValuesFromFooter.bind(this);
    this.handleValuesFromFoldsWrapper = this.handleValuesFromFoldsWrapper.bind(
      this,
    );
    this.handleMonteuxImportValues = this.handleMonteuxImportValues.bind(this);
  }

  // NOTE: lifecycle stuff all needs fixing big-time. I can't be initialising
  // the editor and chart config objects like this. It was all based on the way I set
  // up the initial paste-in field. But now that we're talking to Monteux, that
  // all needs completely refactoring

  // COMPONENT WILL MOUNT
  // Calls makeNewChartConfig to assemble a new default chart CO
  // ...and initiateNewEdConfig to assemble default editor CO
  UNSAFE_componentWillMount() {
    // load external assets: a collection of JSON files containing all the available settings
    const assetsFolder = 'assets';
    const assetFiles = [
      'default_chart_config.json',
      'default_preferences.json',
      'preset_preferences.json',
      'colours.json',
    ].map(assetFile => [assetsFolder, assetFile].join('/'));

    // fetch all the files
    Promise
      .all(assetFiles.map(assetFile => fetch(assetFile)))
      .then(responses => {
        // fetching files means getting a Response stream object, not the file itself,
        // so call the json() method of the Response interface to read the file
        Promise
          // json method return a promise which resolves with the result of parsing the body text as JSON
          .all(responses.map(response => response.json()))
          .then(JSONs => {
            
            // JSONs available, populate all the config and preferences objects            
            DefaultChartConfig  = JSONs[0]; // The default internal config object, to be 'beefed up' with specifics
            DefaultPreferences  = JSONs[1]; // Default preferences
            PresetPreferences   = JSONs[2]; // Preset preferences
            ColourLookup        = JSONs[3]; // Colour definitions

            // make all the asset objects available for other modules
            globalAssets.DefaultChartConfig = DefaultChartConfig;
            globalAssets.DefaultPreferences = DefaultPreferences;
            globalAssets.PresetPreferences  = PresetPreferences;
            globalAssets.ColourLookup       = ColourLookup;

            const presetsConfig = this.getPresetsObjectByUser(false);
            const chartConfig = this.makeNewChartConfig(presetsConfig);
            // Arg 2 is string for consistency with payload import
            const editorConfig = EditorConfigUtils.initiateNewEdConfig(
              presetsConfig,
              'false',
              1,
              '000',
            );
            chartConfig.metadata.editorMount = false;
            // Setting state here makes it available on first render...
            this.setState({
              loadingAssets: false,
              chartConfig,
              editorConfig,
              headersChanged: false,
              isDataError: false,
              dataErrorString: '',
            });
          })
          .catch(console.error)
      });    
  }
  // COMPONENT WILL MOUNT ends

  UNSAFE_componentWillReceiveProps() {
    // Set flag to prevent reflex bounce-back to Sibyl
    const callSibyl = false;
    const updateMonteux = false;
    // This isn't new raw data, so:
    const newPayload = false;
    this.setState({ callSibyl, updateMonteux, newPayload });
  }

  // COMPONENT DID UPDATE
  // After state-reset and render, calls fcn to
  // update CO from editorConfig (chained to callback)
  componentDidUpdate() {
    if (this.state.callSibyl) {
      this.reconcileEditorToChartConfig();
    }
    if (this.state.updateMonteux) {
      const { editorConfig } = this.state;
      MonteuxExport.updateGoogleSheet(editorConfig);
    }
  }
  // COMPONENT DID UPDATE ends


  // GET PRESETS OBJECT BY USER
  // Called variously
  // Creates an object with preset properties, depending on
  // user (economist or eiu), for passing down various chains
  // Params are a flag to indicate whether to look for presets
  // in edConfigGlobal, and (possibly) an existing presets object
  // extracted from the Monteux payload
  getPresetsObjectByUser(useGlobal, ppObj) {
    // User is baked into the build
    const { user } = this.props;
    const dpMetaDef = DefaultPreferences.metadata.defaults;
    const edConfigGlobal = this.state.editorConfig.global;
    // User-specific presets object
    const userPresets = Object.assign({}, PresetPreferences[user]);
    // Names of preset and subpreset to pinpoint in the userPresets
    // Absolute defaults:
    let presetName = dpMetaDef.preset[user];
    let subpresetName = dpMetaDef.subPreset[user];
    // If edConfigGlobal is flagged and exists:
    if (useGlobal && typeof edConfigGlobal !== 'undefined') {
      presetName = edConfigGlobal.presets.preset;
      subpresetName = edConfigGlobal.presets.subPreset;
    } else if (typeof ppObj !== 'undefined') {
      // Or use props from Monteux payload, if any
      presetName = ppObj.preset;
      subpresetName = ppObj.subPreset;
    }
    const pObj = {
      user,
      userPresets,
      presetName,
      subpresetName,
    };
    return pObj;
  }
  // GET PRESETS OBJECT BY USER

  // GET DEFAULT CHART CONFIG PROPERTIES
  // Called from makeNewChartConfig to set properties to default
  // values in default preferences file. These default properties are:
  // - metadata: newchart, panels, preset, section, subPreset, type
  // - background.outerbox: dimensions, etc.
  // Calls setBackgroundProperties to update actual background...
  getDefaultChartConfigProperties(defaultConfig, presetsConfig) {
    // Metadata; default preset and section
    const dps = Object.assign({}, DefaultPreferences);
    const metadata = Object.assign({}, dps.metadata.defaults);
    // Append colour lookup to metadata
    metadata.colours = ColourLookup.colours;
    // const { preset } = metadata;
    // const { subPreset } = metadata;
    // const userPresets = this.getUserPresets();
    // const presets = { preset, subPreset, userPresets };
    // Default chart object
    defaultConfig.panelArray[
      metadata.chartIndex
    ] = EditorUtils.getNewChartObject(this.state.newPayload, presetsConfig);
    // I need to impose all default background properties
    EditorConfigUtils.setBackgroundProperties(
      defaultConfig,
      presetsConfig,
      true,
    );
    // And don't forget the metadata itself
    defaultConfig.metadata = metadata;
    return defaultConfig;
  }
  // GET DEFAULT CHART CONFIG PROPERTIES ends

  // MAKE NEW CHART CONFIG
  // Called from componentWillMount and when new panel is added
  // Clones the default CO and calls fcn to populate it. Then sets it
  // as activeCO and appends to CO array...
  makeNewChartConfig(presetsConfig) {
    // Clone empty config structure
    const emptyConfig = Object.assign({}, DefaultChartConfig);
    // Insert default properties and set as global:
    const chartConfig = this.getDefaultChartConfigProperties(
      emptyConfig,
      presetsConfig,
    );
    // Return, so that caller, componentWillMount, can set it on state
    // before first render...
    return chartConfig;
  }
  // MAKE NEW CHART CONFIG ends

  // ===========================================================================
  // === NEW CHART UTILITIES END
  // ===========================================================================

  // SET PRESET SOURCE STRING
  // Called from handleValuesFromSizeAndPreset. This is uncomfortably
  // inferential, but I suspect we just have to be brazen about it:
  // LD charts omit source. Params are subPreset string and
  // global editorConfig
  // NOTE: is this even necessary, since it's the 'display' flag
  // that will determine whether a source shows...
  setPresetSourceString(presetNode, edConfigGlobal) {
    // Dig down in the node, for source string...
    const defaultSource = (
      (((presetNode || {}).background || {}).strings || {}).source || {}
    ).content;
    let mySource = edConfigGlobal.strings.source;
    if (typeof defaultSource !== 'undefined') {
      // If there's a defined default for this subPreset, use it
      mySource = defaultSource;
    } else if (mySource.length === 0) {
      // No set default. But if source was prev'y empty, we revert
      // to a default (i.e. switching from LD to another subPreset)
      const dps = Object.assign({}, DefaultPreferences);
      mySource = dps.other.defaultSource;
    }
    edConfigGlobal.strings.source = mySource;
  }
  // SET PRESET SOURCE STRING ends

  // RECONCILE EDITOR TO CHART CONFIG
  // I pass editorConfig data to chartConfig, do any consequent
  // actions, then send the chartConfig up to Sibyl...
  reconcileEditorToChartConfig() {
    // Get bearings:
    const { editorConfig } = this.state;
    const edConfigGlobal = editorConfig.global;
    // User-specific presets
    const presetsConfig = this.getPresetsObjectByUser(true);
    // GLOBAL PROPERTIES
    const chartConfig = this.state.chartConfig;
    EditorConfigUtils.reconcileEditorToChartGlobalConfig(
      edConfigGlobal,
      chartConfig,
      presetsConfig,
    );
    // PANELS
    // Loop through ALL panels:
    const configPanelArray = [];
    const pCount = editorConfig.panels.length;
    for (let pNo = 0; pNo < pCount; pNo++) {
      const onePanel = editorConfig.panels[pNo];
      const onePanelConfig = EditorConfigUtils.reconcileEditorToChartPanelConfig(
        onePanel,
        presetsConfig,
      );
      configPanelArray.push(onePanelConfig);
    }
    chartConfig.panelArray = configPanelArray;    

    // The last thing to do, before we go whizzing off chartside,
    // is add definitions for any additional colours.
    // NOTE: do I even need to do next, if limited number of series?
    EditorConfigUtils.defineAdditionalColours(chartConfig);
    // Callback to index.js, heading for chartside...
    this.props.onPassUpdatedConfig(JSON.parse(JSON.stringify(chartConfig)));
  }
  // RECONCILE EDITOR TO CHART CONFIG ends

  // NO DATA
  // Called from handleValuesFromFoldsWrapper. Don't respond to
  // any user gesture if there aren't any data to process
  noData() {
    const { editorConfig } = this.state;
    const edConfigGlobal = editorConfig.global;
    const { chartIndex } = edConfigGlobal;
    const onePanel = editorConfig.panels[chartIndex];
    return onePanel.chartData.dataArray.length === 0;
  }
  // NO DATA ends

  // GET SECTIONID FOR NEW PRESET
  // Called from handleValuesFromSizeAndPreset. When user changes
  // subpreset, this verifies that the section or country code in
  // the existing filename is found in the list of codes for the
  // new subpreset. If not, resets to default code for the new subpreset
  // Params are object including filename; preset node and its child subpreset node
  getSectionIdForNewPreset(pObj, pNode, spNode) {
    // I need a list of codes
    // Look in subpreset first; if not found look in parent preset
    let sections = spNode.sections;
    if (typeof sections === 'undefined') {
      sections = pNode.sections;
    }
    // Isolate filename
    // NOTE: I had a query here about whether we need the eco/eiu user flag...
    // ...but it seems that we don't... for now, at least...
    let id = Filename.getFilenameSectionId(pObj.name);
    // Some presets force a default; otherwise check list for an item with
    // existing ID and, if not found, use default
    if (sections.forceDefault || !sections.list.some(item => item.code === id)) {
      id = sections.default;
    }
    return id;
  }
  // GET SECTIONID FOR NEW PRESET ends

  // ===========================================================================
  // === EVENT HANDLERS
  // ===========================================================================

  // HANDLE VALUES FROM SIZE AND PRESET
  // Event from size or preset
  handleValuesFromSizeAndPreset(values) {
    const { editorConfig } = this.state;
    const edConfigGlobal = editorConfig.global;
    const myPresets = edConfigGlobal.presets;
    const mySize = edConfigGlobal.size;
    // Existing sub/preset
    const existingPreset = myPresets.preset;
    const existingSubPreset = myPresets.subPreset;
    // New (or not) preset
    const { preset } = values.preset;
    const { subPreset } = values.preset;
    let newPreset = false;
    if (existingPreset !== preset || existingSubPreset !== subPreset) {
      newPreset = true;
    }
    // Isolate user PPs (economist/eiu)
    const { user } = edConfigGlobal;
    const userPPs = PresetPreferences[user];
    const presetNode = userPPs[preset];
    const subpresetNode = userPPs[preset][subPreset];

    if (newPreset) {
      myPresets.preset = preset;
      myPresets.subPreset = subPreset;
      // Update size to preset default
      // Get the user-specific presets, but overwrite with
      // new sub/preset
      const presetsConfig = this.getPresetsObjectByUser(false);
      presetsConfig.presetName = preset;
      presetsConfig.subpresetName = subPreset;
      // Get preset size:
      const chainA = ['background', 'outerbox', 'dimensions'];
      const presetSize = EditorConfigUtils.findPreferencesNode(
        presetsConfig,
        chainA,
      );
      // Is size of new preset forced?
      // mySize.forceWidth = presetSize.forceWidth;
      // mySize.forceHeight = presetSize.forceHeight;
      if (presetSize.forceHeight) {
        mySize.height = presetSize.height;
      }
      if (presetSize.forceWidth) {
        mySize.width = presetSize.width;
      }
      mySize.pngWidth = presetSize.pngWidth;
      // Set Illustrator colour space
      EditorConfigUtils.setIllustratorColourSpace(
        edConfigGlobal,
        presetsConfig,
      );
      // Chartwrapper has to scale for responsive DCs
      OtherUtils.setChartWrapperScaleClass(presetsConfig);
    } else {
      // No change to Preset
      if(values.size) {
        // so set size to what's just arrived
        mySize.width = values.size.width;
        mySize.height = values.size.height;
      }            
    }

    // Section. If preset has changed, section *may* change
    // In PPs, sections has props default (a string) and list
    // I want to bring those across to edConfigGlobal.fileName.sections
    // which has props default, dateIndex and list
    const presetObj = {
      preset,
      subPreset,
      name: edConfigGlobal.fileName.name,
    };
    // Section id is extracted from filename -- unless
    // id isn't found in new preset, in which case
    // substitute preset's default id
    const sectionID = this.getSectionIdForNewPreset(
      presetObj,
      presetNode,
      subpresetNode,
    );
    //
    const mySections = edConfigGlobal.fileName.sections;
    let sections = subpresetNode.sections;
    if (typeof sections === 'undefined') {
      sections = presetNode.sections;
    }
    mySections.list = sections.list;
    mySections.default = sections.default;
    // Index , by code
    // NOTE: this lookup is dup'd in EditorConfigUtils. Do better?
    mySections.index = sections.list.findIndex(
      // item => item.code === sections.default,
      item => item.code === sectionID,
    );
    // Update file name, retaining existing file number
    edConfigGlobal.fileName.name = Filename.updateFileName(
      edConfigGlobal.fileName,
      sectionID,
      edConfigGlobal.user,
    );
    // LD charts omit source...
    this.setPresetSourceString(presetNode, edConfigGlobal);
    this.setState({
      callSibyl: true,
      updateMonteux: true,
      headersChanged: false,
      isDataError: false,
      dataErrorString: '',
      newPayload: false,
      editorConfig,
    });
  }
  // HANDLE VALUES FROM SIZE AND PRESET ends

  // GET DEFAULT SIDE
  // Called from handleValuesFromChartTypeComponent to
  // determine default side for new chart type
  // NOTE: questionable bit of hard-coding...
  // NOTE: and at some point I need to add top/bottom
  // to the way scales are 'sided'
  // H-thermos added Jul'20
  getDefaultSide(chartType) {
    let side = 'right';
    if (chartType === 'bar' || chartType === 'thermohorizontal') {
      side = 'left';
    }
    return side;
  }
  // GET DEFAULT SIDE ends

  // HANDLE NEW SCATTER FROM CHART TYPE COMPONENT
  // Called from handleValuesFromChartTypeComponent, if type
  // is (sized-)scatter. This allows for different data structure
  handleNewScatterFromChartTypeComponent(values, editorConfig) {
    const onePanel = EditorUtils.getActivePanel(editorConfig);
    // NOTE: on scatters, left = x-axis and right = y-axis
    // Flag 2/3-d scatter
    const isSimple = !values.type.includes('sized');
    // Set scatter props now, so that when
    // EditorUtils.splitScatterDataArray is called, down
    // the line, it knows whether it's a simple or sized scatter
    onePanel.scales.scatter.isScatter = true;
    onePanel.scales.scatter.isSimple = isSimple;
    // Update scale MMI etc values
    EditorConfigDefaultUtils.revertPanelDefaultVals(
      editorConfig,
      'chartType',
      values.type,
      this.state.newPayload,
    );
    //
    //
    onePanel.enableScale.left = true;
    onePanel.enableScale.right = true;
    onePanel.chartType.left.type = values.type;
    onePanel.chartType.left.stacked = false;
    onePanel.chartType.left.log = false;
    onePanel.chartType.left.thermoDots = false;
    onePanel.chartType.left.scatterLabels = values.scatterLabels;
    onePanel.chartType.left.scatterTrendline = values.scatterTrendline;
    onePanel.chartType.right.type = values.type;
    onePanel.chartType.right.stacked = false;
    onePanel.chartType.right.log = false;
    onePanel.chartType.right.thermoDots = false;
    onePanel.chartType.right.scatterLabels = values.scatterLabels;
    onePanel.chartType.right.scatterTrendline = values.scatterTrendline;
    // ...and updates by ref
  }
  // HANDLE NEW SCATTER FROM CHART TYPE COMPONENT ends

  handleOldScatterFromChartTypeComponent(
    values,
    editorConfig,
    enableSide,
    newType,
  ) {
    const onePanel = EditorUtils.getActivePanel(editorConfig);
    // Get side for new type
    let disableSide = 'left';
    if (enableSide === 'left') {
      disableSide = 'right';
    }
    onePanel.enableScale[enableSide] = true;
    onePanel.enableScale[disableSide] = false;
    onePanel.chartType[enableSide].type = newType;
    onePanel.chartType[disableSide].type = 'none';
    onePanel.chartType[enableSide].stacked = false;
    onePanel.chartType[disableSide].stacked = false;
    onePanel.chartType[enableSide].thermoDots = false;
    onePanel.chartType[disableSide].thermoDots = false;
    onePanel.chartType[enableSide].scatterLabels = false;
    onePanel.chartType[disableSide].scatterLabels = false;
    onePanel.chartType[enableSide].scatterTrendline = false;
    onePanel.chartType[disableSide].scatterTrendline = false;
    EditorConfigDefaultUtils.revertPanelDefaultVals(
      editorConfig,
      'chartType',
      values.type,
      this.state.newPayload,
    );

    onePanel.scales[disableSide] = Object.assign(
      {},
      EditorConfigDefaultUtils.getDefaultScaleSideProps(),
    );
    onePanel.scales.scatter.isScatter = false;
    onePanel.scales.scatter.isSimple = true;
  }

  // HANDLE VALUES FROM CHART TYPE COMPONENT
  // Called from handleValuesFromFoldsWrapper to process
  // chart-type, stacking and other minor options
  // NOTE: by definition, if we're handling changes from Chart Type
  // component, only one side is 'active'
  handleValuesFromChartTypeComponent(values) {
    const { editorConfig } = this.state;
    const edConfigGlobal = editorConfig.global;
    const { chartIndex } = edConfigGlobal;
    const onePanel = editorConfig.panels[chartIndex];
    const oldSide = EditorUtils.getSide(onePanel);
    const oldType = onePanel.chartType[oldSide].type;
    // I have to adjust type for stacking
    let newType = values.type;
    // Tables are a total fuckup. To work round the problem,
    // I set a flag here; pretend that we want a line chart,
    // so that all the required defaults get set, then
    // fix table-specifics at the bottom of this function
    const isTable = newType === 'table';
    if (isTable) {
      newType = 'line';
    }
    // if (newType === 'table') {
    //   // FIXME: 'get it working' kludge
    //   this.handleTableType(editorConfig, chartIndex);
    //   return;
    // }
    // This isn't fully followed up; but I put an
    // overall chart type at top level
    onePanel.overallChartType = newType;
    const newSide = this.getDefaultSide(newType);
    const isScatter = newType.includes('scatter');
    const wasScatter = onePanel.chartType.left.type.includes('scatter');
    // FIXME: can we try to regard this as a kludge, until
    // I can get scatters working...?
    // FIXME: further kludging, Aug'19. In the short term,
    // I want to pre-empt any scale or other radical changes
    // after scatter-labels or thermo-dots changed
    const whatChanged = values.whatChanged;
    let majorChange = true;
    if (whatChanged === 'scatter-labels') {
      onePanel.chartType.left.scatterLabels = values.scatterLabels;
      onePanel.chartType.right.scatterLabels = values.scatterLabels;
      majorChange = false;
    } else if (whatChanged === 'scatter-trendline') {
      onePanel.chartType.left.scatterTrendline = values.scatterTrendline;
      onePanel.chartType.right.scatterTrendline = values.scatterTrendline;
      majorChange = false;
    } else if (whatChanged === 'thermo-dots') {
      onePanel.chartType.left.thermoDots = values.thermoDots;
      onePanel.chartType.right.thermoDots = values.thermoDots;
      majorChange = false;
    }
    // Still in FIXME: mode: this condition is shit!
    // Actually, it's *all* shit.
    if (majorChange) {
      if (isScatter) {
        // NOTE: needs more work. Compare new and old type, for a start...
        // ...because if it hasn't changed, we do nothing, anyway
        this.handleNewScatterFromChartTypeComponent(values, editorConfig);
      } else if (wasScatter) {
        this.handleOldScatterFromChartTypeComponent(
          values,
          editorConfig,
          newSide,
          newType,
        );
      } else {
        // NOTE: this fork should be separate fcn
        // Still here? Non-scatter, where one 'side' is active
        onePanel.scales.scatter.isScatter = false;
        // Chart type determines left/right enabling
        // And if this came from chart type, and not a scatter, scale must be single
        // So (ignoring any stacking) which side...?
        // NOTE: bar charts map top:left and bottom:right
        if (newSide !== oldSide) {
          // Swap over axis Prefs
          onePanel.scales[newSide] = Object.assign(
            {},
            onePanel.scales[oldSide],
          );
          // And set other (old) side to default values:
          onePanel.scales[oldSide] = Object.assign(
            {},
            EditorConfigDefaultUtils.getDefaultScaleSideProps(),
          );
          onePanel.enableScale[newSide] = true;
          onePanel.enableScale[oldSide] = false;
          onePanel.chartType[oldSide].type = 'none';
          onePanel.chartType[oldSide].stacked = false;
          onePanel.chartType[oldSide].thermoDots = false;
          onePanel.chartType[oldSide].scatterLabels = false;
          onePanel.chartType[oldSide].scatterTrendline = false;
        }
        // Is chart currently stacked?
        const oldStacked = onePanel.chartType[oldSide].stacked;
        let newStacked = values.stacked;
        // But (Dec'18) there's a loose cannon: if we're changing from a stacked
        // bar or column chart to a line chart, I need to check that the values
        // are legal for a layer cake (can't mix +/- values in any one series).
        // NOTE: next few lines can outsource...
        // If chart type has changed, to 'step/line'...
        if (
          newType !== oldType &&
          (newType === 'line' || newType === 'stepline')
        ) {
          // ...and if the data are 'currently' stacked...
          if (oldStacked) {
            // ...check if they are legal as a layer cake:
            newStacked = EditorConfigUtils.willDataLayerCake(
              onePanel.chartData,
            );
          }
        }
        // Set new side:
        onePanel.chartType[newSide].type = newType;
        onePanel.chartType[newSide].stacked = newStacked;
        onePanel.chartType[newSide].thermoDots = values.thermoDots;
        onePanel.chartType[newSide].scatterLabels = values.scatterLabels;
        onePanel.chartType[newSide].scatterTrendline = values.scatterTrendline;
        // Call revertPanelDefaultVals if stacking or orientation has changed
        // NOTE: log scales...?
        let newRdv = false;
        if (oldStacked !== newStacked) {
          newRdv = true;
        } else if (!values.sameOrientation) {
          newRdv = true;
        }
        if (newRdv) {
          EditorConfigDefaultUtils.revertPanelDefaultVals(
            editorConfig,
            'chartType',
            values.type,
            this.state.newPayload,
          );
        }
      }
      // Axis headers
      AdvancedFoldUtils.updateDefaultAxisHeadersInEdConfig(onePanel, false);
    }
    if (isTable) {
      // Pick up the table 'side-step'. Having pretended that
      // we wanted a line chart, to get the required defaults
      // in place, now kick myself in the shins and tell me
      // to be a table!
      // FIXME: this is a desperate emergency kludge that
      // only a major refactor of data structure can fix
      onePanel.chartType.left.type = 'table';
      onePanel.chartType.right.type = 'table';
      // Set legend columns, to force no space for legends
      // (Not the best way to do this)
      onePanel.legend.columns = 0;
    }
    this.setState({
      callSibyl: true,
      updateMonteux: true,
      headersChanged: false,
      isDataError: false,
      dataErrorString: '',
      newPayload: false,
      editorConfig,
    });
  }
  // HANDLE VALUES FROM CHART TYPE COMPONENT ends

  // HANDLE VALUES FROM BLOB COMPONENT
  handleValuesFromBlobComponent(values) {
    const { editorConfig } = this.state;
    const edConfigGlobal = editorConfig.global;
    const { chartIndex } = edConfigGlobal;
    const onePanel = editorConfig.panels[chartIndex];
    const myBlobs = onePanel.blobs;
    myBlobs.column = values.column;
    myBlobs.hasBlobs = values.column > 0;
    myBlobs.header = values.header;
    // If only the bubble/block flag has changed, I don't need to change anything
    // except that in EditorConfig
    if (values.isRect !== myBlobs.isRect) {
      myBlobs.isRect = values.isRect;
    } else {
      // Otherwise, I've switched blobs on or off, or changed the blob column,
      // in which case I need to reset scale vals to raw defaults
      EditorConfigDefaultUtils.revertPanelDefaultVals(
        editorConfig,
        'blobs',
        '',
        this.state.newPayload,
      );
    }
    this.setState({
      callSibyl: true,
      updateMonteux: true,
      headersChanged: false,
      isDataError: false,
      dataErrorString: '',
      newPayload: false,
      editorConfig,
    });
  }
  // HANDLE VALUES FROM BLOB COMPONENT ends

  // HANDLE VALUES FROM LEGEND COMPONENT
  handleValuesFromLegendComponent(values) {
    const { editorConfig } = this.state;
    const { chartIndex } = editorConfig.global;
    const onePanel = editorConfig.panels[chartIndex];
    const myLegend = onePanel.legend;
    myLegend.header = EditorUtils.smartenQuotes(values.header);
    myLegend.columns = values.columns;
    myLegend.max = values.max;
    this.setState({
      callSibyl: true,
      updateMonteux: true,
      headersChanged: false,
      isDataError: false,
      dataErrorString: '',
      newPayload: false,
      editorConfig,
    });
  }
  // HANDLE VALUES FROM LEGEND COMPONENT ends

  // HANDLE VALUES FROM FOLDS WRAPPER
  // Callback from the Folds wrapper
  // But which sub-component called out?
  handleValuesFromFoldsWrapper(values) {
    // We can't do anything unless there's some data to do it to:
    if (values.vals.source !== 'rawData' && this.noData()) {
      return;
    }
    if (values.fold === 'design') {
      // Design fold
      const { source } = values.vals;
      if (source === 'chartType') {
        this.handleValuesFromChartTypeComponent(values.vals);
      } else if (source === 'blobs') {
        this.handleValuesFromBlobComponent(values.vals);
      } else {
        this.handleValuesFromLegendComponent(values.vals);
      }
    } else if (values.fold === 'advanced') {
      const { source } = values.vals;
      if (source === 'rawData') {
        // Data from the Advanced fold's textfield,
        // now handled by Monteux chain (false for not payload)
        this.handleMonteuxImportValues(values.vals, false);
      } else if (source === 'axisHeaders') {
        this.handleValuesFromAxisHeadersComponent(values.vals);
      } else if (source === 'numberBox') {
        this.handleValuesFromNumberBoxComponent(values.vals);
      }
    } else if (values.fold === 'scales') {
      // Function here acts as intermediary, calling
      // handler in ScaleCallbackUtils, then resetting state
      this.fieldValuesFromScalesFold(values);
    }
  }
  // HANDLE VALUES FROM FOLDS WRAPPER ends

  // HANDLE VALUES FROM AXIS HEADERS COMPONENT
  // Called from handleValuesFromFoldsWrapper. Extracts
  // axis headers
  handleValuesFromAxisHeadersComponent(vals) {
    const { editorConfig } = this.state;
    const onePanel = EditorUtils.getActivePanel(editorConfig);
    const myHeaders = onePanel.axisHeaders;
    myHeaders.xaxis = EditorUtils.smartenQuotes(vals.xaxis);
    // Ignore all headers, except xaxis
    // myHeaders.yaxisleft = EditorUtils.smartenQuotes(vals.yaxisleft);
    // myHeaders.yaxisright = EditorUtils.smartenQuotes(vals.yaxisright);
    // myHeaders.zaxis = EditorUtils.smartenQuotes(vals.zaxis);
    this.setState({
      callSibyl: true,
      updateMonteux: true,
      headersChanged: false,
      isDataError: false,
      dataErrorString: '',
      newPayload: false,
      editorConfig,
    });
  }
  // HANDLE VALUES FROM AXIS HEADERS COMPONENT ends

  handleValuesFromNumberBoxComponent(vals) {
    const { editorConfig } = this.state;
    editorConfig.global.strings.numberBox = vals.val;
    this.setState({
      callSibyl: true,
      updateMonteux: true,
      headersChanged: false,
      isDataError: false,
      dataErrorString: '',
      newPayload: false,
      editorConfig,
    });
  }

  // HANDLE MONTEUX IMPORT VALUES
  // Sep'20: 2nd param deleted when axis headers recoupled
  // fromMonteux is true for Monteux payload; false for paste-in
  handleMonteuxImportValues(values) {
    // first check to be done ASAP is to update a possible deprecated
    // online subpreset (see presets-utilities.js for a rationale on that)
    const preset = values.global.values.preset;
    const oldSubPreset = values.global.values.subPreset;
    const { subPreset, hasBeenUpdated } =  updateOldSubPreset(
      preset,
      oldSubPreset
    );
    if(hasBeenUpdated) {
      // if the subpreset was a deprecated one, update it and 
      // override the old width
      values.global.values.subPreset = subPreset;
      values.global.values.width = globalAssets
        .PresetPreferences.economist[preset][subPreset]
        .background.outerbox.dimensions.width;
    }

    // Check validity flags in each 'panel' data.
    const dataReport = EditorUtils.monteuxDataAreValid(values);
    if (dataReport.goodData) {
      // Now, reverse-engineer the object as exported...
      // Call function in EditorConfigUtils to create a new
      // editorConfig and populate it with the incoming values
      //
      // We need payload sub/preset, if they exist
      const ppObj = EditorUtils.getPayloadPresetAndSubPresetIfAny(values);
      // If ppObj is undefined, fcn will use default sub/Preset vals
      const presetsConfig = this.getPresetsObjectByUser(false, ppObj);
      // Before we create a new editorConfig object, extract
      // existing headers (all panels) for comparison with incoming
      // Comm'd out Sep'20 when axis headers recoupled
      // const existingHeaders = EditorConfigUtils.extractSeriesHeaders(
      //   this.state.editorConfig.panels,
      // );
      // Ditto filename:
      // Comm'd out Sep'20 when axis headers recoupled
      // const existingFileName = this.state.editorConfig.global.fileName.name;
      // Now update potential editorConfig with payload data
      const edConfigObj = EditorConfigUtils.updateEdConfigWithNewPayload(
        values,
        presetsConfig,
      );
      // Before we reset state.editorConfig...
      // ... do we need to flag up a possible data restructure
      // Set hard, Sep'20. See just below
      const headersChanged = false;
      // Incoming filename
      // const payloadFileName = edConfigObj.global.fileName.name;
      // Only check headers if data came from Sheet (i.e. not paste-in)
      // and it's the SAME chart!
      // Headers check comm'd out Sep'20, since axis headers are no longer decoupled from series headers
      /*
      if (fromMonteux && payloadFileName === existingFileName) {
        // Have headers changed?
        const payloadHeaders = EditorConfigUtils.extractSeriesHeaders(
          edConfigObj.panels,
        );
        headersChanged = EditorConfigUtils.haveHeadersChanged(
          existingHeaders,
          payloadHeaders,
        );
      }
      */
      // Flag existingChart (set in EdConfigUtils.updateEdConfigWithNewPayload)
      // is true for a re-sync; false if payload is a completely new
      // dataset (with no existing global or metadata properties).
      // If the dataset is completely new, Sibyl has to update
      // Monteux with the default value that it has added to the
      // data. If it's a resync, the callback is redundant
      const updateMonteux = !edConfigObj.global.existingChart;
      // If we successfully generated a new editorConfig...
      if (edConfigObj.goodPayload) {
        // Now check: are the data problematic?
        // (I.e., they can process, but user needs to be nudged)
        const isDataError = dataReport.problematicData;
        const dataErrorString = dataReport.dataMsg;
        this.setState({
          callSibyl: true,
          updateMonteux,
          headersChanged,
          isDataError,
          dataErrorString,
          newPayload: edConfigObj.global.newPayload,
          editorConfig: edConfigObj,
        });
      }
    } else {
      // We need to fire an error alert at something...
      this.setState({
        callSibyl: false,
        updateMonteux: false,
        headersChanged: false,
        isDataError: true,
        dataErrorString: dataReport.dataMsg,
      });
    }
  }
  // HANDLE MONTEUX IMPORT VALUES ends

  // HANDLE VALUES FROM STRINGS FOLD
  // Values is an obj with props title, etc.
  handleValuesFromStrings(values) {
    // No data values? Bale out.
    if (this.noData()) {
      return;
    }
    // Fetch props from editorConfig
    const { editorConfig } = this.state;
    const edConfigGlobal = editorConfig.global;
    const { chartIndex } = edConfigGlobal;
    const activePanel = editorConfig.panels[chartIndex];
    const myStrings = edConfigGlobal.strings;
    const vStrings = values.strings;
    // The straightforward stuff...
    myStrings.title = EditorUtils.smartenQuotes(vStrings.title);
    myStrings.subtitle = EditorUtils.smartenQuotes(vStrings.subtitle);
    myStrings.subsubtitle = EditorUtils.smartenQuotes(vStrings.subsubtitle);
    myStrings.source = EditorUtils.smartenQuotes(vStrings.source);
    myStrings.footnote = EditorUtils.smartenQuotes(vStrings.footnote);
    // And number of footnotes
    myStrings.footnoteCount = values.footnoteCount;
    // Panel header
    activePanel.panelHeader = EditorUtils.smartenQuotes(vStrings.panelHeader);
    this.setState({
      callSibyl: true,
      updateMonteux: true,
      headersChanged: false,
      isDataError: false,
      dataErrorString: '',
      newPayload: false,
      editorConfig,
    });
  }
  // HANDLE VALUES FROM STRINGS FOLD ends

  // FIELD VALUES FROM SCALES FOLD
  // Called from handleValuesFromFoldsWrapper. Calls
  // handler in ScaleCallbackUtils to update editorConfig, then
  // sets state to force update and trigger chartside
  fieldValuesFromScalesFold(values) {
    // Get bearings:
    const { editorConfig } = this.state;
    const callSibyl = ScaleCallbackUtils.handleValuesFromScalesFold(
      editorConfig,
      values,
    );
    const updateMonteux = callSibyl;
    this.setState(
      {
        callSibyl,
        updateMonteux,
        headersChanged: false,
        isDataError: false,
        dataErrorString: '',
        editorConfig,
        newPayload: false,
      },
      this.handleHeightChange,
    );
  }
  // FIELD VALUES FROM SCALES FOLD ends

  // MANUALLY SEND NEW HEIGHT TO MONTEUX
  handleHeightChange() {
    const { height } = document
      .querySelector('.silver-bullet')
      .getBoundingClientRect();

    window.parent.postMessage(
      {
        type: 'RESIZE',
        payload: {
          height: height + 5,
          origin: document.location.href,
        },
      },
      '*',
    );
  }

  handleValuesFromFooter(values) {
    // I have date, dateIndex, section and sectionIndex
    const { editorConfig } = this.state;
    const fnObj = editorConfig.global.fileName;
    const user = editorConfig.global.user;
    fnObj.dates.dateIndex = values.dateIndex;
    fnObj.sections.index = values.sectionIndex;
    // Change filename (retaining file number)
    // False flag: don't change section id
    fnObj.name = Filename.updateFileName(fnObj, values.section, user);
    this.setState({
      callSibyl: false,
      updateMonteux: true,
      headersChanged: false,
      isDataError: false,
      dataErrorString: '',
      editorConfig,
    });
  }

  // *** EVENT HANDLERS END ***

  // SIZE AND PRESET

  // MAKE PRESET CONFIG ARRAY
  // Called from makeHeaderJsx to assemble preset definitions. Object
  // is passed, via Size, to Preset, where menu structure is assembled
  makePresetConfigArray() {
    // economist/eiu?
    const user = this.state.editorConfig.global.user;
    // Current preset
    const { preset } = this.state.editorConfig.global.presets;
    const pps = PresetPreferences[user];
    // Result will be an array of preset definitions
    const presetArray = [];
    // Loop by preset definitions (print, espresso, etc.)
    Object.keys(pps).forEach(key => {
      // Exclude my comments (this needs to be deleted... or something... eventually)
      if (key.search('__') < 0) {
        const obj = pps[key];
        // Init obj to return with preset name
        // (All lower case; tab bar does uppercasing)
        const tempObj = { parent: key };
        tempObj.display = obj.display;
        // Subpresets list:
        const children = [];
        Object.keys(obj).forEach(childKey => {
          // Exclude metadata nodes
          if (
            !childKey.includes('__') &&
            !childKey.includes('display') &&
            !childKey.includes('sections')
          ) {
            const dims = obj[childKey].background.outerbox.dimensions;
            const childO = { id: childKey, display: dims.display };
            children.push(childO);
          }
        });
        // So we have an array of child names.
        // ( Presets with no subPreset: children = ['default'] )
        tempObj.children = children;
        // Flag for default hightlight on tab bar
        tempObj.default = key === preset;
        presetArray.push(tempObj);
      }
    });
    return presetArray;
  }
  // MAKE PRESET CONFIG ARRAY ends

  // HANDLE VALUES FROM PANELS
  // So far, Sibyl can change only panel focus, and number of rows
  handleValuesFromPanels(values) {
    const { editorConfig } = this.state;
    const edConfigGlobal = editorConfig.global;
    // Set flag to update chart if panel orientation (number of rows) changed:
    const callSibyl = values.panels.rows !== edConfigGlobal.panelVals.rows;
    const updateMonteux = callSibyl;
    edConfigGlobal.panelVals = values.panels;
    // chartIndex (from zero)
    const chartIndex = values.panels.active;
    edConfigGlobal.chartIndex = chartIndex;
    this.setState({
      callSibyl,
      updateMonteux,
      headersChanged: false,
      isDataError: false,
      dataErrorString: '',
      newPayload: false,
      editorConfig,
    });
  }
  // HANDLE VALUES FROM PANELS ends

  // CONFIG OBJECTS FOR CHILDREN

  // MAKE SIZE AND PRESET CONFIG
  // Called from makeSizeAndPresetJsx
  makeSizeAndPresetConfig() {
    // Fetch props
    const { editorConfig } = this.state;
    const edConfigGlobal = editorConfig.global;
    // const { chartIndex, user } = edConfigGlobal;
    // const { user } = edConfigGlobal;
    // const onePanel = editorConfig.panels[chartIndex];
    const presetsConfig = this.getPresetsObjectByUser(true);
    const preset = presetsConfig.presetName;
    const subPreset = presetsConfig.subpresetName;
    const presetDef = {
      preset,
      subPreset,
      presetArray: this.makePresetConfigArray(),
    };
    // Size
    const sizeDefs = edConfigGlobal.size;
    // Recommended height removed, Sep'20
    // const pps = PresetPreferences[user];
    // Is there a size-specific error? Status message determines whether
    // height or width
    // As of Feb'21, errorStatus (from Chartside via App.js) never changes from default 'off'
    // so none of this has any effect on size or preset components
    const eStatus = this.props.errorStatus;
    let widthError = false;
    let heightError = false;
    if (eStatus.isError && eStatus.fold === 'size') {
      widthError = eStatus.status.includes('width');
      heightError = eStatus.status.includes('height');
    }

    const spConfigObj = {
      size: {
        widthError,
        heightError,
        // defaultRecommendedHeight: sizeDefs.defaultRecommendedHeight,
        height: sizeDefs.height,
        maximumChartWidth: DefaultPreferences.other.maximumChartWidth,
        // lockHeight: dims.lockHeight,
        // lockWidth: dims.lockWidth,
        // recommendedHeight,
        width: sizeDefs.width,
      },
      preset: presetDef,
      updateEditor: false,
    };

    return spConfigObj;
  }
  // MAKE SIZE AND PRESET CONFIG ends

  makePanelsConfig() {
    const pConfigObj = {};
    // Fetch props from state
    const { editorConfig } = this.state;
    pConfigObj.values = editorConfig.global.panelVals;
    return pConfigObj;
  }

  // MAKE ALERTS CONFIG
  // Called from makeAlertsJsx
  makeAlertsConfig() {
    // Until Feb'21, errors could arrive from Chartside, via App. This
    // is no longer the case. The only errors will concern data
    // The flag is state.isDataError...
    const errorStatus = {
      showAlert: false,
      alertString: '',
    };
    if (this.state.isDataError) {
      // Data error bubbled up from Data
      errorStatus.showAlert = true;
      errorStatus.alertString = this.state.dataErrorString;
    } else if (this.state.headersChanged) {
      // Chart status from props
      errorStatus.showAlert = true;
      errorStatus.alertString =
        'Data structure has changed. Are your axis headers still correct?';
    }
    //  else {
    //   // Chart status from props
    //   errorStatus.showAlert = this.props.errorStatus.isError;
    //   errorStatus.alertString = this.props.errorStatus.status;
    // }
    return errorStatus;
  }
  // MAKE ALERTS CONFIG ends

  // MAKE DESIGN FOLD CONFIG
  // Called from makeFoldsJsx to create Design fold config object
  makeDesignFoldConfig() {
    const designConfig = {};
    const { editorConfig } = this.state;
    const cIndex = editorConfig.global.chartIndex;
    const onePanel = editorConfig.panels[cIndex];
    // CHART TYPE component needs a general en/disabled flag, as well
    // as type and stacked. If scale is double or mixed, the entire
    // chart type component is disabled
    // NOTE: this is... awkward, anyway. I originally used type strings
    // like 'stackedbar' and, for now at least, I'm stuck with them.
    // But I need to strip out the prefix before sending the props
    // down to the chartType component. Ideally, I'd use the simple
    // type and the stacked boolean all the way down the tree...
    let type = '';
    let stacked = false;
    let thermoDots = false;
    let scatterLabels = false;
    let scatterTrendline = false;
    let typeDisabled = false;
    // Does this do anything?
    const onlyTableEnabled = false;
    const { isDouble } = onePanel.scales.double;
    const { isMixed } = onePanel.scales.mixed;
    const isTableData = onePanel.chartData.isTable;
    if (isDouble || isMixed || isTableData) {
      typeDisabled = true;
    } else {
      const side = EditorUtils.getSide(onePanel);
      stacked = onePanel.chartType[side].stacked;
      type = onePanel.chartType[side].type;
      thermoDots = onePanel.chartType[side].thermoDots;
      scatterLabels = onePanel.chartType[side].scatterLabels;
      scatterTrendline = onePanel.chartType[side].scatterTrendline;
      if (stacked) {
        type = type.replace('stacked', '');
      }
    }
    // But there's an override for scatter labels. If there are too many
    // datapoints, the scatter labels option is unavailable
    let scattersCanLabel = true;
    const maxScatterLabels =
      DefaultPreferences.metadata.defaults.maxScatterLabels;
    if (onePanel.chartData.dataArray.length > maxScatterLabels) {
      scatterLabels = false;
      scattersCanLabel = false;
    }
    // Log scale?
    const isLog = onePanel.scales.left.log || onePanel.scales.right.log;
    // Layer cake-ability flag
    const { canLayerCake } = onePanel.chartData;
    // Pies: no vals < 0
    const minVal = Math.min(
      onePanel.scales.left.actualMin,
      onePanel.scales.right.actualMin,
    );
    const noPie = minVal < 0;
    // For scatters, we need to know the number of series: number
    // of headers, excluding categories column. However, that won't
    // exist at startup, so...
    let seriesCount = 0;
    if (typeof onePanel.chartData.headers !== 'undefined') {
      seriesCount = onePanel.chartData.headers.length - 1;
    }
    designConfig.chartType = {
      canLayerCake,
      noPie,
      seriesCount,
      stacked,
      scattersCanLabel,
      scatterLabels,
      scatterTrendline,
      thermoDots,
      type,
      typeDisabled,
      onlyTableEnabled,
      isLog,
      // Pass in user to (temporarily, we hope) disable tables for EIU
      user: editorConfig.global.user,
    };
    // BLOBS
    // Blobs component needs chart type; a column index; and an
    // array of series headers
    // But disable if double/mixed scale... or if only one series
    const three = 3;
    let oneSeries = false;
    const dArray = onePanel.chartData.dataArray;
    if (dArray.length > 0) {
      oneSeries = dArray[0].length < three;
    } else {
      oneSeries = true;
    }
    let blobsDisabled = isDouble || isMixed || oneSeries;
    // Kludge for pie/table
    // FIXME: when I refactor Editor
    if (!blobsDisabled) {
      blobsDisabled = this.setDisabledStatusByChartType();
    }
    const { dataArray } = onePanel.chartData;
    let headers = ['None'];
    if (dataArray.length > 0) {
      headers = JSON.parse(JSON.stringify(dataArray[0]));
      // Set Cat header to 'None', for blobs dropdown
      headers[0] = 'None';
    }
    designConfig.blobs = {
      column: onePanel.blobs.column,
      disabled: blobsDisabled,
      headers,
      isRect: onePanel.blobs.isRect,
    };
    // LEGEND
    // Legend component needs a header string, current val, max value
    // Max is the number of series (count headers; drop cat-head)...
    // ...except for PIES, which count the number of POINTS
    // (i.e. 'rows' of data, excluding headers)
    let max = headers.length - 1;
    if (type.includes('pie')) {
      max = dataArray.length - 1;
    }
    const legendDisabled = type === 'tabletable';
    // const legendDisabled = this.setDisabledStatusByChartType();
    designConfig.legend = {
      columns: onePanel.legend.columns,
      disabled: legendDisabled,
      header: onePanel.legend.header,
      max,
    };
    // Fold is always visible
    designConfig.disabled = false;
    // add info of the active panel, cols and total panels {active, rows, total}
    designConfig.panels = editorConfig.global.panelVals;

    return designConfig;
  }
  // MAKE DESIGN FOLD CONFIG ends

  // MAKE FOOTER CONFIG
  makeFooterConfig() {
    const edConfigGlobal = this.state.editorConfig.global;
    const fileNameObj = edConfigGlobal.fileName;
    const dimensions = edConfigGlobal.size;
    const { pngFactor, gifFactor } = DefaultPreferences.other;
    // Colour space for Illustrator
    const colourSpace = edConfigGlobal.colourSpace;
    const config = {
      colourSpace,
      dimensions,
      fileNameObj,
      pngFactor,
      gifFactor,
    };
    return config;
  }
  // MAKE FOOTER CONFIG ends

  // CONFIG OBJECTS FOR CHILDREN END

  // JSX CONSTRUCTORS

  // MAKE SIZE AND PRESET JSX
  makeSizeAndPresetJsx() {
    const sizeAndPresetConfig = this.makeSizeAndPresetConfig();
    return (
      <SizeAndPreset
        config={sizeAndPresetConfig}
        onValuesToEditor={this.handleValuesFromSizeAndPreset}
      />
    );
  }
  // MAKE SIZE AND PRESET JSX ends

  // MAKE PANELS JSX
  makePanelsJsx() {
    const panelsConfig = this.makePanelsConfig();
    return (
      <Panels
        config={panelsConfig}
        onValuesToEditor={this.handleValuesFromPanels}
      />
    );
  }

  // MAKE ALERTS JSX
  makeAlertsJsx() {
    const alertsConfig = this.makeAlertsConfig();
    return <Alerts config={alertsConfig} />;
  }

  makeStringsConfig() {
    const { editorConfig } = this.state;
    const edConfigGlobal = editorConfig.global;
    const cIndex = edConfigGlobal.chartIndex;
    const onePanel = editorConfig.panels[cIndex];
    return {
      values: {
        title: edConfigGlobal.strings.title,
        subtitle: edConfigGlobal.strings.subtitle,
        subsubtitle: edConfigGlobal.strings.subsubtitle,
        source: edConfigGlobal.strings.source,
        footnote: edConfigGlobal.strings.footnote,
        panelHeader: onePanel.panelHeader,
        panelTotal: edConfigGlobal.panelVals.total,
        user: edConfigGlobal.user,
        specialSourceStrings: edConfigGlobal.strings.specialSourceStrings,
        footnoteSymbols: edConfigGlobal.strings.footnoteSymbols,
      },
    };
  }

  // MAKE STRINGS JSX
  makeStringsJsx() {
    const stringsConfig = this.makeStringsConfig();
    return (
      <Strings
        config={stringsConfig}
        onValuesToEditor={this.handleValuesFromStrings}
      />
    );
  }
  // MAKE STRINGS JSX ends

  // SET DISABLED STATUS BY CHART TYPE
  // Called from makeFoldsJsx, to determine whether
  // Scales fold should be disabled.
  // From makeDesignFoldConfig for Blobs and Legend
  setDisabledStatusByChartType() {
    const { editorConfig } = this.state;
    const chartIndex = editorConfig.global.chartIndex;
    const chartType = editorConfig.panels[chartIndex].chartType;
    const typeString = `${chartType.left.type}${chartType.right.type}`;
    let disabled = false;
    // NOTE: another kludge working round the overallChartType issue
    if (typeString.includes('pie') || typeString === 'tabletable') {
      disabled = true;
    }
    return disabled;
  }
  // SET DISABLED STATUS ends BY CHART TYPE

  // MAKE FOLDS JSX
  makeFoldsJsx() {
    const { editorConfig } = this.state;
    // Design fold
    const designConfig = this.makeDesignFoldConfig();
    // Scales fold
    const disableFold = this.setDisabledStatusByChartType();
    // Factors disabled, Oct'20. But still pass DP's factoring prefs
    const scalesFoldConfig = ScaleConfigUtils.makeScalesFoldConfig(
      editorConfig,
      DefaultPreferences.other.factors,
      this.props.doubleableStyles,
      disableFold,
      DefaultPreferences.other.maximumIncrements,
    );
    // Advanced fold
    const advancedConfig = AdvancedFoldUtils.makeAdvancedFoldConfig(
      editorConfig,
      DefaultPreferences,
    );
    const foldsConfig = {
      foldsList: this.props.folds,
      designConfig,
      scalesFoldConfig,
      advancedConfig,
      updateEditor: false,
    };
    return (
      <FoldsWrapper
        config={foldsConfig}
        handleHeightChange={this.handleHeightChange}
        onValuesToEditor={this.handleValuesFromFoldsWrapper}
      />
    );
  }
  // MAKE FOLDS JSX ends

  makeFooterJsx() {
    const footerConfig = this.makeFooterConfig();
    return (
      <FooterWrapper
        config={footerConfig}
        onValuesToEditor={this.handleValuesFromFooter}
      />
    );
  }

  makeMonteuxImportConfig() {
    const dps = Object.assign({}, DefaultPreferences);
    const requiredDataPrefs = {
      timeFormats: dps.metadata.timeformats,
      dayInMilliSeconds: dps.other.dayInMilliSeconds,
      defaultChartType: dps.metadata.defaults.type,
      forceTurn: dps.other.forceTurn,
    };
    return {
      requiredDataPrefs,
    };
  }

  makeMonteuxImportJsx() {
    const monteuxConfig = this.makeMonteuxImportConfig();
    return (
      <MonteuxImport
        config={monteuxConfig}
        onValuesToEditor={this.handleMonteuxImportValues}
      />
    );
  }

  // JSX CONSTRUCTORS END

  // ===========================================================================
  // RENDER
  render() {
    return this.state.loadingAssets? <div style={{padding:'1rem'}}>Loading setup, please wait...</div> : 
      <div className="editor-wrapper">
        {this.makeFoldsJsx()}
        {this.makeSizeAndPresetJsx()}
        <div className="panels-outer-wrapper">
          {this.makePanelsJsx()}
          {this.makeAlertsJsx()}
        </div>
        {this.makeStringsJsx()}
        {this.makeFooterJsx()}
        {this.makeMonteuxImportJsx()}
      </div>
  }
}

SilverEditor.propTypes = {
  // comes from App.js buildEditor
  user: PropTypes.string,
  // Callback to index.js
  onPassUpdatedConfig: PropTypes.func.isRequired,
  // Fold definitions
  folds: PropTypes.object,
  // Double-able styles
  doubleableStyles: PropTypes.array,
  // Message from the Chart Side
  // (not actually used)
  errorStatus: PropTypes.object,
};

export default SilverEditor;
