/* eslint-disable */
import path from 'path';
import { selectors, types } from 'vortex-api';
import { GAME_ID, MOD_ENGINE2_MODTYPE } from './common';
import { fileExists, getMods, readLOFile, writeLOFile } from './util';
import { ComponentType } from 'react';

export class EldenRingLoadOrderPage implements types.ILoadOrderGameInfo {
  private mAPI: types.IExtensionApi;

  public gameId: string;
  public toggleableEntries?: boolean;
  public clearStateOnPurge?: boolean;
  public usageInstructions?: string | ComponentType<{}>;
  public customItemRenderer?: ComponentType<{ className?: string; item: types.IFBLOItemRendererProps; forwardedRef?: (ref: any) => void; }>;
  public noCollectionGeneration?: boolean;

  constructor(api: types.IExtensionApi) {
    this.mAPI = api;
    this.gameId = GAME_ID;
    this.toggleableEntries = false;
    this.clearStateOnPurge = false;
    this.usageInstructions = 'This is where you can set the load order for Elden Ring mods.';
    this.customItemRenderer = undefined;
    this.noCollectionGeneration = undefined;
  }
  public serializeLoadOrder = async (loadOrder: types.LoadOrder, prev: types.LoadOrder): Promise<void> => {
    return writeLOFile(this.mAPI, loadOrder);
  };

  public deserializeLoadOrder = async (): Promise<types.LoadOrder> => {
    const state = this.mAPI.getState();
    const mods = await getMods(this.mAPI, MOD_ENGINE2_MODTYPE);
    const current = await readLOFile(this.mAPI);
    const modPath = selectors.modPathsForGame(state, GAME_ID)[MOD_ENGINE2_MODTYPE];
    const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
    const profile = selectors.profileById(state, profileId)
    const isEnabled = (mod: types.IMod) => profile.modState?.[mod.id]?.enabled;
    const available = await mods.reduce(async (accumP, m) => {
      const accum = await accumP;
      if (!isEnabled(m)) {
        return accum;
      }
      if (!fileExists(path.join(modPath, 'mod', m.id))) {
        return accum;
      }
      accum.push({ id: m.id, modId: m.id, name: m.id, enabled: true });
      return accum;
    }, Promise.resolve([]));
    const added = new Set<string>();
    const newEntries: types.ILoadOrderEntry[] = [].concat(current, available).reduce((accum, iter) => {
      const exists = available.some(a => a.id === iter.id);
      const removed = current.some(c => c.id === iter.id) && !exists;
      if (removed) {
        return accum;
      }
      if (added.has(iter.id)) {
        return accum;
      }
      added.add(iter.id);
      const mod = mods.find(m => m.id === iter.id);
      if (!mod) {
        return accum;
      }
      accum.push({ id: mod.id, modId: mod.id, name: mod.id, enabled: true });
      return accum;
    }, []);
    return Promise.resolve(newEntries);
  };
  public validate = async (prev: types.LoadOrder, current: types.LoadOrder):  Promise<types.IValidationResult> => {
    return Promise.resolve(undefined);
  };
}
