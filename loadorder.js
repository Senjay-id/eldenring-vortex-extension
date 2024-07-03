const { types } = require('vortex-api');
const { GAME_ID } = require('./common');

const eldenRingLoadOrderPage = {
  gameId: GAME_ID,
  deserializeLoadOrder: () => {
    // This is where we're going to deserialize the toml file.
    return Promise.resolve([]);
  },
  serializeLoadOrder: (currentLoadOrder, previousLoadOrder) => {
    // This is where we're going to write the TOML file
    return Promise.resolve();
  },
  validate: (prev, current) => {
    // This is where we validate the loadOrder if needed.
    return Promise.resolve(undefined);
  },
  usageInstructions: 'This is where you can set the load order for Elden Ring mods.',
  toggleableEntries: false,
};

module.exports = {
  eldenRingLoadOrderPage,
}
