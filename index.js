const Promise = require('bluebird');
const path = require('path');
const { fs, log, util } = require('vortex-api');
const winapi = require('winapi-bindings');

const GAME_ID = 'eldenring';
const GAME_NAME = 'Elden Ring';
const GAME_EXE = 'eldenring.exe';
const STEAM_APP_ID = '1245620';
const TOP_DIR = 'game';
const EXEC_PATH = path.join(TOP_DIR, GAME_EXE);

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: GAME_NAME,
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'game',
    logo: 'gameart.jpg', //Couldn't find any elden ring png art
    executable: () => EXEC_PATH,
    requiredFiles: [
      EXEC_PATH,
    ],
    setup: prepareForModding,
    environment: {
      SteamAPPId: STEAM_APP_ID,
    },
    details: {
      steamAppId: STEAM_APP_ID,
      stopPatterns: ['(^|/)mods(/|$)'], //Elden Mod Loader pattern because apparently ModEngine2 Content can also contain dll files
    },
  });

  //context.registerInstaller('eldenring-modengine2mod', 25, testSupportedModEngine2Content, installModEngine2Content);

  return true;
}

function testSupportedModEngine2Content(files, gameId) {
  let supported = (gameId === GAME_ID) &&
    //bin and dcx file extension are specific to ModEngine2 Content
    (files.find(file => path.extname(file).toLowerCase() === '.bin') !== undefined) ||
    (files.find(file => path.extname(file).toLowerCase() === '.dcx') !== undefined);

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installModEngine2Content(files) {
  const destination = path.join('mod');
  const instructions = files.reduce((accum, iter) => {
    if (path.extname(path.basename(iter))) {
      // This is a folder, we need to copy it because each ModEngine2 mods are in separate folder
      return accum;
    }

    const relPath = path.basename(iter);
    const fullDest = path.join(destination, relPath);

    accum.push({
      type: 'copy',
      source: iter,
      destination: fullDest, //Copies to Elden Ring\Game\mod
    });

    return accum;
  }, []);

  return Promise.resolve({ instructions });
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
    executable: () => 'launchmod_eldenring.bat',
    requiredFiles: [
      'launchmod_eldenring.bat',
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
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'game', 'mods')); //Elden Mod Loader mods directory
}

module.exports = {
  default: main,
};
