import { types } from 'vortex-api';

export interface IGitHubRelease {
  url: string;
  id: number;
  tag_name: string;
  name: string;
  assets: IGitHubAsset[];
}

export interface IGitHubAsset {
  url: string;
  id: number;
  name: string;
  label: string | null;
  state: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
  release: IGitHubRelease;
}

export interface IGithubDownload {
  fileName: string;
  url: string;
}

export type PluginRequirements = { [storeId: string]: IPluginRequirement[] }
export interface IPluginRequirement {
  fileName: string;
  modType: string;
  modId?: number;
  userFacingName?: string;
  githubUrl?: string;
  modUrl?: string;
  assetMatcher?: (asset: IGitHubAsset) => boolean;
  findMod: (api: types.IExtensionApi) => Promise<types.IMod>;
  fileFilter?: (file: string) => boolean;
}
