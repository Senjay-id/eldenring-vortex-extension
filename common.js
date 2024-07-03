const path = require('path');

exports.GAME_ID = 'eldenring';
exports.STEAM_APP_ID = '1245620';
exports.MODENGINE2_DIR = 'ModEngine-2.1.0.0-win64'; //temporary in the future we should set this path to get the top level directory of the ModEngine2 Loader
exports.MODENGINE2_CONFIG = path.join(exports.MODENGINE2_DIR, 'config_eldenring.toml');
exports.MODENGINE2_ELDEN_RING_SCRIPT = 'launchmod_eldenring.bat';

//#region NotificationIds
exports.INSTALLING_REQUIREMENTS_NOTIFICATION_ID = 'elden-ring-installing-requirements';
//#endregion

//#region relative modPaths
exports.REGULAR_MODS_RELPATH = path.join('game', 'mods');
exports.MOD_ENGINE_MODS_RELPATH = path.join('game', exports.MODENGINE2_DIR, 'mod');
//#endregion
