import { useEffect, useState } from 'react';
import type { AppSettings, RenderedChord } from './types';
import { CHORD_TYPES } from './data/chordFormulas';
import { generateChords } from './logic/chordGenerator';
import ControlPanel from './components/ControlPanel/ControlPanel';
import ChordCard from './components/ChordCard/ChordCard';
import IntervalLegend from './components/IntervalLegend/IntervalLegend';
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
  const [chords, setChords] = useState<RenderedChord[]>(() => generateChords(loadSettings()));
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function handleNewRound() {
    setChords(generateChords(settings));
    setRevealed(new Set());
  }

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

      <ControlPanel
        settings={settings}
        onSettingsChange={setSettings}
        onNewRound={handleNewRound}
      />

      <div className="chord-grid">
        {chords.map((chord, i) => (
          <ChordCard
            key={`${chord.root}-${chord.chordType.id}-${i}`}
            chord={chord}
            isRevealed={revealed.has(i)}
            onReveal={() => handleReveal(i)}
          />
        ))}
      </div>

      {!allRevealed && chords.length > 0 && (
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
