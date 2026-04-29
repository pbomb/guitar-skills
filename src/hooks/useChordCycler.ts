/**
 * useChordCycler — drives the metronome-synced chord carousel.
 *
 * Carousel layout (carouselChords[4]):
 *   index 0  prev   dimmed — chord that was just retired
 *   index 1  slot1  opaque — active practice chord (highlighted on odd measures)
 *   index 2  slot2  opaque — active practice chord (highlighted on even measures)
 *   index 3  next   dimmed — chord about to be introduced
 *
 * Timing model:
 *   - 1 measure = 4 beats
 *   - activeSlot toggles 1↔2 each measure
 *   - After slot1 completes 4 active plays (end of measure 6), first advance fires.
 *   - One measure later, after slot2 completes 4 active plays, second advance fires.
 *   - Each advance: [prev, slot1, slot2, next] → [slot1, slot2, next, newChord]
 *
 * All beat/measure counters are refs (not state) to avoid re-renders on every
 * beat. React state only changes at measure boundaries and cycle transitions.
 *
 * The CSS slide animation lives in App.tsx (useEffect on cyclePhase).
 * commitCycle() is called by onTransitionEnd after the 380ms animation.
 */
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
  // Always generate exactly 4 unique chords for the carousel regardless of settings.numChords
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

  // Beat/measure counters — refs so the scheduler's stable onBeat closure never goes stale
  const beatInMeasureRef = useRef(0); // 0–3; resets to 0 after the 4th beat
  const measureCountRef = useRef(0);  // increments each measure
  const isPlayingRef = useRef(false);
  // Guards against a second cycle firing during the 380ms CSS animation
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
    // App.tsx useEffect watches cyclePhase and kicks off the CSS translateX animation
  }, []);

  const onBeat = useCallback(() => {
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      setActiveSlot(1); // slot1 is always active first
    }

    if (isCyclingRef.current) {
      // Keep counting beats through the animation so timing stays in sync
      beatInMeasureRef.current = (beatInMeasureRef.current + 1) % 4;
      return;
    }

    beatInMeasureRef.current++;
    if (beatInMeasureRef.current <= 4) return;
    
    // Measure complete — advance counters
    beatInMeasureRef.current = 1;
    measureCountRef.current++;

    if (measureCountRef.current === 3) {
      // slot1 has played 4 times (measures 0,2,4,6) — first advance.
      // Leave measureCount at 7 so the next measure end brings it to 8 for the second advance.
      isCyclingRef.current = true;
      measureCountRef.current = 0;
      triggerCycle();
    } else {
      setActiveSlot(prev => (prev === 1 ? 2 : 1));
    }
  }, [triggerCycle]);

  const onStop = useCallback(() => reset(false), [reset]);
  const onNewRound = useCallback(() => reset(true), [reset]);

  // Called by App's onTransitionEnd after the 380ms CSS slide animation
  const commitCycle = useCallback(() => {
    setCarouselChords(prev => {
      const incoming = incomingChord;
      // [prev, slot1, slot2, next] → [slot1, slot2, next, incoming]
      return incoming ? [...prev.slice(1), incoming] : prev;
    });
    setIncomingChord(null);
    isCyclingRef.current = false;
    setCyclePhase('idle');
    // After advance, the old slot2 is now slot1 — restart highlight from slot1
    setActiveSlot(isPlayingRef.current ? 1 : null);
    onCycleCommitRef.current();
  // incomingChord captured at cycle-start; eslint rule doesn't apply here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingChord]);

  return { carouselChords, incomingChord, cyclePhase, isPlaying, activeSlot, onBeat, onStop, onNewRound, commitCycle };
}
