/* eslint-disable */
import path from 'path'
import { actions, fs, log, types, selectors, util } from 'vortex-api';
import { GAME_ID, STEAM_APP_ID, REGULAR_MODS_RELPATH, MOD_LOADERS_MODTYPE, MOD_ENGINE2_MODTYPE,
  MOD_ENGINE_MODS_RELPATH, PLUGIN_REQUIREMENTS
} from './common';

import { installExecutable, installModEngine2DllMod, installModEngine2Mod, installModLoader,
  installSeamlessCoop, testModLoader, testSeamlessCoop, testSupportedDllMod,
  testSupportedExecutable, testSupportedModEngine2Content
} from './installers';

import { tools } from './tools';

import { download } from './downloader';

import { EldenRingLoadOrderPage } from './loadorder';

function main(context: types.IExtensionContext) {
  context.registerGame({
    id: GAME_ID,
    name: 'Elden Ring',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => '.',
    logo: 'gameart.jpg', //Couldn't find any elden ring png art
    executable: () => 'game/eldenring.exe',
    requiredFiles: [
      'game/eldenring.exe',
    ],
    setup: util.toBlue((discovery) => prepareForModding(context.api, discovery)),
    environment: {
      SteamAPPId: STEAM_APP_ID,
    },
    details: {
      steamAppId: STEAM_APP_ID,
      stopPatterns: ['(^|/)game(/|$)'],
    },
  });

  const isEldenRing = (gameId) => gameId === GAME_ID;

  context.registerModType(MOD_ENGINE2_MODTYPE, 25,
    isEldenRing, () => {
      const discovery = selectors.discoveryByGame(context.api.getState(), GAME_ID);
      return path.join(discovery.path, 'game');
    }, util.toBlue(() => Promise.resolve(false)), {
    name: 'ModEngine 2 Mod',
    mergeMods: true,
  });

  context.registerModType(MOD_LOADERS_MODTYPE, 25,
    isEldenRing,
    () => {
      const discovery = selectors.discoveryByGame(context.api.getState(), GAME_ID);
      return path.join(discovery.path, 'game');
    },
    // The modType is assigned in the installers themselves.
    util.toBlue(() => Promise.resolve(false)), {
    name: 'Elden Mod Loaders',
    mergeMods: true,
  });

  context.registerInstaller('eldenring-seamlesscoop-modtype', 15,
    util.toBlue(testSeamlessCoop),
    util.toBlue(installSeamlessCoop));

  context.registerInstaller('eldenring-mod-loader', 20,
    util.toBlue(testModLoader),
    util.toBlue(installModLoader) as any);

  // This installer is a funky one - it uses the same mod type as the mod engine 2 mods, and it's being used
  //  both as an early detection for dll-only mods, and inside the regular eldenring-modengine2mod installer
  //  to generate dll instructions.
  context.registerInstaller('eldenring-modengine2dllmod', 22,
    util.toBlue(testSupportedDllMod),
    util.toBlue((files, destinationPath) => installModEngine2DllMod(context.api, files, destinationPath)));

  context.registerInstaller('eldenring-modengine2mod', 25,
    util.toBlue((files, gameId) => testSupportedModEngine2Content(context.api, files, gameId)),
    util.toBlue((files, destinationPath) => installModEngine2Mod(context.api, files, destinationPath)));

  // This is a warning installer - it's used to warn the user that the mod contains an executable which will probably have
  //  externally from Vortex.
  context.registerInstaller('eldenring-executable-warning', 100,
    util.toBlue((files, gameId) => testSupportedExecutable(context.api, files, gameId)),
    util.toBlue((files, destinationPath) => installExecutable(context.api, files, destinationPath)));

  context.registerLoadOrder(new EldenRingLoadOrderPage(context.api));

  return true;
}

// async function isModEngine2LoaderType(instruction: types.IInstruction[]) {
//   const modEngine2LoaderFiles = [
//     'launchmod_armoredcore6.bat',
//     'launchmod_eldenring.bat',
//   ];
//   const matches = instruction.filter((inst) => inst.type === 'copy' && modEngine2LoaderFiles.includes(path.basename(inst.source)));
//   return Promise.resolve(matches.length === modEngine2LoaderFiles.length);
// }

function findGame() {
  return util.GameStoreHelper.findByAppId([STEAM_APP_ID])
    .then((game) => game.gamePath);
}

async function prepareForModding(api: types.IExtensionApi, discovery: types.IDiscoveryResult) {
  const modPaths = [
    path.join(discovery.path, REGULAR_MODS_RELPATH),
    path.join(discovery.path, 'game', 'mod'),
    path.join(discovery.path, MOD_ENGINE_MODS_RELPATH),
  ];
  try {
    await util.GameStoreHelper.launchGameStore(api, discovery.store, undefined, true);
    await Promise.all(modPaths.map((m) => fs.ensureDirWritableAsync(m)));
    await download(api, PLUGIN_REQUIREMENTS)
      .then(() => api.store.dispatch(actions.setPrimaryTool(GAME_ID, 'modengine2')));
    return Promise.resolve();
  } catch (err) {
    log('error', 'Failed to prepare for modding', err);
    return Promise.reject(err);
  }
}

module.exports = {
  default: main,
};
