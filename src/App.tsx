import { useEffect, useRef, useState } from 'react';
import type { AppSettings } from './types';
import { CHORD_TYPES } from './data/chordFormulas';
import { useChordCycler } from './hooks/useChordCycler';
import ControlPanel from './components/ControlPanel/ControlPanel';
import ChordCard from './components/ChordCard/ChordCard';
import IntervalLegend from './components/IntervalLegend/IntervalLegend';
import Metronome from './components/Metronome/Metronome';
import './App.css';

const STORAGE_KEY = 'guitarSkillsSettings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        numChords: parsed.numChords ?? 2,
        enabledChordTypeIds: new Set(parsed.enabledChordTypeIds ?? []),
        showCAGED: parsed.showCAGED ?? false,
      };
    }
  } catch {
    // ignore
  }
  return {
    numChords: 2,
    enabledChordTypeIds: new Set(CHORD_TYPES.filter(ct => ct.defaultEnabled).map(ct => ct.id)),
    showCAGED: false,
  };
}

function saveSettings(s: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    numChords: s.numChords,
    enabledChordTypeIds: [...s.enabledChordTypeIds],
    showCAGED: s.showCAGED,
  }));
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  // Track ref for the sliding animation during cycling
  const trackRef = useRef<HTMLDivElement | null>(null);

  const { chords, incomingChord, cyclePhase, isPlaying, onBeat, onStop, onNewRound, commitCycle } =
    useChordCycler(settings, () => setRevealed(new Set()));

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Trigger the CSS slide transition as soon as cycling phase begins
  useEffect(() => {
    if (cyclePhase !== 'cycling' || !trackRef.current) return;
    const track = trackRef.current;
    const firstCard = track.firstElementChild as HTMLElement | null;
    if (!firstCard) return;
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = 20;
    // Use rAF to ensure the 3-card render has painted before we start the transition
    const raf = requestAnimationFrame(() => {
      track.style.transform = `translateX(-${cardWidth + gap}px)`;
    });
    return () => cancelAnimationFrame(raf);
  }, [cyclePhase]);

  function handleReveal(idx: number) {
    setRevealed(prev => new Set([...prev, idx]));
  }

  function handleRevealAll() {
    setRevealed(new Set(chords.map((_, i) => i)));
  }

  const allRevealed = chords.length > 0 && chords.every((_, i) => revealed.has(i));

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Chord Practice</h1>
        <span className="app__subtitle">CAGED System Trainer</span>
      </header>

      <Metronome onBeat={onBeat} onStop={onStop} />

      <ControlPanel
        settings={settings}
        onSettingsChange={setSettings}
        onNewRound={onNewRound}
      />

      <div className={`chord-grid${cyclePhase === 'cycling' ? ' chord-grid--cycling' : ''}`}>
        {cyclePhase === 'idle' ? (
          chords.map((chord, i) => (
            <ChordCard
              key={`${chord.root}-${chord.chordType.id}-${i}`}
              chord={chord}
              isRevealed={revealed.has(i)}
              onReveal={() => handleReveal(i)}
              isActive={isPlaying && i === 0}
            />
          ))
        ) : (
          <div
            className="chord-grid__track"
            ref={trackRef}
            onTransitionEnd={commitCycle}
          >
            {/* Exiting chord (slot 0) */}
            <ChordCard
              key="exit"
              chord={chords[0]}
              isRevealed={revealed.has(0)}
              onReveal={() => {}}
              animationClass="chord-card--exiting"
            />
            {/* Shifting chords (slot 1+) */}
            {chords.slice(1).map((chord, i) => (
              <ChordCard
                key={`${chord.root}-${chord.chordType.id}`}
                chord={chord}
                isRevealed={revealed.has(i + 1)}
                onReveal={() => {}}
              />
            ))}
            {/* Entering chord */}
            {incomingChord && (
              <ChordCard
                key="enter"
                chord={incomingChord}
                isRevealed={false}
                onReveal={() => {}}
                animationClass="chord-card--entering"
              />
            )}
          </div>
        )}
      </div>

      {!allRevealed && chords.length > 0 && cyclePhase === 'idle' && (
        <div className="app__reveal-all">
          <button className="btn--reveal-all" onClick={handleRevealAll}>
            Reveal All
          </button>
        </div>
      )}

      <footer className="app__footer">
        <IntervalLegend chords={chords} />
      </footer>
    </div>
  );
}
