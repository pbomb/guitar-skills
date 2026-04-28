import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppSettings, RenderedChord } from '../types';
import { generateChords, generateOneChord } from '../logic/chordGenerator';

export type CyclePhase = 'idle' | 'cycling';

export interface ChordCyclerResult {
  chords: RenderedChord[];
  incomingChord: RenderedChord | null;
  cyclePhase: CyclePhase;
  isPlaying: boolean;
  onBeat: () => void;
  onStop: () => void;
  onNewRound: () => void;
  commitCycle: () => void;
}

export function useChordCycler(
  settings: AppSettings,
  onCycleCommit: () => void,
): ChordCyclerResult {
  const [chords, setChords] = useState<RenderedChord[]>(() => generateChords(settings));
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  // Expose incomingChord as state so the render can read it during 'cycling' phase
  const [incomingChord, setIncomingChord] = useState<RenderedChord | null>(null);

  const chordsRef = useRef(chords);
  const settingsRef = useRef(settings);
  const beatInMeasureRef = useRef(0);
  const measureCountRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isCyclingRef = useRef(false);
  const onCycleCommitRef = useRef(onCycleCommit);

  useEffect(() => { chordsRef.current = chords; }, [chords]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { onCycleCommitRef.current = onCycleCommit; }, [onCycleCommit]);

  // Reset and regenerate when numChords changes to avoid slot-count mismatch
  const prevNumChordsRef = useRef(settings.numChords);
  useEffect(() => {
    if (settings.numChords === prevNumChordsRef.current) return;
    prevNumChordsRef.current = settings.numChords;
    beatInMeasureRef.current = 0;
    measureCountRef.current = 0;
    isCyclingRef.current = false;
    setIncomingChord(null);
    setCyclePhase('idle');
    setChords(generateChords(settings));
  });

  const triggerCycle = useCallback(() => {
    const excludeKeys = new Set(chordsRef.current.map(c => `${c.root}-${c.chordType.id}`));
    const next = generateOneChord(settingsRef.current, excludeKeys);
    setIncomingChord(next);
    setCyclePhase('cycling');
  }, []);

  const handleBeat = useCallback(() => {
    if (isCyclingRef.current) {
      beatInMeasureRef.current = (beatInMeasureRef.current + 1) % 4;
      return;
    }
    beatInMeasureRef.current += 1;
    if (beatInMeasureRef.current < 4) return;
    beatInMeasureRef.current = 0;
    measureCountRef.current += 1;
    if (measureCountRef.current < 4) return;
    measureCountRef.current = 0;
    isCyclingRef.current = true;
    triggerCycle();
  }, [triggerCycle]);

  const onBeat = useCallback(() => {
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
    handleBeat();
  }, [handleBeat]);

  const onStop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    beatInMeasureRef.current = 0;
    measureCountRef.current = 0;
    isCyclingRef.current = false;
    setIncomingChord(null);
    setCyclePhase('idle');
  }, []);

  const onNewRound = useCallback(() => {
    beatInMeasureRef.current = 0;
    measureCountRef.current = 0;
    isCyclingRef.current = false;
    setIncomingChord(null);
    setCyclePhase('idle');
    setChords(generateChords(settingsRef.current));
  }, []);

  // Called by App when the CSS slide transition ends
  const commitCycle = useCallback(() => {
    setChords(prev => {
      const incoming = incomingChord;
      return incoming ? [...prev.slice(1), incoming] : prev;
    });
    setIncomingChord(null);
    isCyclingRef.current = false;
    setCyclePhase('idle');
    onCycleCommitRef.current();
  // incomingChord intentionally captured via closure — it's the chord that was set when cycling started
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingChord]);

  return { chords, incomingChord, cyclePhase, isPlaying, onBeat, onStop, onNewRound, commitCycle };
}
