import type { CAGEDForm, FretDot, IntervalToken, RenderedChord, ChordType, RootNote } from '../types';
import { getRootFret } from '../data/notes';
import { SHAPES, CAGED_ANCHOR_STRING } from '../data/cagedShapes';

const FRETS_SHOWN = 5;

function getShapeKey(chordTypeId: string): string {
  // Map optional chord types that don't have their own shapes to closest available
  const fallbacks: Record<string, string> = {
    dom9: 'dom9',
    sus2: 'sus2',
    sus4: 'sus4',
    add9: 'add9',
    dim:  'dim',
    dim7: 'dim7',
    aug:  'aug',
    minmaj7: 'minmaj7',
    maj9: 'maj9',
    min9: 'min9',
  };
  return fallbacks[chordTypeId] ?? chordTypeId;
}

export function buildDiagram(
  root: RootNote,
  chordType: ChordType,
  cagedForm: CAGEDForm,
): Pick<RenderedChord, 'dots' | 'minFret' | 'maxFret' | 'isOpen'> {
  const shapeKey = getShapeKey(chordType.id);
  const shapeMap = SHAPES[shapeKey];

  // Fallback to major shape if chord type has no defined shape
  const template = shapeMap?.[cagedForm] ?? SHAPES['major'][cagedForm];
  const anchorString = CAGED_ANCHOR_STRING[cagedForm];
  const rootFret = getRootFret(root, anchorString);

  const dots: FretDot[] = template.map(entry => {
    if (entry.interval === null) {
      return {
        stringNum: entry.stringNum,
        fret: 0,
        interval: '1' as IntervalToken,
        muted: true,
      };
    }

    let absoluteFret = rootFret + entry.fretOffset;

    // Wrap around the neck: if fret goes negative, add 12
    if (absoluteFret < 0) absoluteFret += 12;

    return {
      stringNum: entry.stringNum,
      fret: absoluteFret,
      interval: entry.interval,
      muted: false,
    };
  });

  const playedFrets = dots.filter(d => !d.muted && d.fret > 0).map(d => d.fret);
  const minFret = playedFrets.length > 0 ? Math.min(...playedFrets) : 1;
  const maxFret = playedFrets.length > 0 ? Math.max(...playedFrets) : FRETS_SHOWN;

  // Ensure the window always covers at least FRETS_SHOWN frets
  const windowMax = Math.max(maxFret, minFret + FRETS_SHOWN - 1);

  const isOpen = dots.some(d => !d.muted && d.fret === 0);

  return { dots, minFret, maxFret: windowMax, isOpen };
}
