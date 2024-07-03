const path = require('path');
const { MODENGINE2_DIR, MODENGINE2_ELDEN_RING_SCRIPT } = require('./common');

const tools = [
  {
    id: 'seamlesscoop',
    name: 'Seamless Co-op',
    logo: 'icon/ersc.png',
    executable: () => 'Game/ersc_launcher.exe',
    requiredFiles: [
      'Game/ersc_launcher.exe',
    ],
    relative: true,
  },
  {
    id: 'modengine2',
    name: 'ModEngine 2',
    logo: 'icon/modengine2.png',
    executable: () => path.join(MODENGINE2_DIR, MODENGINE2_ELDEN_RING_SCRIPT),//dont forget to tweak this
    requiredFiles: [
      path.join(MODENGINE2_DIR, MODENGINE2_ELDEN_RING_SCRIPT),// this too
    ],
    shell: true,
    relative: false, //The tool can be installed anywhere and doesn't need to be on the game directory
  }
];

module.exports = {
  tools,
}