/* eslint-disable */
import path from 'path';
import {
  GAME_ID, MOD_ATT_ELDEN_RING_DLLS, MOD_ATT_ELDEN_RING_GENERATE_EXTENSION,
  MOD_ATT_ELDEN_RING_NAME, MOD_ENGINE2_MODTYPE, MOD_LOADERS_MODTYPE,
  MODENGINE2_LOAD_ORDER_FILE, MODLOADER_FILE, PLUGIN_REQUIREMENTS, SEAMLESS_COOP_MODTYPE,
  TOP_LEVEL_MOD_FILES
} from './common';
import { selectors, types, util } from 'vortex-api';
import { walkPath } from './util';
import { toValidRelPath } from './stopPatterns';

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
  const dlls = filtered.filter(f => ['.dll', '.ini'].includes(path.extname(f)));
  const otherFiles = filtered.filter(f => !['.dll', '.ini'].includes(path.extname(f)));
  const dllInstructions: types.IInstruction[] = (await installModEngine2DllMod(api, dlls, destinationPath)).instructions;
  const modName: types.IInstruction = {
    type: 'attribute',
    key: MOD_ATT_ELDEN_RING_NAME,
    value: path.basename(destinationPath, '.installing'),
  };
  const instructions = otherFiles.reduce((accum, iter) => {
    let destination = path.join('mod', modName.value);
    let fullDest;
    if (TOP_LEVEL_MOD_FILES.includes(path.basename(iter).toLowerCase())) {
      destination = 'mod';
    }
    fullDest = path.join(destination, toValidRelPath(iter));
    if (!accum.some(instr => instr.type === 'attribute' && instr.key === MOD_ATT_ELDEN_RING_GENERATE_EXTENSION)) {
      accum.push({
        type: 'attribute',
        key: MOD_ATT_ELDEN_RING_GENERATE_EXTENSION,
        value: true,
      });
    }
    accum.push({
      type: 'copy',
      source: iter,
      destination: fullDest,
    });
    return accum;
  }, [...dllInstructions, modTypeInstr, modName]);

  return Promise.resolve({ instructions });
}

export const testSupportedModEngine2Content = (api: types.IExtensionApi, files: string[], gameId: string) => {
  const supported = (gameId === GAME_ID) && ['dds', '.blend', '.dll', '.bin', '.dcx'].some(ext => files.some(file => path.extname(file).toLowerCase() === ext));
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}
//#endregion

//#region dllmods

export async function installModEngine2DllMod(api: types.IExtensionApi, files: string[], destinationPath: string) {
  if (!files || files.length === 0) {
    return Promise.resolve({ instructions: [] });
  }
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
  const filtered = files.filter(f => !!path.extname(path.basename(f)));
  const dlls: string[] = filtered.filter(f => path.extname(f) === '.dll');
  const segments = dlls[0].split(path.sep);
  const idx = segments.findIndex(seg => path.extname(seg.toLowerCase()) === '.dll');
  const dllAttrib: types.IInstruction = {
    type: 'attribute',
    key: MOD_ATT_ELDEN_RING_DLLS,
    value: dlls.map(f => path.basename(f)),
  };
  const instructions = filtered.reduce((accum, iter) => {
    const segments = iter.split(path.sep);
    const destination = path.join('mods', segments.slice(idx).join(path.sep));
    accum.push({
      type: 'copy',
      source: iter,
      destination,
    });
    return accum;
  }, [dllAttrib, modTypeInstr]);
  return Promise.resolve({ instructions });
}
export const testSupportedDllMod = (files: string[], gameId: string) => {
  const hasDlls = files.some(file => path.extname(file) === '.dll');
  const hasOtherFileTypes = ['.ini', '.dll', '.txt'].some(ext => files.some(file => path.extname(file).toLowerCase() !== ext));
  // Dlls, ini's and .txt only.
  const supported = (gameId === GAME_ID) && hasDlls && !hasOtherFileTypes;
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}
//#endregion

//#region ModEngine2Loader
export const testModLoader = (files: string[], gameId: string): Promise<types.ISupportedResult> => {
  const modLoaderFiles = [
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
    if (isDirectory) {
      // Directories are created automatically when file instructions
      //  are created. No need to do anything here.
      return accum;
    }
    accum.push({
      type: 'copy',
      source: iter,
      destination: iter, // <- this is already in relPath form.
    });
    return accum;
  }, [modTypeInstr]);

    return Promise.resolve({ instructions });
}
//#endregion

//#region Executable installer
export const testSupportedExecutable = (api: types.IExtensionApi, files: string[], gameId: string): Promise<types.ISupportedResult> => {
  const supported = GAME_ID === gameId && files.some(file => path.extname(file) === '.exe');
  const result: types.ISupportedResult = {
    supported,
    requiredFiles: [],
  };
  return Promise.resolve(result);
}

export const installExecutable = async (api: types.IExtensionApi, files: string[], destinationPath: string) => {
  const modTypeInstr: types.IInstruction = {
    type: 'setmodtype',
    value: MOD_LOADERS_MODTYPE,
  };

  const res = await api.showDialog('info', 'Executable Installer', {
    message: 'This mod contains an executable which suggests that you should run the mod outside of Vortex. '
      + 'Vortex can still download the file for you if you wish, but it will probably not be able to run it. '
      + 'Are you sure you wish to install this mod through Vortex?'
  }, [
    { label: 'Cancel' },
    { label: 'Continue' }
  ]);
  if (res.action === 'Cancel') {
    throw new util.UserCanceled();
  }

  const instructions = files.reduce((accum, iter) => {
    const isDirectory = iter.endsWith(path.sep) || !path.extname(iter);
    if (!isDirectory) {
      accum.push({
        type: 'copy',
        source: iter,
        destination: iter,
      });
    }
    return accum;
  }, [modTypeInstr]);
  return { instructions };
}
//#endregion
