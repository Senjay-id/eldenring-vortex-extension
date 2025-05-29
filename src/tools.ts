import path from 'path';
import { TOOL_ID_SEAMLESS_COOP, TOOL_ID_MODENGINE2, MODENGINE2_ELDEN_RING_SCRIPT } from './common';

export const tools = [
  {
    id: TOOL_ID_SEAMLESS_COOP,
    name: 'Seamless Co-op',
    logo: 'icon/ersc.png',
    executable: () => 'Game/ersc_launcher.exe',
    requiredFiles: [
      'Game/ersc_launcher.exe',
    ],
    relative: true,
  },
  {
    id: TOOL_ID_MODENGINE2,
    name: 'ModEngine 2',
    logo: 'icon/modengine2.png',
    executable: () => path.join(MODENGINE2_ELDEN_RING_SCRIPT),//dont forget to tweak this
    requiredFiles: [
      path.join(MODENGINE2_ELDEN_RING_SCRIPT),// this too
    ],
    shell: true,
    relative: true, //The tool can be installed anywhere and doesn't need to be on the game directory
  }
];
