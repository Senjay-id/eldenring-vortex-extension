import { testStopPatterns } from '../src/stopPatterns';

describe('testStopPatterns', () => {
  const mockInstructions = [
    { type: 'copy', destination: 'mods/somefolder/file.txt' },
    { type: 'copy', destination: 'mods/stopme.txt' },
    { type: 'other', destination: 'mods/ignored.txt' },
    { type: 'copy', destination: 'mods/anotherfolder/stopfile.dll' },
  ] as any[];

  it('returns true if any destination matches a pattern', () => {
    const patterns = ['stopme\\.txt$', 'stopfile\\.dll$'];
    expect(testStopPatterns(mockInstructions, patterns)).toBe(true);
  });

  it('returns false if no destination matches any pattern', () => {
    const patterns = ['doesnotexist\\.txt$', 'nomatch\\.dll$'];
    expect(testStopPatterns(mockInstructions, patterns)).toBe(false);
  });

  it('ignores instructions that are not type "copy"', () => {
    const patterns = ['ignored\\.txt$'];
    expect(testStopPatterns(mockInstructions, patterns)).toBe(false);
  });

  it('handles windows-style backslashes in destination', () => {
    const instructions = [
      { type: 'copy', destination: 'mods\\folder\\stopme.txt' },
    ] as any[];
    const patterns = ['stopme\\.txt$'];
    expect(testStopPatterns(instructions, patterns)).toBe(true);
  });
});

import { mutateByStopPatterns } from '../src/stopPatterns';

// Mock the stop patterns for predictable testing
jest.mock('../src/common', () => ({
  TOP_LEVEL_MOD_FILES: ['stopfile.txt'],
  TOP_LEVEL_MOD_FOLDERS: ['parts'],
}));

describe('mutateByStopPatterns', () => {
  it('returns substring from stop pattern match (folder)', () => {
    const input = ['someMod/parts/somefile.txt'];
    const result = mutateByStopPatterns(input);
    expect(result[0]).toBe('parts/somefile.txt');
  });

  it('returns substring from stop pattern match (file)', () => {
    const input = ['foo/bar/stopfile.txt'];
    const result = mutateByStopPatterns(input);
    expect(result[0]).toBe('stopfile.txt');
  });

  it('returns original path if no stop pattern matches', () => {
    const input = ['foo/bar/otherfile.bin'];
    const result = mutateByStopPatterns(input);
    expect(result[0]).toBe('foo/bar/otherfile.bin');
  });

  it('handles windows-style backslashes', () => {
    const input = ['someMod\\parts\\somefile.txt'];
    const result = mutateByStopPatterns(input);
    expect(result[0]).toBe('parts\\somefile.txt');
  });
});