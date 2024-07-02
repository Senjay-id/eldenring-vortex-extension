const Promise = require('bluebird');
const path = require('path');
const { fs, log, util } = require('vortex-api');
const winapi = require('winapi-bindings');

const GAME_ID = 'eldenring';
const STEAM_APP_ID = '1245620';
const MODENGINE2_DIR = 'ModEngine-2.1.0.0-win64'; //temporary in the future we should set this path to get the top level directory of the ModEngine2 Loader
const MODENGINE2_CONFIG = path.join(MODENGINE2_DIR, 'config_eldenring.toml');

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Elden Ring',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'game',
    logo: 'gameart.jpg', //Couldn't find any elden ring png art
    executable: () => 'game/eldenring.exe',
    requiredFiles: [
      'game/eldenring.exe',
    ],
    setup: prepareForModding,
    environment: {
      SteamAPPId: STEAM_APP_ID,
    },
    details: {
      steamAppId: STEAM_APP_ID,
      stopPatterns: ['(^|/)mods(/|$)'], //Elden Mod Loader pattern not to be confused with ModEngine2
    },
  });

  context.registerInstaller('eldenring-modengine2mod', 25, testSupportedModEngine2Content, installModEngine2Content);

  return true;
}

function testSupportedModEngine2Content(files, gameId) {
  let supported = (gameId === GAME_ID) &&
    (files.findIndex(file => file.toLowerCase().includes('launchmod_armoredcore6.bat')) === -1) &&
    ((files.find(file => path.extname(file).toLowerCase() === '.bin') !== undefined) ||
      (files.find(file => path.extname(file).toLowerCase() === '.dcx') !== undefined));

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

//Haven't really tested this much, needs a review
function installModEngine2Content(files) {
  const destination = path.join(MODENGINE2_DIR, 'mod');
  const instructions = files.reduce((accum, iter) => {
    const isDirectory = iter.endsWith(path.sep) || !path.extname(iter);

    const relPath = path.relative('', iter);

    const fullDest = path.join(destination, relPath);

    if (isDirectory) {
      accum.push({
        type: 'createDirectory',
        path: fullDest,
      });
    } else {
      accum.push({
        type: 'copy',
        source: iter,
        destination: fullDest,
      });
    }

    return accum;
  }, []);

  return Promise.resolve({ instructions });
}

function testSupportedOverhaulContent(files, gameId) {
  let supported = (gameId === GAME_ID) &&
    (files.findIndex(file => file.toLowerCase().includes('launchmod_armoredcore6.bat')) === -1) &&
    (files.findIndex(file => file.toLowerCase().includes('config_eldenring.toml')) !== -1) &&
    (files.findIndex(file => file.toLowerCase().includes('launchmod_eldenring.bat')) !== -1);

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

let tools = [
  {
    id: 'seamlesscoop',
    name: 'Seamless Co-op',
    logo: 'icon/ersc.png',
    executable: () => 'Game/ersc_launcher.exe',
    requiredFiles: [
      'Game/ersc_launcher.exe',
    ],
    relative: true,
  },
  {
    id: 'modengine2',
    name: 'ModEngine 2',
    logo: 'icon/modengine2.png',
    executable: () => path.join(MODENGINE2_DIR, 'launchmod_eldenring.bat'),//dont forget to tweak this
    requiredFiles: [
      path.join(MODENGINE2_DIR, 'launchmod_eldenring.bat'),// this too
    ],
    shell: true,
    relative: false, //The tool can be installed anywhere and doesn't need to be on the game directory
  }
];

function findGame() {
  return util.steam.findByAppId([STEAM_APP_ID])
    .then(game => game.gamePath)
    .catch(() => {
      // Try finding the game from registery
      const instPath = winapi.RegGetValue('HKEY_LOCAL_MACHINE',
        'SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ELDEN RING_is1',
        'InstallLocation');
      if (!instPath) throw new Error('empty registry key');
      return Promise.resolve(instPath.value);
    });
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'game', 'mods')) &&          //Elden Mod Loader mods directory
    fs.ensureDirWritableAsync(path.join(discovery.path, 'game', MODENGINE2_DIR, 'mod'));  //ModEngine2 mod directory
}

module.exports = {
  default: main,
};
