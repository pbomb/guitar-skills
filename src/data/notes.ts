import type { IntervalToken, RootNote } from '../types';

export const CHROMATIC_NOTES: RootNote[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

export const NOTE_TO_SEMITONE: Record<RootNote, number> = {
  'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11,
};

export const INTERVAL_SEMITONES: Record<IntervalToken, number> = {
  '1':   0,
  'b2':  1,
  '2':   2,
  'b3':  3,
  '3':   4,
  '4':   5,
  'b5':  6,
  '5':   7,
  'b6':  8,
  '#5':  8,
  '6':   9,
  'bb7': 9,
  'b7':  10,
  '7':   11,
  '9':   2,  // same pitch class as 2, displayed as 9
};

// Open string pitch classes (C=0): E A D G B E
export const STRING_OPEN_SEMITONES: Record<number, number> = {
  6: 4,   // E
  5: 9,   // A
  4: 2,   // D
  3: 7,   // G
  2: 11,  // B
  1: 4,   // E
};

export const INTERVAL_COLORS: Record<IntervalToken, string> = {
  '1':   '#E74C3C',
  'b2':  '#FF8C00',
  '2':   '#F7DC6F',
  'b3':  '#27AE60',
  '3':   '#2ECC71',
  '4':   '#1ABC9C',
  'b5':  '#8E44AD',
  '5':   '#3498DB',
  'b6':  '#5DADE2',
  '#5':  '#5DADE2',
  '6':   '#85C1E9',
  'bb7': '#A569BD',
  'b7':  '#E67E22',
  '7':   '#F0B27A',
  '9':   '#F4D03F',
};

export function getRootFret(root: RootNote, stringNum: number): number {
  const rootSemitone = NOTE_TO_SEMITONE[root];
  const openSemitone = STRING_OPEN_SEMITONES[stringNum];
  return (rootSemitone - openSemitone + 12) % 12;
}
