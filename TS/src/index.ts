/* eslint-disable */
import path from 'path'
import { fs, log, types, util } from 'vortex-api';
import { GAME_ID, STEAM_APP_ID, REGULAR_MODS_RELPATH, MOD_ENGINE_MODS_RELPATH, MODENGINE2_ELDEN_RING_SCRIPT } from './common';
import { installModEngine2Content, testSupportedModEngine2Content, testSupportedOverhaulContent } from './installers';
import { tools } from './tools';

import { findModByFile } from './util';
import { download } from './downloader';

import { IGitHubAsset, IPluginRequirement } from './types';
export const PLUGIN_REQUIREMENTS: IPluginRequirement[] = [
  {
    fileName: 'ModEngine-2.1.0.0-win64.zip',
    modType: 'dinput',
    userFacingName: 'ModEngine2',
    githubUrl: 'https://api.github.com/repos/soulsmods/ModEngine2',
    assetMatcher: (asset: IGitHubAsset) => asset.name.match(/ModEngine-/)?.length > 0,
    findMod: (api: types.IExtensionApi) => findModByFile(api, 'dinput', MODENGINE2_ELDEN_RING_SCRIPT),
  },
]

import { eldenRingLoadOrderPage } from './loadorder';

function main(context: types.IExtensionContext) {
  context.registerGame({
    id: GAME_ID,
    name: 'Elden Ring',
    mergeMods: true,
    queryPath: findGame as any,
    supportedTools: tools,
    queryModPath: () => 'game',
    logo: 'gameart.jpg', //Couldn't find any elden ring png art
    executable: () => 'game/eldenring.exe',
    requiredFiles: [
      'game/eldenring.exe',
    ],
    setup: (discovery: types.IDiscoveryResult) => prepareForModding(context.api, discovery) as any,
    environment: {
      SteamAPPId: STEAM_APP_ID,
    },
    details: {
      steamAppId: STEAM_APP_ID,
      stopPatterns: ['(^|/)mods(/|$)'], //Elden Mod Loader pattern not to be confused with ModEngine2
    },
  });

  const isEldenRing = (game) => game.id === GAME_ID;
  context.registerModType('eldenring-modengine2-overhaul-mod', 25, isEldenRing, () => MOD_ENGINE_MODS_RELPATH, () => Promise.resolve(false) as any, {
    name: 'ModEngine 2 Overhaul Mod',
    mergeMods: true,
  });

  context.registerInstaller('eldenring-modengine2mod', 25, testSupportedModEngine2Content as any, installModEngine2Content as any);

  context.registerLoadOrder(eldenRingLoadOrderPage);

  return true;
}

function findGame() {
  return util.GameStoreHelper.findByAppId([STEAM_APP_ID])
    .then(game => game.gamePath)
}

async function prepareForModding(api: types.IExtensionApi, discovery: types.IDiscoveryResult) {
  const modPaths = [
    path.join(discovery.path, REGULAR_MODS_RELPATH),
    path.join(discovery.path, MOD_ENGINE_MODS_RELPATH),
  ];
  try {
    await Promise.all(modPaths.map(m => fs.ensureDirWritableAsync(m)));
    await download(api, PLUGIN_REQUIREMENTS);
    return Promise.resolve();
  } catch (err) {
    log('error', 'Failed to prepare for modding', err);
    return Promise.reject(err);
  }
}

module.exports = {
  default: main,
};
