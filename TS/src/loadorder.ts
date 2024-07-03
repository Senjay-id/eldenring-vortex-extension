import { types } from 'vortex-api';
import { GAME_ID } from './common';

export const eldenRingLoadOrderPage: types.ILoadOrderGameInfo = {
  gameId: GAME_ID,
  deserializeLoadOrder: (): Promise<types.LoadOrder> => {
    // This is where we're going to deserialize the toml file.
    return Promise.resolve([]);
  },
  serializeLoadOrder: (currentLoadOrder: types.LoadOrder, previousLoadOrder: types.LoadOrder): Promise<void> => {
    // This is where we're going to write the TOML file
    return Promise.resolve();
  },
  validate: (prev: types.LoadOrder, current: types.LoadOrder): Promise<types.IValidationResult> => {
    // This is where we validate the loadOrder if needed.
    return Promise.resolve(undefined);
  },
  usageInstructions: 'This is where you can set the load order for Elden Ring mods.',
  toggleableEntries: false,
}