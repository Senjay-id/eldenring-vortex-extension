/* eslint-disable */
import path from 'path';
import { types } from 'vortex-api';
import { IPluginRequirement } from './types';
import { findModByFile, findDownloadIdByFile } from './util';

export const TOP_LEVEL_MOD_FILES = [
  'eboot.bin', 'eboot.elf', 'regulation.bin', 'sce_discmap.plt', 'sce_discmap_patch.plt',
];
export const TOP_LEVEL_MOD_FOLDERS = [
  'action', 'asset', 'chr', 'cutscene', 'event', 'expression',
  'facegen', 'font', 'map', 'material', 'menu', 'movie', 'msg',
  'mtd', 'other', 'param', 'parts', 'sce_sys', 'script', 'sfx',
  'shader', 'sound', 'sd',
];

//#region general
export const GAME_ID = 'eldenring';
export const STEAM_APP_ID = '1245620';
export const MODENGINE2_DIR = 'modengine2'; //temporary in the future we should set this path to get the top level directory of the ModEngine2 Loader
export const MODENGINE2_CONFIG = path.join(MODENGINE2_DIR, 'config_eldenring.toml');
export const MODENGINE2_ELDEN_RING_SCRIPT = 'launchmod_eldenring.bat';
export const MODENGINE2_LOAD_ORDER_FILE = 'config_eldenring.toml';
export const MODLOADER_FILE = 'dinput8.dll';

export const GAME_NATIVE_DLLS = [
  'amd_ags_x64.dll',
  'bink2w64.dll',
  'eossdk-win64-shipping.dll',
  'oo2core_6_win64.dll',
  'steam_api64.dll'
];

export const TOOL_ID_SEAMLESS_COOP = 'seamlesscoop';
export const TOOL_ID_MODENGINE2 = 'modengine2';
//#endregion

//#region mod attributes
export const MOD_ATT_ELDEN_RING_GENERATE_EXTENSION = 'eldenGenerateExtension';
export const MOD_ATT_ELDEN_RING_NAME = 'eldenModName';
export const MOD_ATT_ELDEN_RING_DLLS = 'eldenModDlls';
//#endregion

//#region NotificationIds
export const NOTIF_ID_REQUIREMENTS = 'vortex-downloader-requirements-download-notification';
//#endregion

//#region relative modPaths
export const REGULAR_MODS_RELPATH = path.join('game', 'mods');
export const MOD_ENGINE_MODS_RELPATH = path.join('game', MODENGINE2_DIR, 'mod');
export const GAME_BINARY_RELPATH = 'game';
//#endregion

//#region modTypes
export const MOD_ENGINE2_MODTYPE = 'eldenring-modengine2-modtype';
export const MOD_LOADERS_MODTYPE = 'eldenring-eldenmodloaders-modtype';
export const SEAMLESS_COOP_MODTYPE = 'eldenring-seamlesscoop-modtype';
//#endregion

//#region 
export const PLUGIN_REQUIREMENTS: IPluginRequirement[] = [
  {
    archiveFileName: 'ModEngine-2.1.0.0-win64.zip',
    modType: MOD_LOADERS_MODTYPE,
    userFacingName: 'ModEngine2',
    githubUrl: 'https://api.github.com/repos/soulsmods/ModEngine2',
    fileArchivePattern: new RegExp(/ModEngine-/),
    findMod: (api: types.IExtensionApi) => findModByFile(api, MOD_LOADERS_MODTYPE, MODENGINE2_ELDEN_RING_SCRIPT),
    findDownloadId: (api: types.IExtensionApi) => findDownloadIdByFile(api, MODENGINE2_ELDEN_RING_SCRIPT),
  },
];
//#endregion