import type { IntervalToken, RenderedChord } from '../../types';
import { INTERVAL_COLORS } from '../../data/notes';
import './IntervalLegend.css';

interface IntervalLegendProps {
  chords: RenderedChord[];
}

const INTERVAL_ORDER: IntervalToken[] = [
  '1', 'b2', '2', 'b3', '3', '4', 'b5', '5', '#5', 'b6', '6', 'bb7', 'b7', '7', '9',
];

export default function IntervalLegend({ chords }: IntervalLegendProps) {
  const present = new Set<IntervalToken>();
  for (const chord of chords) {
    for (const dot of chord.dots) {
      if (!dot.muted) present.add(dot.interval);
    }
  }

  const toShow = INTERVAL_ORDER.filter(i => present.has(i));
  if (toShow.length === 0) return null;

  return (
    <div className="interval-legend">
      <span className="interval-legend__title">Intervals</span>
      <div className="interval-legend__items">
        {toShow.map(interval => (
          <div key={interval} className="interval-legend__item">
            <span
              className="interval-legend__swatch"
              style={{ background: INTERVAL_COLORS[interval] }}
            />
            <span className="interval-legend__label">{interval}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
