import { describe, expect, it } from 'vitest';
import { buildDiagram } from '../logic/diagramBuilder';
import { CHORD_TYPES } from '../data/chordFormulas';

const major = CHORD_TYPES.find(c => c.id === 'major')!;
const minor = CHORD_TYPES.find(c => c.id === 'minor')!;

describe('buildDiagram – fret wrapping', () => {
  it('produces no negative frets for any root × CAGED form combination', () => {
    const roots = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'] as const;
    const forms = ['C','A','G','E','D'] as const;

    for (const root of roots) {
      for (const form of forms) {
        const { dots } = buildDiagram(root, major, form);
        const played = dots.filter(d => !d.muted);
        for (const dot of played) {
          expect(dot.fret, `${root} major ${form}-shape string ${dot.stringNum}`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('shifts ALL strings up by 12 when any string would be negative, not just that string', () => {
    // E-shape for root E: rootFret on string 6 = 0.
    // Template offsets include +2 and +1, so raw frets: [0,2,2,1,0,0] – all non-negative.
    // But G-shape for root E: rootFret on string 6 = 0, offsets include -1 and -3
    // → raw frets before fix: [0,-1,-3,-3,-3,0] – three negatives.
    // After fix: ALL shift to [12,11,9,9,9,12].
    const { dots } = buildDiagram('E', major, 'G');
    const played = dots.filter(d => !d.muted);

    // None should be negative
    for (const dot of played) {
      expect(dot.fret).toBeGreaterThanOrEqual(0);
    }

    // G-shape offsets for string 6 and string 1 are both 0.
    // Raw fret = 0 (root E on open E strings), shifted to 12.
    const str6 = played.find(d => d.stringNum === 6);
    const str1 = played.find(d => d.stringNum === 1);
    expect(str6?.fret).toBe(12); // offset 0 → 0 + 12
    expect(str1?.fret).toBe(12); // offset 0 → 0 + 12

    // String 5 has offset -1 → raw -1, shifted to 11
    const str5 = played.find(d => d.stringNum === 5);
    expect(str5?.fret).toBe(11);
  });

  it('does NOT shift when all frets are non-negative', () => {
    // C major, E-shape: rootFret on string 6 = 8, all offsets 0..+2 → all positive
    const { dots } = buildDiagram('C', major, 'E');
    const played = dots.filter(d => !d.muted);

    const rootDot = played.find(d => d.stringNum === 6);
    expect(rootDot?.fret).toBe(8); // should NOT have 12 added
  });

  it('applies shift correctly for minor chords too', () => {
    const { dots } = buildDiagram('E', minor, 'G');
    const played = dots.filter(d => !d.muted);
    for (const dot of played) {
      expect(dot.fret).toBeGreaterThanOrEqual(0);
    }
  });
});
