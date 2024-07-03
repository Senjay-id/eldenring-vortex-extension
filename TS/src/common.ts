import path from 'path';

export const GAME_ID = 'eldenring';
export const STEAM_APP_ID = '1245620';
export const MODENGINE2_DIR = 'ModEngine-2.1.0.0-win64'; //temporary in the future we should set this path to get the top level directory of the ModEngine2 Loader
export const MODENGINE2_CONFIG = path.join(MODENGINE2_DIR, 'config_eldenring.toml');
export const MODENGINE2_ELDEN_RING_SCRIPT = 'launchmod_eldenring.bat';

//#region NotificationIds
export const INSTALLING_REQUIREMENTS_NOTIFICATION_ID = 'elden-ring-installing-requirements';
//#endregion

//#region relative modPaths
export const REGULAR_MODS_RELPATH = path.join('game', 'mods');
export const MOD_ENGINE_MODS_RELPATH = path.join('game', MODENGINE2_DIR, 'mod');
//#endregion