/* eslint-disable */
import { types } from 'vortex-api';
import { GAME_ID } from './common';
import { readLOFile, writeLOFile } from './util';
import { ComponentType } from 'react';
import { enabledMods, isModEnabled } from './selectors';
import { IModLookupInfo } from './types';

import React from 'react';
import { InfoPanel } from './InfoPanel';

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
    this.usageInstructions = () => React.createElement(InfoPanel);
    this.customItemRenderer = undefined;
    this.noCollectionGeneration = undefined;
  }
  public serializeLoadOrder = async (loadOrder: types.LoadOrder, prev: types.LoadOrder): Promise<void> => {
    return writeLOFile(this.mAPI, loadOrder);
  };

  public deserializeLoadOrder = async (): Promise<types.LoadOrder> => {
    const enabled: IModLookupInfo[] = enabledMods(this.mAPI.getState());
    const added = new Set<string>();
    const current = await readLOFile(this.mAPI);
    const newEntries = enabled.reduce((accum, mod) => {
      const exists = current.some(c => c.modId === mod.id);
      const shouldGenerateExtension = mod.eldenGenerateExtension && mod.eldenModName;
      const hasDlls = Array.isArray(mod.eldenModDlls) && mod.eldenModDlls.length > 0;
      // It doesn't look like the order of the dll entries matters, so we just add them all
      //  could add a custom item renderer to show them in a different way in the future.
      if ((!exists && shouldGenerateExtension) || hasDlls) {
        accum.push({
          id: mod.eldenModName,
          modId: mod.id,
          name: mod.name,
          enabled: true,
        });
        added.add(mod.id);
      }
      return accum;
    }, []);
    const updatedCurrent = current.filter(c => isModEnabled(this.mAPI.getState(), c.modId));
    return Promise.resolve([].concat(updatedCurrent, newEntries));
  };

  public validate = async (prev: types.LoadOrder, current: types.LoadOrder):  Promise<types.IValidationResult> => {
    return Promise.resolve(undefined);
  };
}
