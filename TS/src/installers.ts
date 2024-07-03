const path = require('path');
const { GAME_ID, MODENGINE2_DIR } = require('./common');

//#region ModEngine2
export function installModEngine2Content(files) {
  const destination = path.join(MODENGINE2_DIR, 'mod');
  const instructions = files.reduce((accum, iter) => {
    const isDirectory = iter.endsWith(path.sep) || !path.extname(iter);

    const relPath = path.relative('', iter);

    const fullDest = path.join(destination, relPath);

    if (isDirectory) {
      accum.push({
        type: 'createDirectory',
        path: fullDest,
      });
    } else {
      accum.push({
        type: 'copy',
        source: iter,
        destination: fullDest,
      });
    }

    return accum;
  }, []);

  return Promise.resolve({ instructions });
}

export function testSupportedModEngine2Content(files, gameId) {
  let supported = (gameId === GAME_ID) &&
    (files.findIndex(file => file.toLowerCase().includes('launchmod_armoredcore6.bat')) === -1) &&
    ((files.find(file => path.extname(file).toLowerCase() === '.bin') !== undefined) ||
      (files.find(file => path.extname(file).toLowerCase() === '.dcx') !== undefined));

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}
//#endregion

//#region Overhaul
export function testSupportedOverhaulContent(files, gameId) {
  let supported = (gameId === GAME_ID) &&
    (files.findIndex(file => file.toLowerCase().includes('launchmod_armoredcore6.bat')) === -1) &&
    (files.findIndex(file => file.toLowerCase().includes('config_eldenring.toml')) !== -1) &&
    (files.findIndex(file => file.toLowerCase().includes('launchmod_eldenring.bat')) !== -1);

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}
//#endregion
