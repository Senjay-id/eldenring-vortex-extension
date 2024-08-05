/* eslint-disable */
import { fs, log, util, types, selectors } from 'vortex-api';
import turbowalk, { IEntry, IWalkOptions } from 'turbowalk';
import path from 'path';
import semver from 'semver';
import TOML from '@iarna/toml';
import { GAME_ID, GAME_NATIVE_DLLS, MOD_ATT_ELDEN_RING_NAME, MOD_ENGINE2_MODTYPE, MOD_LOADERS_MODTYPE, MODENGINE2_LOAD_ORDER_FILE, PLUGIN_REQUIREMENTS } from './common';

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

import { IModEngine2TOML, IModEngine2TOMLEntry, IPluginRequirement } from './types';

const modsFilterFunc = (modType?: string) => (mod: types.IMod) => modType !== undefined
  ? mod.type === modType || mod.type === ''
  : true;
export function getMods(api: types.IExtensionApi, modType?: string): types.IMod[] {
  const state = api.getState();
  const filterFunc = modsFilterFunc(modType);
  const gameId = selectors.activeGameId(state);
  const mods = util.getSafe(state, ['persistent', 'mods', gameId], {});
  return Object.values(mods).filter(filterFunc) as types.IMod[];
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
    await fs.copyAsync(tomlFile.filePath, expectedLOPath);
  }
}

export const resetLOFile = async (api: types.IExtensionApi) => {
  const state = api.getState();
  const modPath = selectors.modPathsForGame(state, GAME_ID)[MOD_LOADERS_MODTYPE];
  const expectedLOPath = path.join(modPath, MODENGINE2_LOAD_ORDER_FILE);
  await fs.removeAsync(expectedLOPath);
}

export const readLOFile = async (api: types.IExtensionApi): Promise<types.ILoadOrderEntry[]> => {
  const state = api.getState();
  const modPath = selectors.modPathsForGame(state, GAME_ID)[MOD_LOADERS_MODTYPE];
  const expectedLOPath = path.join(modPath, MODENGINE2_LOAD_ORDER_FILE);
  await ensureLOFile(api);
  const data = await fs.readFileAsync(expectedLOPath);
  const parsed: any = await TOML.parse.async(data);
  return Promise.all(parsed.extension.mod_loader.mods.map(entry => TOMLEntryToLOEntry(api, entry)));
}

export const writeLOFile = async (api: types.IExtensionApi, entries: types.ILoadOrderEntry[]): Promise<void> => {
  const state = api.getState();
  await resetLOFile(api);
  const modPath = path.join(selectors.modPathsForGame(state, GAME_ID)[MOD_ENGINE2_MODTYPE]);
  const expectedLOPath = path.join(modPath, MODENGINE2_LOAD_ORDER_FILE);
  await ensureLOFile(api);
  const data = await fs.readFileAsync(expectedLOPath);
  const parsed = await TOML.parse.async(data);
  const fileEntries: IEntry[] = await walkPath(path.join(modPath, 'mods'));
  const external_dlls = fileEntries.filter(file => file.filePath.endsWith('.dll') && !GAME_NATIVE_DLLS.includes(path.basename(file.filePath).toLowerCase()));
  const mods = entries.map(entry => ({
    enabled: entry.enabled,
    name: entry.name,
    path: path.join('mod', entry.name),
  }))
  parsed.modengine['external_dlls'] = external_dlls;
  parsed.modengine['debug'] = true;
  parsed.extension['mod_loader']['mods'] = mods;

  const tomlData = TOML.stringify(parsed);
  await fs.writeFileAsync(expectedLOPath, tomlData);
}
