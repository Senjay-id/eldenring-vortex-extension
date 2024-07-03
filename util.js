const { fs, util, types, selectors } = require('vortex-api');
const turbowalk = require('turbowalk').default;
const path = require('path');
const { GAME_ID } = require('./common');

async function purge(api) {
  return new Promise((resolve, reject) =>
    api.events.emit('purge-mods', true, (err) => (err ? reject(err) : resolve()))
  );
}

async function deploy(api) {
  return new Promise((resolve, reject) =>
    api.events.emit('deploy-mods', (err) => (err ? reject(err) : resolve()))
  );
}

async function walkPath(dirPath, walkOptions) {
  walkOptions = walkOptions || { skipLinks: true, skipHidden: true, skipInaccessible: true };
  // We REALLY don't care for hidden or inaccessible files.
  walkOptions = { ...walkOptions, skipHidden: true, skipInaccessible: true, skipLinks: true };
  const walkResults = [];
  return new Promise(async (resolve, reject) => {
    await turbowalk(dirPath, (entries) => {
      walkResults.push(...entries);
      return Promise.resolve();
      // If the directory is missing when we try to walk it; it's most probably down to a collection being
      //  in the process of being installed/removed. We can safely ignore this.
    }, walkOptions).catch((err) =>
      err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err)
    );
    return resolve(walkResults);
  });
}

async function getExtensionVersion() {
  const infoFile = JSON.parse(await fs.readFileAsync(path.join(__dirname, 'info.json')));
  return infoFile.version;
}

function getModsOfType(api, modType = '') {
  const state = api.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  return Object.values(mods).filter((mod) => mod.type === modType);
}

async function findModByFile(api, modType, fileName) {
  const mods = getModsOfType(api);
  const installationPath = selectors.installPathForGame(api.getState(), GAME_ID);
  for (const mod of mods) {
    const modPath = path.join(installationPath, mod.installationPath);
    const files = await walkPath(modPath, undefined);
    if (files.find((file) => file.filePath.endsWith(fileName))) {
      return mod;
    }
  }
  return undefined;
}

function forceRefresh(api) {
  const state = api.getState();
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  const action = {
    type: 'SET_FB_FORCE_UPDATE',
    payload: {
      profileId,
    },
  };
  api?.store?.dispatch(action);
}

module.exports = {
  purge,
  deploy,
  walkPath,
  getExtensionVersion,
  getModsOfType,
  findModByFile,
  forceRefresh,
};