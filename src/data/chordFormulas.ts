import type { ChordType } from '../types';

export const CHORD_TYPES: ChordType[] = [
  { id: 'major',   label: 'Major',     intervals: ['1','3','5'],           defaultEnabled: true  },
  { id: 'minor',   label: 'Minor',     intervals: ['1','b3','5'],          defaultEnabled: true  },
  { id: '7',       label: '7',         intervals: ['1','3','5','b7'],      defaultEnabled: true  },
  { id: 'maj7',    label: 'Maj7',      intervals: ['1','3','5','7'],       defaultEnabled: true  },
  { id: 'min7',    label: 'Min7',      intervals: ['1','b3','5','b7'],     defaultEnabled: true  },
  { id: 'dom9',    label: '9',         intervals: ['1','3','5','b7','9'],  defaultEnabled: false },
  { id: 'sus2',    label: 'sus2',      intervals: ['1','2','5'],           defaultEnabled: false },
  { id: 'sus4',    label: 'sus4',      intervals: ['1','4','5'],           defaultEnabled: false },
  { id: 'add9',    label: 'add9',      intervals: ['1','3','5','9'],       defaultEnabled: false },
  { id: 'dim',     label: 'dim',       intervals: ['1','b3','b5'],         defaultEnabled: false },
  { id: 'dim7',    label: 'dim7',      intervals: ['1','b3','b5','bb7'],   defaultEnabled: false },
  { id: 'aug',     label: 'aug',       intervals: ['1','3','#5'],          defaultEnabled: false },
  { id: 'minmaj7', label: 'Min(Maj7)', intervals: ['1','b3','5','7'],      defaultEnabled: false },
  { id: 'maj9',    label: 'Maj9',      intervals: ['1','3','5','7','9'],   defaultEnabled: false },
  { id: 'min9',    label: 'Min9',      intervals: ['1','b3','5','b7','9'], defaultEnabled: false },
];
