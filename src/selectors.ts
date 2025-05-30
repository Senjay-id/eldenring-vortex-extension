import { IModLookupInfo } from './types';

import * as _ from 'lodash';
import { createSelector } from 'reselect';
import { selectors, types, util } from 'vortex-api';

const allMods = (state: types.IState) => state.persistent.mods;
const allLoadOrders = (state: types.IState) => state.persistent['loadOrder'] || {};
const primaryTools = (state: types.IState) => state.settings.interface['primaryTool'] || {};

export const currentPrimaryTool = createSelector([primaryTools, selectors.activeGameId],
  (tools, gameId) => {
    if (!gameId || !tools[gameId]) {
      return null;
    }
    return tools[gameId];
  });

export const currentLoadOrder = createSelector(
  [allLoadOrders, selectors.activeProfile],
  (loadOrders, profile: types.IProfile) => {
    if (!loadOrders || !profile) {
      return [];
    }
    return loadOrders[profile.id] || [];
  });

export const currentGameMods = createSelector(allMods, selectors.activeGameId, (inMods, gameId) =>
  inMods[gameId]);

export const currentGameModsOfType = createSelector(
  [currentGameMods, (_, modType: string) => modType],
  (mods, modType: string) => {
    const returnObj: { [modId: string]: types.IMod } = {};
    Object.keys(mods || {}).forEach(modId => {
      if (mods[modId].type === modType) {
        returnObj[modId] = mods[modId];
      }
    });
    return returnObj;
  }
);

export const currentModState = createSelector(selectors.activeProfile, (profile) =>
  profile ? profile.modState : {});

let lastLookupInfo: IModLookupInfo[];
export const enabledMods = createSelector(currentGameMods, currentModState, (mods, modStateIn) => {
  const res: IModLookupInfo[] = [];
  Object.keys(mods || {}).forEach(modId => {
    const attributes = mods[modId].attributes || {};
    if (util.getSafe(modStateIn, [modId, 'enabled'], false)
        && (attributes['fileMD5'] || attributes['fileName']
            || attributes['logicalFileName'] || attributes['name'])) {
      res.push({
        ...attributes,
        id: modId,
        type: mods[modId].type,
        installationPath: mods[modId].installationPath,
      } as any);
    }
  });

  // avoid changing the object if content didn't change. reselect avoids recalculating unless input
  // changes but it's very possible mods/modState changes without causing the enabled-keys to change
  if (!_.isEqual(res, lastLookupInfo)) {
    lastLookupInfo = res;
  }

  return lastLookupInfo;
});

export const isModEnabled = createSelector(
  [currentGameMods, currentModState, (_, modId: string) => modId],
  (mods, modStateIn, modId) => {
    if (!mods || !modId) {
      return false;
    }
    const mod = mods[modId];
    if (!mod) {
      return false;
    }
    return util.getSafe(modStateIn, [modId, 'enabled'], false);
  });