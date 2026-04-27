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
  '1':   '#f7e721',  // semitone 0
  'b2':  '#c6df31',  // semitone 1
  '2':   '#6bbe52',  // semitone 2
  'b3':  '#00ae84',  // semitone 3
  '3':   '#00aece',  // semitone 4
  '4':   '#0086ce',  // semitone 5
  'b5':  '#4261ad',  // semitone 6
  '5':   '#8c499c',  // semitone 7
  'b6':  '#e7288c',  // semitone 8
  '#5':  '#e7288c',  // semitone 8 (enharmonic with b6)
  '6':   '#ef4142',  // semitone 9
  'bb7': '#ef4142',  // semitone 9 (enharmonic with 6)
  'b7':  '#f76929',  // semitone 10
  '7':   '#ffae21',  // semitone 11
  '9':   '#6bbe52',  // semitone 2 (same pitch class as 2)
};

export function getRootFret(root: RootNote, stringNum: number): number {
  const rootSemitone = NOTE_TO_SEMITONE[root];
  const openSemitone = STRING_OPEN_SEMITONES[stringNum];
  return (rootSemitone - openSemitone + 12) % 12;
}
