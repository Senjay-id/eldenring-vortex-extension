const path = require('path');
const { fs, log, types, util } = require('vortex-api');
const { GAME_ID, STEAM_APP_ID, REGULAR_MODS_RELPATH, MOD_ENGINE_MODS_RELPATH, MODENGINE2_ELDEN_RING_SCRIPT, GAME_BINARY_RELPATH } = require('./common');
const { installModEngine2Content, testSupportedModEngine2Content, testSupportedOverhaulContent } = require('./installers');
const { tools } = require('./tools');
const { findModByFile } = require('./util');
//const { download } = require('./downloader');
//const { IGitHubAsset, IPluginRequirement } = require('./types');
const { eldenRingLoadOrderPage } = require('./loadorder');

/* eslint-disable */


const PLUGIN_REQUIREMENTS = [
  {
    fileName: 'ModEngine-2.1.0.0-win64.zip',
    modType: 'dinput',
    userFacingName: 'ModEngine2',
    githubUrl: 'https://api.github.com/repos/soulsmods/ModEngine2',
    assetMatcher: (asset) => asset.name.match(/ModEngine-/)?.length > 0,
    findMod: (api) => findModByFile(api, 'dinput', MODENGINE2_ELDEN_RING_SCRIPT),
  },
];


function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Elden Ring',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => '',
    logo: 'gameart.jpg', //Couldn't find any elden ring png art
    executable: () => 'game/eldenring.exe',
    requiredFiles: [
      'game/eldenring.exe',
    ],
    setup: (discovery) => prepareForModding(context.api, discovery),
    environment: {
      SteamAPPId: STEAM_APP_ID,
    },
    details: {
      steamAppId: STEAM_APP_ID,
      stopPatterns: ['(^|/)mods(/|$)'], //Elden Mod Loader pattern not to be confused with ModEngine2
    },
  });

  const isEldenRing = (game) => game.id === GAME_ID;
  context.registerModType('eldenring-modengine2-overhaul-mod', 25, isEldenRing, () => MOD_ENGINE_MODS_RELPATH, () => Promise.resolve(false), {
    name: 'ModEngine 2 Overhaul Mod',
    mergeMods: true,
  });

  context.registerModType('eldenring-eldenmodloader', 25, 
    () => (game) => isEldenRing(game) && isEldenModLoaderType(),
    () => GAME_BINARY_RELPATH, () => Promise.resolve(false), {
    name: 'Elden Mod Loader',
    mergeMods: true,
  });

  context.registerModType('eldenring-modengine2loader', 25, 
    () => (game) => isEldenRing(game) && isModEngine2LoaderType(),
    () => GAME_BINARY_RELPATH, () => Promise.resolve(false), {
    name: 'Elden Mod Loader',
    mergeMods: true,
  });

  context.registerInstaller('eldenring-modengine2mod', 25, testSupportedModEngine2Content, installModEngine2Content);

  context.registerLoadOrder(eldenRingLoadOrderPage);

  return true;
}

async function isModEngine2LoaderType() {
  try {
    await fs.stat('launchmod_armoredcore6.bat');
    await fs.stat('config_eldenring.toml');
    await fs.stat('launchmod_eldenring.bat');

    return true;
  } catch (error) {
    return false;
  }
}

function isEldenModLoaderType() {
  return fs.statAsync('dinput8.dll')
    .then(() => Promise.resolve(true))
    .catch(() => Promise.resolve(false));
}

function findGame() {
  return util.GameStoreHelper.findByAppId([STEAM_APP_ID])
    .then((game) => game.gamePath);
}

async function prepareForModding(api, discovery) {
  const modPaths = [
    path.join(discovery.path, REGULAR_MODS_RELPATH),
    path.join(discovery.path, MOD_ENGINE_MODS_RELPATH),
  ];
  try {
    await Promise.all(modPaths.map((m) => fs.ensureDirWritableAsync(m)));
    //await download(api, PLUGIN_REQUIREMENTS);
    return Promise.resolve();
  } catch (err) {
    log('error', 'Failed to prepare for modding', err);
    return Promise.reject(err);
  }
}

module.exports = {
  default: main,
};
