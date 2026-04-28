import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppSettings, RenderedChord } from '../types';
import { generateChords, generateOneChord } from '../logic/chordGenerator';

export type CyclePhase = 'idle' | 'cycling';

export interface ChordCyclerResult {
  // Always 4 chords: [prev(dimmed), slot1(active), slot2(active), next(dimmed)]
  carouselChords: RenderedChord[];
  incomingChord: RenderedChord | null;
  cyclePhase: CyclePhase;
  isPlaying: boolean;
  // 1 = slot1 highlighted, 2 = slot2 highlighted, null = stopped
  activeSlot: 1 | 2 | null;
  onBeat: () => void;
  onStop: () => void;
  onNewRound: () => void;
  commitCycle: () => void;
}

function makeCarousel(settings: AppSettings): RenderedChord[] {
  // Always generate exactly 4 unique chords for the carousel
  return generateChords({ ...settings, numChords: 4 });
}

export function useChordCycler(
  settings: AppSettings,
  onCycleCommit: () => void,
): ChordCyclerResult {
  const [carouselChords, setCarouselChords] = useState<RenderedChord[]>(() => makeCarousel(settings));
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSlot, setActiveSlot] = useState<1 | 2 | null>(null);
  const [incomingChord, setIncomingChord] = useState<RenderedChord | null>(null);

  const carouselRef = useRef(carouselChords);
  const settingsRef = useRef(settings);
  const onCycleCommitRef = useRef(onCycleCommit);

  // Beat/measure counters — all refs to avoid re-renders per beat
  const beatInMeasureRef = useRef(0); // 0–3
  const measureCountRef = useRef(0);  // 0–7; 8 measures = full cycle (4 plays per slot)
  const isPlayingRef = useRef(false);
  const isCyclingRef = useRef(false);

  useEffect(() => { carouselRef.current = carouselChords; }, [carouselChords]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { onCycleCommitRef.current = onCycleCommit; }, [onCycleCommit]);

  const reset = useCallback((regenerate = false) => {
    isPlayingRef.current = false;
    isCyclingRef.current = false;
    beatInMeasureRef.current = 0;
    measureCountRef.current = 0;
    setIsPlaying(false);
    setActiveSlot(null);
    setIncomingChord(null);
    setCyclePhase('idle');
    if (regenerate) setCarouselChords(makeCarousel(settingsRef.current));
  }, []);

  const triggerCycle = useCallback(() => {
    const excludeKeys = new Set(carouselRef.current.map(c => `${c.root}-${c.chordType.id}`));
    const next = generateOneChord(settingsRef.current, excludeKeys);
    setIncomingChord(next);
    setCyclePhase('cycling');
  }, []);

  const onBeat = useCallback(() => {
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      setActiveSlot(1); // slot1 is always active first
    }

    if (isCyclingRef.current) {
      // Keep counting through the animation so beats stay in sync
      beatInMeasureRef.current = (beatInMeasureRef.current + 1) % 4;
      return;
    }

    beatInMeasureRef.current++;
    if (beatInMeasureRef.current < 4) return;

    // Measure complete
    beatInMeasureRef.current = 0;
    measureCountRef.current++;

    if (measureCountRef.current >= 8) {
      // Full cycle: each slot played 4 times (measures 0,2,4,6 = slot1; 1,3,5,7 = slot2)
      measureCountRef.current = 0;
      isCyclingRef.current = true;
      triggerCycle();
    } else {
      // Toggle active slot for next measure
      setActiveSlot(prev => (prev === 1 ? 2 : 1));
    }
  }, [triggerCycle]);

  const onStop = useCallback(() => {
    reset(false);
  }, [reset]);

  const onNewRound = useCallback(() => {
    reset(true);
  }, [reset]);

  // Called by App when the CSS slide transition ends
  const commitCycle = useCallback(() => {
    setCarouselChords(prev => {
      const incoming = incomingChord;
      // [prev, slot1, slot2, next] → [slot1, slot2, next, incoming]
      return incoming ? [...prev.slice(1), incoming] : prev;
    });
    setIncomingChord(null);
    isCyclingRef.current = false;
    setCyclePhase('idle');
    // After advance, slot1 is the old slot2 — start fresh at slot1
    setActiveSlot(isPlayingRef.current ? 1 : null);
    onCycleCommitRef.current();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingChord]);

  return { carouselChords, incomingChord, cyclePhase, isPlaying, activeSlot, onBeat, onStop, onNewRound, commitCycle };
}
