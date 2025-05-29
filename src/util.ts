/* eslint-disable */
import { fs, log, util, types, selectors } from 'vortex-api';
import turbowalk, { IEntry, IWalkOptions } from 'turbowalk';
import path from 'path';
import semver from 'semver';
import TOML, { JsonMap } from '@iarna/toml';
import {
  GAME_ID, GAME_NATIVE_DLLS, MOD_ATT_ELDEN_RING_DLLS, MOD_ATT_ELDEN_RING_NAME, MOD_ENGINE2_MODTYPE,
  MOD_LOADERS_MODTYPE, MODENGINE2_LOAD_ORDER_FILE, PLUGIN_REQUIREMENTS
} from './common';
import { IModEngine2TOML, IModEngine2TOMLEntry, IModLookupInfo, IPluginRequirement } from './types';
import { currentGameMods, currentGameModsOfType, enabledMods } from './selectors';

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

export async function getExtensionVersion() {
  const infoFile = JSON.parse(await fs.readFileAsync(path.join(__dirname, 'info.json')));
  return infoFile.version;
}

export function getModsOfType(api, modType = '') {
  const state = api.getState();
  const mods: { [modId: string]: types.IMod } = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  return Object.values(mods).filter((mod) => mod.type === modType);
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

export function getMods(api: types.IExtensionApi, modType?: string): types.IMod[] {  
  return modType
    ? Object.values(currentGameModsOfType(api.getState(), modType))
    : Object.values(currentGameMods(api.getState()));
}

export async function findModByFile(api: types.IExtensionApi, modType: string, fileName: string): Promise<types.IMod> {
  const state = api.getState();
  const gameId = selectors.activeGameId(state);
  const mods = getMods(api, modType);
  const installationPath = selectors.installPathForGame(api.getState(), gameId);
  for (const mod of mods) {
    const modPath = path.join(installationPath, mod.installationPath);
    const files = await walkPath(modPath);
    if (files.find(file => file.filePath.endsWith(fileName))) {
      return mod;
    }
  }
  return undefined;
}

const getNameAttribute = (mod: types.IMod): string => (Object.keys(mod.attributes || {})).find(key => mod.attributes[key] === MOD_ATT_ELDEN_RING_NAME);
export async function findModByLOName(api: types.IExtensionApi, modName: string): Promise<types.IMod> {
  const mods = getMods(api);

  return mods.find(mod => getNameAttribute(mod) === modName);
}

export function findDownloadIdByFile(api: types.IExtensionApi, fileName: string): string {
  const state = api.getState();
  state.persistent.downloads.files
  const downloads: { [dlId: string]: types.IDownload } = util.getSafe(state, ['persistent', 'downloads', 'files'], {});
  return Object.entries(downloads).reduce((prev, [dlId, dl]) => {
    if (path.basename(dl.localPath).toLowerCase() === fileName.toLowerCase()) {
      prev = dlId;
    }
    return prev;
  }, '');
}

export async function resolveVersionByPattern(api: types.IExtensionApi, requirement: IPluginRequirement): Promise<string> {
  const state = api.getState();
  const files: types.IDownload[] = util.getSafe(state, ['persistent', 'downloads', 'files'], []);
  const latestVersion = Object.values(files).reduce((prev, file) => {
    const match = requirement.fileArchivePattern.exec(file.localPath);
    if (match?.[1] && semver.gt(match[1], prev)) {
      prev = match[1];
    }
    return prev;
  }, '0.0.0');
  return latestVersion;
}

export async function walkPath(dirPath: string, walkOptions?: IWalkOptions): Promise<IEntry[]> {
  walkOptions = !!walkOptions
    ? { ...walkOptions, skipHidden: true, skipInaccessible: true, skipLinks: true }
    : { skipLinks: true, skipHidden: true, skipInaccessible: true };
  const walkResults: IEntry[] = [];
  return new Promise<IEntry[]>(async (resolve, reject) => {
    await turbowalk(dirPath, (entries: IEntry[]) => {
      walkResults.push(...entries);
      return Promise.resolve() as any;
      // If the directory is missing when we try to walk it; it's most probably down to a collection being
      //  in the process of being installed/removed. We can safely ignore this.
    }, walkOptions).catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err));
    return resolve(walkResults);
  });
}

export const fileExists = (filePath: string): Promise<boolean> => {
  return fs.statAsync(filePath).then(() => true).catch(() => false) as any;
}

export const TOMLEntryToLOEntry = async (api: types.IExtensionApi, entry: IModEngine2TOMLEntry): Promise<types.ILoadOrderEntry> => {
  const mod = await findModByLOName(api, entry.name);
  const loEntry: types.ILoadOrderEntry = {
    enabled: entry.enabled,
    name: entry.name,
    id: entry.name,
    modId: mod?.id,
  }
  return loEntry;
}

export const ensureLOFile = async (api: types.IExtensionApi): Promise<void> => {
  const state = api.getState();
  const modPath = selectors.modPathsForGame(state, GAME_ID)[MOD_LOADERS_MODTYPE];
  const expectedLOPath = path.join(modPath, MODENGINE2_LOAD_ORDER_FILE);
  const exists = await fileExists(expectedLOPath);
  if (!exists) {
    const installationPath = selectors.installPathForGame(state, GAME_ID);
    const modEngine2Mod = await PLUGIN_REQUIREMENTS[0].findMod(api);
    if (!modEngine2Mod) {
      log('warn', 'mod engine 2 mod not found', { message: 'make sure you\'ve deployed your mods' });
      return;
    }
    const modEngine2Path = path.join(installationPath, modEngine2Mod.installationPath);
    const files = await walkPath(modEngine2Path);
    const tomlFile = files.find(file => file.filePath.endsWith(MODENGINE2_LOAD_ORDER_FILE + '.bak'));
    return fs.copyAsync(tomlFile.filePath, expectedLOPath);
  }
}

export const resetLOFile = async (api: types.IExtensionApi) => {
  const state = api.getState();
  const modEngine2Mod = await PLUGIN_REQUIREMENTS[0].findMod(api);
  if (!modEngine2Mod) {
    return;
  }
  const installationPath = selectors.installPathForGame(state, GAME_ID);
  const modEngine2Path = path.join(installationPath, modEngine2Mod.installationPath);
  const backupFile = path.join(modEngine2Path, MODENGINE2_LOAD_ORDER_FILE + '.bak');
  const modPath = selectors.modPathsForGame(state, GAME_ID)[MOD_LOADERS_MODTYPE];
  const expectedLOPath = path.join(modPath, MODENGINE2_LOAD_ORDER_FILE);
  try {
    await fs.removeAsync(expectedLOPath);
    // return fs.copyAsync(backupFile, expectedLOPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      return Promise.reject(err);
    }
  }
  return Promise.resolve();
}

export const readLOFile = async (api: types.IExtensionApi): Promise<types.ILoadOrderEntry[]> => {
  const state = api.getState();
  const modPath = selectors.modPathsForGame(state, GAME_ID)[MOD_LOADERS_MODTYPE];
  const expectedLOPath = path.join(modPath, MODENGINE2_LOAD_ORDER_FILE);
  await ensureLOFile(api);
  const data = await fs.readFileAsync(expectedLOPath);
  const parsed: JsonMap = await TOML.parse.async(data);
  if (!parsed.extension['mod_loader'] || !Array.isArray(parsed.extension['mod_loader'].mods)) {
    return [];
  }
  return Promise.all(parsed.extension['mod_loader'].mods.map(entry => TOMLEntryToLOEntry(api, entry)));
}

export const writeLOFile = async (api: types.IExtensionApi, entries: types.ILoadOrderEntry[]): Promise<void> => {
  const state = api.getState();
  const enabled: IModLookupInfo[] = enabledMods(state);
  const externalDllFiles: { targetPath: string, idx: number }[] = enabled.reduce((accum, entry) => {
    if (Array.isArray(entry.eldenModDlls) && entry.eldenModDlls.length > 0) {
      for (const dll of entry.eldenModDlls) {
        accum.push({
          targetPath: path.join('mods', dll),
          idx: entries.findIndex(e => e.modId === entry.id),
        });
      }
    }
    return accum;
  }, []);
  externalDllFiles.sort((a, b) => a.idx - b.idx);
  const modPath = selectors.modPathsForGame(state, GAME_ID)[MOD_ENGINE2_MODTYPE];
  const expectedLOPath = path.join(modPath, MODENGINE2_LOAD_ORDER_FILE);
  await ensureLOFile(api);
  const data = await fs.readFileAsync(expectedLOPath);
  const parsed: JsonMap = await TOML.parse.async(data);
  const mods = entries.reduce((acc, entry) => {
    const mod = enabled.find(m => m.id === entry.modId);
    if (!mod?.eldenGenerateExtension) {
      return acc;
    }
    return acc.concat({
      enabled: entry.enabled,
      name: entry.name,
      path: path.join('mod', mod.eldenModName)
    });
  }, []);
  parsed.modengine['external_dlls'] = externalDllFiles.map(file => file.targetPath);
  if (mods.length > 0) {
    parsed.extension['mod_loader'].mods = mods;
  } else {
    parsed.extension['mod_loader'].mods = [];
  }
  const tomlData = TOML.stringify(parsed);
  return fs.writeFileAsync(expectedLOPath, tomlData);
}
