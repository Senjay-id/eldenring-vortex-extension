/* eslint-disable */
import * as React from 'react';
import { MainContext, selectors, types, util } from 'vortex-api';

import { GAME_ID, NS } from './common';

interface IConnectedProps {
  loadOrder: types.ILoadOrderEntry[];
  discovery: types.IDiscoveryResult;
}

export function InfoPanel() {
  const { api } = React.useContext(MainContext);
  const t = (input: string) => api.translate(input, { ns: NS });;
  return (
    <>
      <p>
        {t(
          'Drag and Drop the entries to reorder how the game loads them. Please note, the top-most entry will win in case of conflicts.',
        )}
      </p>
      <p>{t('Mod descriptions from mod authors may have information to determine the best order.')}</p>
      <h4>{t('Additional Information:')}</h4>
      <ul>
        <li>{t('Vortex manipulates ModEngine 2\'s "config_eldenring.toml" when setting the load order.')}</li>
        <li>{t('Not all mods require load ordering, if the mod is missing in this page, chances are it\'s a ".dll" mod (which gets added differently)')}</li>
        <li>{t('Asset replacers are placed in the "mod" directory (not "mods") and the config file is modified to include the path to the mod\'s contents.')}</li>
        <li>{t('Press the "Refresh List" button to refresh/sync changes.')}</li>
      </ul>
    </>
  );
}

function mapStateToProps(state: any): IConnectedProps {
  const profile = selectors.activeProfile(state);
  return {
    loadOrder: util.getSafe(state, ['persistent', 'loadOrder', profile?.id], []),
    discovery: selectors.discoveryByGame(state, GAME_ID),
  };
}
