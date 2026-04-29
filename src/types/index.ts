export type IntervalToken =
  | '1' | 'b2' | '2' | 'b3' | '3' | '4' | 'b5' | '5'
  | 'b6' | '6' | 'b7' | '7' | 'bb7' | '#5' | '9';

export type RootNote =
  | 'C' | 'C#' | 'D' | 'Eb' | 'E' | 'F'
  | 'F#' | 'G' | 'Ab' | 'A' | 'Bb' | 'B';

export type CAGEDForm = 'C' | 'A' | 'G' | 'E' | 'D';

export interface ChordType {
  id: string;
  label: string;
  intervals: IntervalToken[];
  defaultEnabled: boolean;
}

export interface FretDot {
  stringNum: number;   // 1=high E, 6=low E
  fret: number;        // 0=open
  interval: IntervalToken;
  muted: boolean;
}

export interface RenderedChord {
  root: RootNote;
  chordType: ChordType;
  cagedForm: CAGEDForm | null;
  dots: FretDot[];
  minFret: number;
  maxFret: number;
  isOpen: boolean;
}

export interface AppSettings {
  numChords: 2 | 3 | 4;
  enabledChordTypeIds: Set<string>;
  enabledCAGEDForms: Set<CAGEDForm>;
  revealDiagrams: boolean;
}

export interface ShapeEntry {
  stringNum: number;
  fretOffset: number;
  interval: IntervalToken | null;  // null = muted
}
