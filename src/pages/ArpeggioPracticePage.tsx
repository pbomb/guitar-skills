import { useState, useCallback } from 'react';
import type { CAGEDForm, RenderedChord } from '../types';
import { CHORD_TYPES } from '../data/chordFormulas';
import { CAGED_FORMS } from '../data/cagedShapes';
import { CHROMATIC_NOTES } from '../data/notes';
import { buildDiagram } from '../logic/diagramBuilder';
import ChordCard from '../components/ChordCard/ChordCard';
import Metronome from '../components/Metronome/Metronome';
import IntervalLegend from '../components/IntervalLegend/IntervalLegend';
import './ArpeggioPracticePage.css';

const STORAGE_KEY = 'guitarSkillsArpeggioSettings';

interface ArpeggioSettings {
  enabledChordTypeIds: Set<string>;
  enabledCAGEDForms: Set<CAGEDForm>;
  revealDiagrams: boolean;
}

function loadSettings(): ArpeggioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const storedForms = parsed.enabledCAGEDForms;
      return {
        enabledChordTypeIds: new Set(parsed.enabledChordTypeIds ?? []),
        enabledCAGEDForms: new Set(Array.isArray(storedForms) && storedForms.length > 0 ? storedForms : CAGED_FORMS),
        revealDiagrams: parsed.revealDiagrams ?? false,
      };
    }
  } catch {
    // ignore
  }
  return {
    enabledChordTypeIds: new Set(CHORD_TYPES.filter(ct => ct.defaultEnabled).map(ct => ct.id)),
    enabledCAGEDForms: new Set(CAGED_FORMS),
    revealDiagrams: false,
  };
}

function saveSettings(s: ArpeggioSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    enabledChordTypeIds: [...s.enabledChordTypeIds],
    enabledCAGEDForms: [...s.enabledCAGEDForms],
    revealDiagrams: s.revealDiagrams,
  }));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateChord(settings: ArpeggioSettings): RenderedChord | null {
  const enabledTypes = CHORD_TYPES.filter(ct => settings.enabledChordTypeIds.has(ct.id));
  if (enabledTypes.length === 0) return null;
  const forms = CAGED_FORMS.filter(f => settings.enabledCAGEDForms.has(f));
  const availableForms = forms.length > 0 ? forms : CAGED_FORMS;

  const root = pick(CHROMATIC_NOTES);
  const chordType = pick(enabledTypes);
  const cagedForm = pick(availableForms);
  const { dots, minFret, maxFret, isOpen } = buildDiagram(root, chordType, cagedForm);
  return { root, chordType, cagedForm, dots, minFret, maxFret, isOpen };
}

const DEFAULT_SETTINGS = loadSettings();
const INITIAL_CHORD = generateChord(DEFAULT_SETTINGS);

const DEFAULT_TYPES = CHORD_TYPES.filter(ct => ct.defaultEnabled);
const OPTIONAL_TYPES = CHORD_TYPES.filter(ct => !ct.defaultEnabled);

export default function ArpeggioPracticePage() {
  const [settings, setSettings] = useState<ArpeggioSettings>(DEFAULT_SETTINGS);
  const [chord, setChord] = useState<RenderedChord | null>(INITIAL_CHORD);
  const [revealed, setRevealed] = useState(false);
  const [optionalExpanded, setOptionalExpanded] = useState(false);

  function updateSettings(next: ArpeggioSettings) {
    setSettings(next);
    saveSettings(next);
  }

  function toggleChordType(id: string) {
    const next = new Set(settings.enabledChordTypeIds);
    if (next.has(id)) {
      if (next.size <= 1) return;
      next.delete(id);
    } else {
      next.add(id);
    }
    updateSettings({ ...settings, enabledChordTypeIds: next });
  }

  function toggleCAGEDForm(form: CAGEDForm) {
    const next = new Set(settings.enabledCAGEDForms);
    if (next.has(form)) {
      if (next.size <= 1) return;
      next.delete(form);
    } else {
      next.add(form);
    }
    updateSettings({ ...settings, enabledCAGEDForms: next });
  }

  function toggleRevealDiagrams() {
    updateSettings({ ...settings, revealDiagrams: !settings.revealDiagrams });
  }

  const advance = useCallback(() => {
    setChord(generateChord(settings));
    setRevealed(false);
  }, [settings]);

  const isRevealed = settings.revealDiagrams || revealed;

  return (
    <div className="arpeggio-page">
      <header className="app__header">
        <h1 className="app__title">Arpeggio Practice</h1>
        <span className="app__subtitle">CAGED System Trainer</span>
      </header>

      <Metronome />

      {/* Settings panel */}
      <div className="control-panel">
        <div className="control-panel__row">
          {/* Reveal Diagrams toggle */}
          <div className="control-panel__group">
            <label className="control-panel__label" htmlFor="arp-reveal-toggle">Reveal Diagrams</label>
            <label className="toggle" aria-label="Reveal chord diagrams">
              <input
                id="arp-reveal-toggle"
                type="checkbox"
                checked={settings.revealDiagrams}
                onChange={toggleRevealDiagrams}
              />
              <span className="toggle__track" />
            </label>
          </div>
        </div>

        {/* Chord types */}
        <div className="control-panel__chord-types">
          <label className="control-panel__label">Chord Types</label>
          <div className="pill-group">
            {DEFAULT_TYPES.map(ct => (
              <button
                key={ct.id}
                className={`pill ${settings.enabledChordTypeIds.has(ct.id) ? 'pill--active' : ''}`}
                onClick={() => toggleChordType(ct.id)}
                aria-pressed={settings.enabledChordTypeIds.has(ct.id)}
              >
                {ct.label}
              </button>
            ))}
            <button
              className="pill pill--expand"
              onClick={() => setOptionalExpanded(e => !e)}
              aria-expanded={optionalExpanded}
            >
              {optionalExpanded ? 'Less ▲' : 'More ▼'}
            </button>
          </div>
          {optionalExpanded && (
            <div className="pill-group pill-group--optional">
              {OPTIONAL_TYPES.map(ct => (
                <button
                  key={ct.id}
                  className={`pill ${settings.enabledChordTypeIds.has(ct.id) ? 'pill--active' : ''}`}
                  onClick={() => toggleChordType(ct.id)}
                  aria-pressed={settings.enabledChordTypeIds.has(ct.id)}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CAGED forms */}
        <div className="control-panel__chord-types">
          <label className="control-panel__label">Chord Forms</label>
          <div className="pill-group">
            {CAGED_FORMS.map(form => (
              <button
                key={form}
                className={`pill pill--form ${settings.enabledCAGEDForms.has(form) ? 'pill--active' : ''}`}
                onClick={() => toggleCAGEDForm(form)}
                aria-pressed={settings.enabledCAGEDForms.has(form)}
              >
                {form}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Single chord card */}
      <div className="arpeggio-page__card-area">
        {chord ? (
          <ChordCard
            chord={chord}
            isRevealed={isRevealed}
            onReveal={() => setRevealed(true)}
            isActive={false}
            isDimmed={false}
          />
        ) : (
          <p className="arpeggio-page__empty">No chord types selected.</p>
        )}
      </div>

      <div className="app__advance">
        <button className="btn btn--advance" onClick={advance}>
          Next Chord →
        </button>
      </div>

      <footer className="app__footer">
        {chord && <IntervalLegend chords={[chord]} />}
      </footer>
    </div>
  );
}
