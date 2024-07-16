import { types } from 'vortex-api';

export type ModLoaderType = 'ModEngine2' | 'EldenRingModLoader';
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

export type PluginRequirements = { [storeId: string]: IPluginRequirement[] }
export interface IPluginRequirement {
  archiveFileName: string;
  modType: string;
  assemblyFileName?: string;
  modId?: number;
  userFacingName?: string;
  githubUrl?: string;
  modUrl?: string;
  fileArchivePattern?: RegExp;
  findMod: (api: types.IExtensionApi) => Promise<types.IMod>;
  findDownloadId: (api: types.IExtensionApi) => string;
  resolveVersion?: (api: types.IExtensionApi) => Promise<string>;
  fileFilter?: (file: string) => boolean;
}

export interface IModEngineSection {
  debug: boolean;
  external_dlls: string[];
}

export interface IModEngineLoaderSection {
  enabled: boolean;
  loose_params: boolean;
  mods: IModEngine2TOMLEntry[];
}

export interface IModEngineExtensionSection {
  mod_loader: IModEngineLoaderSection;
}

export interface IModEngine2TOML {
  modengine: IModEngineSection;
  extension: IModEngineExtensionSection;
}

export interface IModEngine2TOMLEntry {
  enabled: boolean,
  name: string,
  path: string,
}