import { useEffect, useRef, useState } from 'react';
import type { AppSettings } from './types';
import { CHORD_TYPES } from './data/chordFormulas';
import { CAGED_FORMS } from './data/cagedShapes';
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
      const storedForms = parsed.enabledCAGEDForms;
      return {
        numChords: parsed.numChords ?? 2,
        enabledChordTypeIds: new Set(parsed.enabledChordTypeIds ?? []),
        enabledCAGEDForms: new Set(Array.isArray(storedForms) && storedForms.length > 0 ? storedForms : CAGED_FORMS),
        revealDiagrams: parsed.revealDiagrams ?? false,
      };
    }
  } catch {
    // ignore
  }
  return {
    numChords: 2,
    enabledChordTypeIds: new Set(CHORD_TYPES.filter(ct => ct.defaultEnabled).map(ct => ct.id)),
    enabledCAGEDForms: new Set(CAGED_FORMS),
    revealDiagrams: false,
  };
}

function saveSettings(s: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    numChords: s.numChords,
    enabledChordTypeIds: [...s.enabledChordTypeIds],
    enabledCAGEDForms: [...s.enabledCAGEDForms],
    revealDiagrams: s.revealDiagrams,
  }));
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const trackRef = useRef<HTMLDivElement | null>(null);

  const {
    carouselChords,
    incomingChord,
    cyclePhase,
    isPlaying,
    activeSlot,
    onBeat,
    onStop,
    onNewRound,
    commitCycle,
    advanceCycle,
  } = useChordCycler(settings, () => setRevealed(new Set()));

  useEffect(() => { saveSettings(settings); }, [settings]);

  // Kick off the CSS slide transition as soon as cycling phase is entered
  useEffect(() => {
    if (cyclePhase !== 'cycling' || !trackRef.current) return;
    const track = trackRef.current;
    const firstCard = track.firstElementChild as HTMLElement | null;
    if (!firstCard) return;
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = 16;
    const raf = requestAnimationFrame(() => {
      track.style.transform = `translateX(-${cardWidth + gap}px)`;
    });
    return () => cancelAnimationFrame(raf);
  }, [cyclePhase]);

  function handleReveal(idx: number) {
    setRevealed(prev => new Set([...prev, idx]));
  }

  // carouselChords = [slot1(0), slot2(1), next1(2), next2(3)]
  // Indices 0 and 1 are the 2 active practice chords; 2 and 3 are upcoming (dimmed).
  const activeIndices = new Set([0, 1]);

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

      {/* Carousel — always 4 cards: [slot1, slot2, next1, next2]; slides left on advance */}
      <div className="carousel">
        {cyclePhase === 'idle' ? (
          carouselChords.map((chord, i) => (
            <ChordCard
              key={`${chord.root}-${chord.chordType.id}-${i}`}
              chord={chord}
              isRevealed={settings.revealDiagrams || revealed.has(i)}
              onReveal={() => handleReveal(i)}
              isActive={isPlaying && ((i === 0 && activeSlot === 1) || (i === 1 && activeSlot === 2))}
              isDimmed={!activeIndices.has(i)}
            />
          ))
        ) : (
          // During cycling: render 5 cards [slot1, slot2, next1, next2, incoming] and slide left
          <div
            className="carousel__track"
            ref={trackRef}
            onTransitionEnd={(e) => {
              if (e.currentTarget === e.target && e.propertyName === 'transform') commitCycle();
            }}
          >
            {carouselChords.map((chord, i) => (
              <ChordCard
                key={`${chord.root}-${chord.chordType.id}-${i}`}
                chord={chord}
                isRevealed={settings.revealDiagrams || revealed.has(i)}
                onReveal={() => {}}
                isDimmed={!activeIndices.has(i)}
              />
            ))}
            {incomingChord && (
              <ChordCard
                key="incoming"
                chord={incomingChord}
                isRevealed={settings.revealDiagrams}
                onReveal={() => {}}
                isDimmed
              />
            )}
          </div>
        )}
      </div>

      <div className="app__advance">
        <button
          className="btn btn--advance"
          onClick={advanceCycle}
          disabled={cyclePhase === 'cycling'}
        >
          Advance →
        </button>
      </div>

      <footer className="app__footer">
        <IntervalLegend chords={carouselChords.slice(0, 2)} />
      </footer>
    </div>
  );
}
