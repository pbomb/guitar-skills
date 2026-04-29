import { useState } from 'react';
import type { AppSettings, CAGEDForm } from '../../types';
import { CHORD_TYPES } from '../../data/chordFormulas';
import { CAGED_FORMS } from '../../data/cagedShapes';
import './ControlPanel.css';

interface ControlPanelProps {
  settings: AppSettings;
  onSettingsChange: (next: AppSettings) => void;
  onNewRound: () => void;
}

const DEFAULT_TYPES = CHORD_TYPES.filter(ct => ct.defaultEnabled);
const OPTIONAL_TYPES = CHORD_TYPES.filter(ct => !ct.defaultEnabled);

export default function ControlPanel({ settings, onSettingsChange, onNewRound }: ControlPanelProps) {
  const [optionalExpanded, setOptionalExpanded] = useState(false);

  function setNumChords(n: 2 | 3 | 4) {
    onSettingsChange({ ...settings, numChords: n });
  }

  function toggleRevealDiagrams() {
    onSettingsChange({ ...settings, revealDiagrams: !settings.revealDiagrams });
  }

  function toggleChordType(id: string) {
    const next = new Set(settings.enabledChordTypeIds);
    if (next.has(id)) {
      if (next.size <= 1) return;
      next.delete(id);
    } else {
      next.add(id);
    }
    onSettingsChange({ ...settings, enabledChordTypeIds: next });
  }

  function toggleCAGEDForm(form: CAGEDForm) {
    const next = new Set(settings.enabledCAGEDForms);
    if (next.has(form)) {
      if (next.size <= 1) return;
      next.delete(form);
    } else {
      next.add(form);
    }
    onSettingsChange({ ...settings, enabledCAGEDForms: next });
  }

  return (
    <div className="control-panel">
      <div className="control-panel__row">
        {/* Chord count */}
        <div className="control-panel__group">
          <label className="control-panel__label">Chords</label>
          <div className="btn-group">
            {([2, 3, 4] as const).map(n => (
              <button
                key={n}
                className={`btn btn--count ${settings.numChords === n ? 'btn--active' : ''}`}
                onClick={() => setNumChords(n)}
                aria-pressed={settings.numChords === n}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Reveal Diagrams toggle */}
        <div className="control-panel__group">
          <label className="control-panel__label" htmlFor="reveal-toggle">Reveal Diagrams</label>
          <label className="toggle" aria-label="Reveal chord diagrams">
            <input
              id="reveal-toggle"
              type="checkbox"
              checked={settings.revealDiagrams}
              onChange={toggleRevealDiagrams}
            />
            <span className="toggle__track" />
          </label>
        </div>

        {/* New round */}
        <button className="btn btn--primary" onClick={onNewRound}>
          New Round
        </button>
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

      {/* Chord forms */}
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
  );
}
