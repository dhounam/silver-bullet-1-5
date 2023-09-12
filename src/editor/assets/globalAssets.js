/**
 * WHY THIS MODULE?
 * 
 * Rationale:
 * ----------
 * 
 * Initially, the set of JSON files contanining all the configs/parameters/preferences/etc of Sybil 
 * were loaded in compilation time, that is, imported as modules. The caveat of it was that every time
 * a change on any parameter contained on these files was needed, the entire app needed to be compiled again.
 * 
 * Now files are in the public folder public/assets/, and are fetched by the editor.js in the phase 
 * 'componentWillMount' of the lifecycle, as external files. There is a specific property in the editor's state
 * called 'loadingAssets', flagged to false when such files are loaded, and only then the Editor component
 * starts doing all the stuff (since the data of these json files is needed everywhere).
 * 
 * While this is easy to control for just the editor.js component as explained above, there are some other
 * modules within Sibyl that also load these files via import statements, hence a way to globally
 * access this information is needed.
 * 
 * This module is the one now being imported by all the modules that needed that info, so editor.js
 * populates these globalAssets object as soon as the JSON files are loaded, so before all the stuff
 * happens this object is already populated and ready to be used.
 */

let globalAssets = {
  DefaultChartConfig: undefined,
  DefaultPreferences: undefined,
  PresetPreferences: undefined,
  ColourLookup: undefined
};

export default globalAssets;