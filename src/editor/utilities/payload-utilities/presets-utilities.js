/* eslint-disable no-underscore-dangle */
import { has } from 'lodash';

/*
    In Sept 2022 Online sub presets and its sizes are updated. Here the table of old ones and the
    equivalences with the new ones (table contains displayed values, not the IDs):
    
      Old                 New
    ----------------------------------------
    SPECIALS
      half-column             mini
      one-and-a-half-column   one-column-wide
    ONINE
      Narrow                  Slim
      Full width              Full width
      Espresso                Espresso
      Instagram Story         Slime
      DC Desktop              Full width
      DC Mobile               Slim
      Films                   Films
    ----------------------------------------

    For those subPresets that persist (Espresso, Full width), they change its width as well.
    so although they are named the same, old subPresets should update its width to the new one.
    Internally, we need diferent IDs to diferentate old ones from new ones, since what follows
    is the policy related to how the width will be overriden/maintained:
    - old ones will get its width overriden to the new size.
    - new ones will keep its width maintained.
    Some charts have custom widths different from the default. For the charts with deprecated subPresets
    this width will be overriden to the new default width, while charts created with the new subPresets
    will keep any width value they could have.

    @param  preset
    @param  subpreset

    @returns {subPreset, hasBeenUpdated} 
  */
export function updateOldSubPreset(preset, _subPreset) {
  // Lookups have old sub preset names and new equivalents
  // for print special and online charts
  const printSpecialConversionTable = {
    'half-column': 'mini',
    'standard-one-column': 'one-column',
    'one-and-a-half-column': 'one-column-wide',
  };
  const onlineConversionTable = {
    narrow: 'online-slim',
    wide: 'online-full-width',
    espresso: 'online-espresso',
    'instagram-story': 'online-slim',
    'daily-chart-desktop': 'online-full-width',
    'daily-chart-mobile': 'online-slim',
    films: 'online-films',
  };
  // So: print-special, or online?
  const conversionTable =
    preset === 'print' ? printSpecialConversionTable : onlineConversionTable;

  // let subPreset = (preset === 'online' && has(conversionTable, _subPreset)) ?
  let subPreset = has(conversionTable, _subPreset)
    ? conversionTable[_subPreset]
    : _subPreset;

  return {
    subPreset,
    hasBeenUpdated: _subPreset !== subPreset,
  };
}
