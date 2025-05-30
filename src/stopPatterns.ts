/* eslint-disable */
import { types } from 'vortex-api';

import { TOP_LEVEL_MOD_FILES, TOP_LEVEL_MOD_FOLDERS } from './common';

function dirToWordExp(input: string, index?: number, array?: string[], escape?: boolean): string {
  return escape ? `(^|\/)${input}(\/|$)` : `(^|/)${input}(/|$)`;
}

function fileEndToWordExp(input: string) {
  // Wrap the input in a regex that will match a filename _exactly_ at the end of the filepath.
  return input + '$';
}

let _stopPatternsCache: { [key: string]: RegExp[] } = {};
export function getStopPatterns(escape: boolean = false): RegExp[] {
  const cacheKey = escape ? 'escape' : 'noescape';
  if (_stopPatternsCache[cacheKey]) {
    return _stopPatternsCache[cacheKey];
  }
  const filePatterns: string[] = TOP_LEVEL_MOD_FILES.map((val) => fileEndToWordExp(val.toLowerCase()));
  const dirPatterns: string[] = TOP_LEVEL_MOD_FOLDERS.map((val, idx, arr) => dirToWordExp(val.toLowerCase(), idx, arr, escape));
  const patterns: RegExp[] = [].concat(dirPatterns, filePatterns).map(p => new RegExp(p, 'i'));
  _stopPatternsCache[cacheKey] = patterns;
  return patterns;
}

export function mutateByStopPatterns(filePaths: string[]): string[] {
  return filePaths.map(filePath => toValidRelPath(filePath));
}

export function toValidRelPath(sourcePath: string): string {
  const patterns = getStopPatterns(true);
  const originalSep = sourcePath.includes('\\') ? '\\' : '/';
  const normalized = sourcePath.replace(/\\/g, '/');

  for (const regex of patterns) {
    const match = regex.exec(normalized);
    if (match && match.index !== undefined) {
      let result = normalized.slice(match.index);
      if (result.startsWith('/')) result = result.slice(1);
      return originalSep === '\\' ? result.replace(/\//g, '\\') : result;
    }
  }

  return sourcePath; // No pattern matched
}


//#region StopPatterns utility functions
export function testStopPatterns(instructions: types.IInstruction[], patterns: string[]): boolean {
  // We want to sort the instructions so that the longest paths are first
  //  this will make the modType recognition faster.
  const sorted = instructions
    .filter(inst => inst.type === 'copy' && !!inst.destination)
    .sort((a, b) => b.destination!.length - a.destination!.length);
  const runThroughPatterns = (patterns: string[]) => {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'i');
      for (const inst of sorted) {
        const normal = inst.destination!.replace(/\\/g, '/');
        if (regex.test(normal)) {
          return true;
        }
      }
    }
    return false;
  };
  return runThroughPatterns(patterns);
}
//#endregion