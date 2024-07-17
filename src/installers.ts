/* eslint-disable */
import path from 'path';
import { GAME_ID, MOD_ATT_ELDEN_RING_DLLS, MOD_ATT_ELDEN_RING_NAME, MOD_ENGINE2_MODTYPE, MOD_LOADERS_MODTYPE, MODENGINE2_DIR, MODENGINE2_LOAD_ORDER_FILE, MODLOADER_FILE, PLUGIN_REQUIREMENTS, SEAMLESS_COOP_MODTYPE } from './common';
import { selectors, types } from 'vortex-api';
import { walkPath } from './util';
import { restackErr } from 'vortex-api/lib/util/util';

//#region ModEngine2
export async function installModEngine2Mod(api: types.IExtensionApi, files: string[], destinationPath: string) {
  const modengine2Mod = await PLUGIN_REQUIREMENTS[0].findMod(api);
  if (!modengine2Mod) {
    const missingInstr: types.IInstruction = {
      type: 'error',
      value: 'ModEngine 2 mod loader is missing.',
    }
    return Promise.resolve({ instructions: [missingInstr] });
  }
  const modTypeInstr: types.IInstruction = {
    type: 'setmodtype',
    value: MOD_ENGINE2_MODTYPE,
  }
  const installPath = selectors.installPathForGame(api.getState(), GAME_ID);
  const modEngineFiles = await walkPath(path.join(installPath, modengine2Mod.installationPath));
  const filtered = files.filter(f => !!path.extname(path.basename(f)) && !modEngineFiles.map(mef => path.basename(mef.filePath)).includes(path.basename(f)));
  const dlls = filtered.filter(f => path.extname(f) === '.dll');
  const modName: types.IInstruction = {
    type: 'attribute',
    key: MOD_ATT_ELDEN_RING_NAME,
    value: path.basename(destinationPath, '.installing'),
  };
  const dllAttrib: types.IInstruction = {
    type: 'attribute',
    key: MOD_ATT_ELDEN_RING_DLLS,
    value: dlls.map(f => path.basename(f)),
  };
  const instructions = filtered.reduce((accum, iter) => {
    let destination = path.join('mod', modName.value);
    let fullDest;
    if (path.basename(iter) === 'regulation.bin') {
      destination = 'mod';
    }
    if (path.extname(iter) === '.dll' || path.extname(iter) === '.ini') {
      fullDest = path.basename(iter);
    } else {
      let segments = iter.split(path.sep);
      const modIdx = segments.map(seg => seg.toLowerCase()).indexOf('mod');
      if (modIdx !== -1) {
        segments = segments.slice(modIdx + 1);
        fullDest = path.join(destination, segments.join(path.sep));
      } else {
        fullDest = path.join(destination, iter);
      }
    }
    accum.push({
      type: 'copy',
      source: iter,
      destination: fullDest,
    });
    return accum;
  }, [dllAttrib, modTypeInstr, modName]);

  return Promise.resolve({ instructions });
}

export const testSupportedModEngine2Content = (api: types.IExtensionApi, files: string[]) => {
  const gameId = selectors.activeGameId(api.getState())
  const supported = (gameId === GAME_ID) && ['dds', '.blend', '.dll', '.bin', '.dcx'].some(ext => files.some(file => path.extname(file).toLowerCase() === ext));

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}
//#endregion

//#region dllmods

export async function installModEngine2DllMod(api: types.IExtensionApi, files: string[], destinationPath: string) {
  const modengine2Mod = await PLUGIN_REQUIREMENTS[0].findMod(api);
  if (!modengine2Mod) {
    const missingInstr: types.IInstruction = {
      type: 'error',
      value: 'ModEngine 2 mod loader is missing.',
    }
    return Promise.resolve({ instructions: [missingInstr] });
  }
  const modTypeInstr: types.IInstruction = {
    type: 'setmodtype',
    value: MOD_ENGINE2_MODTYPE,
  }
  const installPath = selectors.installPathForGame(api.getState(), GAME_ID);
  const modEngineFiles = await walkPath(path.join(installPath, modengine2Mod.installationPath));
  const filtered = files.filter(f => !!path.extname(path.basename(f)) && !modEngineFiles.map(mef => path.basename(mef.filePath)).includes(path.basename(f)));
  const dlls = filtered.filter(f => path.extname(f) === '.dll');
  const dllAttrib: types.IInstruction = {
    type: 'attribute',
    key: MOD_ATT_ELDEN_RING_DLLS,
    value: dlls.map(f => path.basename(f)),
  };
}
export const testSupportedDllMod = (api: types.IExtensionApi, files: string[]) => {
  const gameId = selectors.activeGameId(api.getState())
  const supported = (gameId === GAME_ID) && ['.dll'].some(ext => files.some(file => path.extname(file).toLowerCase() === ext));
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}
//#endregion

//#region ModEngine2Loader
export const testModLoader = (files: string[], gameId: string): Promise<types.ISupportedResult> => {
  const modLoaderFiles = [
    'launchmod_armoredcore6.bat',
    'config_eldenring.toml',
    'launchmod_eldenring.bat',
    MODENGINE2_LOAD_ORDER_FILE,
    MODLOADER_FILE,
  ];
  const supported = GAME_ID === gameId && files.some(file => modLoaderFiles.includes(path.basename(file)));
  const result: types.ISupportedResult = {
    supported,
    requiredFiles: [],
  }
  return Promise.resolve(result) as any;
}

export function installModLoader(files: string[]) {
  const modTypeInstr: types.IInstruction = {
    type: 'setmodtype',
    value: MOD_LOADERS_MODTYPE,
  };
  const isLOFile = file => path.basename(file) === MODENGINE2_LOAD_ORDER_FILE;
  const loFile = files.find(isLOFile);
  // save as template
  const loFileInstr = {
    type: 'copy',
    source: loFile,
    destination: `${path.basename(loFile)}.bak`,
  }

  const noDirs = file => path.extname(path.basename(file)) !== '';
  const filter = file => noDirs(file) && !isLOFile(file);
  const filtered = files.filter(filter);
    const instructions = filtered.reduce((accum, iter) => {
      const segments = iter.split(path.sep);
      segments.shift();
      const destination = segments.join(path.sep);
      accum.push({
        type: 'copy',
        source: iter,
        destination,
      });
      return accum;
    }, [modTypeInstr, loFileInstr]);
    return Promise.resolve({ instructions });
}
//#endregion

//#region Seamlesscoop
export const testSeamlessCoop = (files: string[], gameId: string): Promise<types.ISupportedResult> => {
  const supported = GAME_ID === gameId && files.some(file => path.basename(file) === 'ersc_launcher.exe');
  
  const result: types.ISupportedResult = {
    supported,
    requiredFiles: [],
  };
  
  return Promise.resolve(result) as any;
}

export function installSeamlessCoop(files: string[]) {
  const modTypeInstr: types.IInstruction = {
  type: 'setmodtype',
  value: SEAMLESS_COOP_MODTYPE,
  };
  const instructions = files.reduce((accum, iter) => {
    const isDirectory = iter.endsWith(path.sep) || !path.extname(iter);
    const relPath = path.relative('', iter);
    
    if (isDirectory) {
    accum.push({
        type: 'createDirectory',
        path: relPath,
    });
    } else {
        accum.push({
            type: 'copy',
            source: iter,
            destination: relPath,
        });
    }
    return accum;
  }, [modTypeInstr]);

    return Promise.resolve({ instructions });
}
//#endregion

//#region ModLoader
//#endregion
