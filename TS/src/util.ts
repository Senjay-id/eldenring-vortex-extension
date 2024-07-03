import { fs, util, types, selectors } from 'vortex-api';
import turbowalk, { IEntry, IWalkOptions } from 'turbowalk';
import path from 'path';
import { GAME_ID } from './common';

export async function purge(api: types.IExtensionApi): Promise<void> {
  return new Promise((resolve, reject) =>
    api.events.emit('purge-mods', true, (err) => (err ? reject(err) : resolve()))
  );
}

export async function deploy(api: types.IExtensionApi): Promise<void> {
  return new Promise((resolve, reject) =>
    api.events.emit('deploy-mods', (err) => (err ? reject(err) : resolve()))
  );
}

export async function walkPath(dirPath: string, walkOptions?: IWalkOptions): Promise<IEntry[]> {
  walkOptions = walkOptions || { skipLinks: true, skipHidden: true, skipInaccessible: true };
  // We REALLY don't care for hidden or inaccessible files.
  walkOptions = { ...walkOptions, skipHidden: true, skipInaccessible: true, skipLinks: true };
  const walkResults: IEntry[] = [];
  return new Promise(async (resolve, reject) => {
    await turbowalk(dirPath, (entries: IEntry[]) => {
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

export async function getExtensionVersion() {
  const infoFile = JSON.parse(await fs.readFileAsync(path.join(__dirname, 'info.json')));
  return infoFile.version;
}

export function getModsOfType(api, modType = '') {
  const state = api.getState();
  const mods: { [modId: string]: types.IMod } = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  return Object.values(mods).filter((mod) => mod.type === modType);
}

export async function findModByFile(api, modType, fileName) {
  const mods = getModsOfType(api);
  const installationPath = selectors.installPathForGame(api.getState(), GAME_ID);
  for (const mod of mods) {
    const modPath = path.join(installationPath, mod.installationPath);
    const files: IEntry[] = await walkPath(modPath, undefined);
    if (files.find((file) => file.filePath.endsWith(fileName))) {
      return mod;
    }
  }
  return undefined;
}

export function forceRefresh(api) {
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
