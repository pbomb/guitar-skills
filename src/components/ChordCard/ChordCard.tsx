import type { RenderedChord } from '../../types';
import ChordDiagram from '../ChordDiagram/ChordDiagram';
import './ChordCard.css';

interface ChordCardProps {
  chord: RenderedChord;
  isRevealed: boolean;
  onReveal: () => void;
  isActive?: boolean;
  animationClass?: string;
}

export default function ChordCard({ chord, isRevealed, onReveal, isActive, animationClass }: ChordCardProps) {
  const chordName = `${chord.root} ${chord.chordType.label}`;
  const classes = ['chord-card', isActive ? 'chord-card--active' : '', animationClass ?? '']
    .filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="chord-card__header">
        <h2 className="chord-card__name">{chordName}</h2>
        {chord.cagedForm && (
          <span className="chord-card__form-badge">{chord.cagedForm} Shape</span>
        )}
      </div>

      <div className="chord-card__body">
        {isRevealed ? (
          <ChordDiagram
            dots={chord.dots}
            minFret={chord.minFret}
            maxFret={chord.maxFret}
            isOpen={chord.isOpen}
          />
        ) : (
          <div className="chord-card__placeholder">
            <button className="btn btn--reveal" onClick={onReveal} aria-label={`Reveal diagram for ${chordName}`}>
              Reveal Diagram
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
