import { useState } from 'react';
import type { AppSettings } from '../../types';
import { CHORD_TYPES } from '../../data/chordFormulas';
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

  function toggleCAGED() {
    onSettingsChange({ ...settings, showCAGED: !settings.showCAGED });
  }

  function toggleChordType(id: string) {
    const next = new Set(settings.enabledChordTypeIds);
    if (next.has(id)) {
      // Don't allow deselecting the last type
      if (next.size <= 1) return;
      next.delete(id);
    } else {
      next.add(id);
    }
    onSettingsChange({ ...settings, enabledChordTypeIds: next });
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

        {/* CAGED toggle */}
        <div className="control-panel__group">
          <label className="control-panel__label" htmlFor="caged-toggle">Show CAGED Form</label>
          <label className="toggle" aria-label="Show CAGED form">
            <input
              id="caged-toggle"
              type="checkbox"
              checked={settings.showCAGED}
              onChange={toggleCAGED}
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
    </div>
  );
}
