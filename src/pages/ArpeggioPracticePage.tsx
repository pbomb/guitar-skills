import { useMemo, useState } from 'react';
import type { CAGEDForm, RenderedChord } from '../types';
import { CHORD_TYPES } from '../data/chordFormulas';
import { CAGED_FORMS } from '../data/cagedShapes';
import { CHROMATIC_NOTES } from '../data/notes';
import { buildDiagram } from '../logic/diagramBuilder';
import {
  getSubShapeOptions,
  buildFilteredChord,
  INVERSION_LABELS,
} from '../logic/arpeggioSubShapes';
import type { ArpeggioNoteCount, InversionLabel, SubShapeVariant } from '../logic/arpeggioSubShapes';
import ChordCard from '../components/ChordCard/ChordCard';
import Metronome from '../components/Metronome/Metronome';
import IntervalLegend from '../components/IntervalLegend/IntervalLegend';
import './ArpeggioPracticePage.css';

const STORAGE_KEY = 'guitarSkillsArpeggioSettings';

interface ArpeggioSettings {
  enabledChordTypeIds: Set<string>;
  enabledCAGEDForms: Set<CAGEDForm>;
  revealDiagrams: boolean;
  noteCount: ArpeggioNoteCount;
  prefInversion: InversionLabel;
  prefVariant: SubShapeVariant;
}

function loadSettings(): ArpeggioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const storedForms = p.enabledCAGEDForms;
      return {
        enabledChordTypeIds: new Set(p.enabledChordTypeIds ?? []),
        enabledCAGEDForms: new Set(
          Array.isArray(storedForms) && storedForms.length > 0 ? storedForms : CAGED_FORMS,
        ),
        revealDiagrams: p.revealDiagrams ?? false,
        noteCount: p.noteCount ?? 'full',
        prefInversion: p.prefInversion ?? 'root',
        prefVariant: p.prefVariant ?? 'low',
      };
    }
  } catch {
    // ignore
  }
  return {
    enabledChordTypeIds: new Set(CHORD_TYPES.filter(ct => ct.defaultEnabled).map(ct => ct.id)),
    enabledCAGEDForms: new Set(CAGED_FORMS),
    revealDiagrams: false,
    noteCount: 'full',
    prefInversion: 'root',
    prefVariant: 'low',
  };
}

function saveSettings(s: ArpeggioSettings) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      enabledChordTypeIds: [...s.enabledChordTypeIds],
      enabledCAGEDForms: [...s.enabledCAGEDForms],
      revealDiagrams: s.revealDiagrams,
      noteCount: s.noteCount,
      prefInversion: s.prefInversion,
      prefVariant: s.prefVariant,
    }),
  );
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateChord(settings: ArpeggioSettings): RenderedChord | null {
  const enabledTypes = CHORD_TYPES.filter(ct => settings.enabledChordTypeIds.has(ct.id));
  if (enabledTypes.length === 0) return null;
  const forms = CAGED_FORMS.filter(f => settings.enabledCAGEDForms.has(f));
  const cagedForm = pick(forms.length > 0 ? forms : CAGED_FORMS);
  const root = pick(CHROMATIC_NOTES);
  const chordType = pick(enabledTypes);
  const { dots, minFret, maxFret, isOpen } = buildDiagram(root, chordType, cagedForm);
  return { root, chordType, cagedForm, dots, minFret, maxFret, isOpen };
}

const INITIAL_SETTINGS = loadSettings();

const DEFAULT_TYPES = CHORD_TYPES.filter(ct => ct.defaultEnabled);
const OPTIONAL_TYPES = CHORD_TYPES.filter(ct => !ct.defaultEnabled);

export default function ArpeggioPracticePage() {
  const [settings, setSettings] = useState<ArpeggioSettings>(INITIAL_SETTINGS);
  const [chord, setChord] = useState<RenderedChord | null>(() => generateChord(INITIAL_SETTINGS));
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

  function advance() {
    setChord(generateChord(settings));
    setRevealed(false);
  }

  // Compute available sub-shape options for the current chord + noteCount
  const subShapeOptions = useMemo(() => {
    if (!chord || settings.noteCount === 'full') return [];
    return getSubShapeOptions(chord, settings.noteCount === '3-note' ? 3 : 4);
  }, [chord, settings.noteCount]);

  // Resolve the active sub-shape (use preferred inversion/variant, falling back to first available)
  const activeSubShape = useMemo(() => {
    if (settings.noteCount === 'full' || subShapeOptions.length === 0) return null;
    const preferred = subShapeOptions.find(
      o =>
        o.inversion === settings.prefInversion &&
        (o.variant === null || o.variant === settings.prefVariant),
    );
    return preferred ?? subShapeOptions[0];
  }, [subShapeOptions, settings.noteCount, settings.prefInversion, settings.prefVariant]);

  // Build the chord to display (filtered to sub-shape strings, or full)
  const displayChord = useMemo(() => {
    if (!chord || !activeSubShape) return chord;
    return buildFilteredChord(chord, activeSubShape.stringNums);
  }, [chord, activeSubShape]);

  // Unique inversions available (for rendering the inversion selector)
  const availableInversions = useMemo(
    () => [...new Set(subShapeOptions.map(o => o.inversion))],
    [subShapeOptions],
  );

  // Does the active inversion have Low / High variants?
  const hasVariants =
    activeSubShape !== null &&
    subShapeOptions.filter(o => o.inversion === activeSubShape.inversion).length > 1;

  const isRevealed = settings.revealDiagrams || revealed;

  return (
    <div className="arpeggio-page">
      <header className="app__header">
        <h1 className="app__title">Arpeggio Practice</h1>
        <span className="app__subtitle">CAGED System Trainer</span>
      </header>

      <Metronome />

      {/* ── Settings panel ── */}
      <div className="control-panel">
        {/* Row 1: Reveal toggle */}
        <div className="control-panel__row">
          <div className="control-panel__group">
            <label className="control-panel__label" htmlFor="arp-reveal-toggle">
              Reveal Diagrams
            </label>
            <label className="toggle" aria-label="Reveal chord diagrams">
              <input
                id="arp-reveal-toggle"
                type="checkbox"
                checked={settings.revealDiagrams}
                onChange={() =>
                  updateSettings({ ...settings, revealDiagrams: !settings.revealDiagrams })
                }
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

        {/* ── Arpeggio form selector ── */}
        <div className="control-panel__chord-types">
          <label className="control-panel__label">Arpeggio Form</label>
          <div className="btn-group">
            {(['full', '4-note', '3-note'] as ArpeggioNoteCount[]).map(nc => (
              <button
                key={nc}
                className={`btn btn--count ${settings.noteCount === nc ? 'btn--active' : ''}`}
                onClick={() => updateSettings({ ...settings, noteCount: nc })}
                aria-pressed={settings.noteCount === nc}
              >
                {nc === 'full' ? 'Full' : nc}
              </button>
            ))}
          </div>
        </div>

        {/* ── Inversion selector (shown only when not Full) ── */}
        {settings.noteCount !== 'full' && (
          <div className="control-panel__chord-types arpeggio-page__inversion-row">
            <label className="control-panel__label">Inversion</label>
            {subShapeOptions.length === 0 ? (
              <span className="arpeggio-page__no-shapes">
                No sub-shapes available for this chord
              </span>
            ) : (
              <div className="pill-group">
                {availableInversions.map(inv => (
                  <button
                    key={inv}
                    className={`pill ${activeSubShape?.inversion === inv ? 'pill--active' : ''}`}
                    onClick={() => updateSettings({ ...settings, prefInversion: inv })}
                    aria-pressed={activeSubShape?.inversion === inv}
                  >
                    {INVERSION_LABELS[inv]}
                  </button>
                ))}
              </div>
            )}

            {/* Low / High variant selector */}
            {hasVariants && activeSubShape && (
              <div className="btn-group arpeggio-page__variant-group">
                {(['low', 'high'] as SubShapeVariant[]).map(v => (
                  <button
                    key={v}
                    className={`btn btn--count ${
                      activeSubShape.variant === v ? 'btn--active' : ''
                    }`}
                    onClick={() => updateSettings({ ...settings, prefVariant: v })}
                    aria-pressed={activeSubShape.variant === v}
                  >
                    {v === 'low' ? 'Low' : 'High'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Single chord card ── */}
      <div className="arpeggio-page__card-area">
        {displayChord ? (
          <ChordCard
            chord={displayChord}
            isRevealed={isRevealed}
            onReveal={() => setRevealed(true)}
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
        {displayChord && <IntervalLegend chords={[displayChord]} />}
      </footer>
    </div>
  );
}
