import type { FretDot, IntervalToken, RenderedChord } from '../types';

export type InversionLabel = 'root' | '1st' | '2nd' | '3rd';
export type SubShapeVariant = 'low' | 'high';
export type ArpeggioNoteCount = 'full' | '3-note' | '4-note';

export interface SubShapeOption {
  inversion: InversionLabel;
  /** null = only one variant exists for this inversion; 'low'/'high' = two exist */
  variant: SubShapeVariant | null;
  stringNums: number[];
}

export const INVERSION_LABELS: Record<InversionLabel, string> = {
  root: 'Root Position',
  '1st': '1st Inversion',
  '2nd': '2nd Inversion',
  '3rd': '3rd Inversion',
};

// Classify an interval into its inversion role (what chord position it occupies as the bass note)
function intervalToInversion(interval: IntervalToken): InversionLabel {
  switch (interval) {
    case '1':
      return 'root';
    // 3rd-family (all variants of the 3rd chord tone, including sus substitutes)
    case 'b2': case '2': case 'b3': case '3': case '4':
      return '1st';
    // 5th-family
    case 'b5': case '5': case '#5': case 'b6': case '6':
      return '2nd';
    // 7th-family and extensions
    case 'bb7': case 'b7': case '7': case '9':
      return '3rd';
    default:
      return 'root';
  }
}

/**
 * Given the full dot set for a rendered chord, return all valid N-note sub-shapes.
 *
 * A sub-shape is valid when:
 * - Its strings are consecutive (no gaps)
 * - It contains at least 3 unique interval categories (filters power-chord-only slices)
 *
 * When the same inversion appears on two different string groups within the form,
 * the lower string group (lower pitch) is labeled 'low' and the upper is 'high'.
 */
export function getSubShapeOptions(
  chord: RenderedChord,
  noteCount: 3 | 4,
): SubShapeOption[] {
  // Sort played dots highest string number first (str6 = lowest pitch first)
  const played = chord.dots
    .filter(d => !d.muted)
    .sort((a, b) => b.stringNum - a.stringNum);

  if (played.length < noteCount) return [];

  const candidates: Array<{ inversion: InversionLabel; stringNums: number[] }> = [];

  for (let i = 0; i <= played.length - noteCount; i++) {
    const window = played.slice(i, i + noteCount);

    // Strings must be adjacent with no gaps
    const isConsecutive = window.every(
      (d, j) => j === 0 || window[j - 1].stringNum === d.stringNum + 1,
    );
    if (!isConsecutive) continue;

    // Require ≥3 unique intervals to exclude power-chord-only slices (e.g. 1-5-1)
    const uniqueIntervals = new Set(window.map(d => d.interval));
    if (uniqueIntervals.size < 3) continue;

    // Inversion is determined by the lowest-pitched note.
    // played[] is sorted descending by stringNum, so window[0] has the highest
    // stringNum = lowest pitch = the bass note.
    const bassInterval = window[0].interval;

    candidates.push({
      inversion: intervalToInversion(bassInterval),
      stringNums: window.map(d => d.stringNum),
    });
  }

  // Count how many candidates share each inversion label
  const inversionCount = new Map<InversionLabel, number>();
  for (const c of candidates) {
    inversionCount.set(c.inversion, (inversionCount.get(c.inversion) ?? 0) + 1);
  }

  // Assign low/high variant labels where duplicates exist.
  // Candidates are ordered from lowest strings (lowest pitch) to highest, so
  // the first occurrence of an inversion = 'low', second = 'high'.
  const inversionSeen = new Map<InversionLabel, number>();
  return candidates.map(c => {
    const count = inversionCount.get(c.inversion) ?? 1;
    if (count < 2) return { ...c, variant: null };

    const seen = inversionSeen.get(c.inversion) ?? 0;
    inversionSeen.set(c.inversion, seen + 1);
    const variant: SubShapeVariant = seen === 0 ? 'low' : 'high';
    return { ...c, variant };
  });
}

/**
 * Build a display version of a chord with only the active sub-shape strings visible.
 * Non-active strings are marked muted so the diagram still shows all 6 strings correctly.
 */
export function buildFilteredChord(
  chord: RenderedChord,
  activeStrings: number[],
): RenderedChord {
  const activeSet = new Set(activeStrings);

  const filteredDots: FretDot[] = chord.dots.map(dot =>
    activeSet.has(dot.stringNum) ? dot : { ...dot, muted: true },
  );

  const playedFrets = filteredDots
    .filter(d => !d.muted && d.fret > 0)
    .map(d => d.fret);

  const minFret = playedFrets.length > 0 ? Math.min(...playedFrets) : 1;
  const maxFret =
    playedFrets.length > 0
      ? Math.max(Math.max(...playedFrets), minFret + 4)
      : 5;
  const isOpen = filteredDots.some(d => !d.muted && d.fret === 0);

  return { ...chord, dots: filteredDots, minFret, maxFret, isOpen };
}
