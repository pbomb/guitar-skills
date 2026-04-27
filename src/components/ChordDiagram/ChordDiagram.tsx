import type { FretDot } from '../../types';
import { INTERVAL_COLORS } from '../../data/notes';
import './ChordDiagram.css';

interface ChordDiagramProps {
  dots: FretDot[];
  minFret: number;
  maxFret: number;
  isOpen: boolean;
}

const STRING_SPACING = 30;
const FRET_SPACING = 38;
const FRETS_SHOWN = 5;
const DOT_RADIUS = 12;
const PAD_TOP = 44;   // space above nut for open/muted markers + fret label
const PAD_LEFT = 28;
const PAD_RIGHT = 16;
const PAD_BOTTOM = 12;

const NUM_STRINGS = 6;
const GRID_WIDTH = (NUM_STRINGS - 1) * STRING_SPACING;
const GRID_HEIGHT = FRETS_SHOWN * FRET_SPACING;
const SVG_WIDTH = PAD_LEFT + GRID_WIDTH + PAD_RIGHT;
const SVG_HEIGHT = PAD_TOP + GRID_HEIGHT + PAD_BOTTOM;

// String 6 (low E) is leftmost; string 1 (high E) rightmost
function stringX(stringNum: number): number {
  return PAD_LEFT + (6 - stringNum) * STRING_SPACING;
}

function fretY(fretWithinWindow: number): number {
  // fretWithinWindow: 0 = nut line, 1..5 = fret lines
  return PAD_TOP + fretWithinWindow * FRET_SPACING;
}

// Dot center: between fret lines n-1 and n (1-indexed within window)
function dotCY(absoluteFret: number, windowMin: number): number {
  const row = absoluteFret - windowMin + 1; // 1..5
  return PAD_TOP + (row - 0.5) * FRET_SPACING;
}

function getTextColor(): string {
  return '#000000';
}

function detectBarre(dots: FretDot[], windowMin: number): { fret: number; strings: number[] } | null {
  if (windowMin < 1) return null;
  const atMin = dots.filter(d => !d.muted && d.fret === windowMin);
  if (atMin.length < 2) return null;
  const strings = atMin.map(d => d.stringNum).sort((a, b) => b - a); // high to low (left to right)
  return { fret: windowMin, strings };
}

export default function ChordDiagram({ dots, minFret, maxFret: _maxFret, isOpen }: ChordDiagramProps) {
  const showNut = isOpen || minFret <= 1;
  const windowMin = showNut ? 0 : minFret - 1;
  const barre = detectBarre(dots, minFret);

  return (
    <div className="chord-diagram">
      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        aria-label="Chord diagram"
      >
        {/* Fret position label */}
        {!showNut && (
          <text
            x={PAD_LEFT - 6}
            y={PAD_TOP + FRET_SPACING * 0.5}
            textAnchor="end"
            dominantBaseline="middle"
            className="fret-label"
          >
            {minFret}fr
          </text>
        )}

        {/* Nut or top line */}
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP}
          x2={PAD_LEFT + GRID_WIDTH}
          y2={PAD_TOP}
          className={showNut ? 'nut-line' : 'fret-line'}
        />

        {/* Fret lines */}
        {Array.from({ length: FRETS_SHOWN }, (_, i) => (
          <line
            key={i}
            x1={PAD_LEFT}
            y1={fretY(i + 1)}
            x2={PAD_LEFT + GRID_WIDTH}
            y2={fretY(i + 1)}
            className="fret-line"
          />
        ))}

        {/* String lines */}
        {Array.from({ length: NUM_STRINGS }, (_, i) => {
          const sNum = 6 - i;
          return (
            <line
              key={sNum}
              x1={stringX(sNum)}
              y1={PAD_TOP}
              x2={stringX(sNum)}
              y2={PAD_TOP + GRID_HEIGHT}
              className="string-line"
            />
          );
        })}

        {/* Muted / open string markers */}
        {dots.map(dot => {
          const x = stringX(dot.stringNum);
          const y = PAD_TOP - 14;
          if (dot.muted) {
            return (
              <text key={`m-${dot.stringNum}`} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="mute-marker">
                ✕
              </text>
            );
          }
          if (dot.fret === 0) {
            return (
              <circle key={`o-${dot.stringNum}`} cx={x} cy={y} r={6} className="open-marker" />
            );
          }
          return null;
        })}

        {/* Barre bar */}
        {barre && barre.strings.length >= 2 && (
          <rect
            x={stringX(barre.strings[0]) - DOT_RADIUS}
            y={dotCY(barre.fret, windowMin) - DOT_RADIUS}
            width={stringX(barre.strings[barre.strings.length - 1]) - stringX(barre.strings[0]) + DOT_RADIUS * 2}
            height={DOT_RADIUS * 2}
            rx={DOT_RADIUS}
            className="barre-bar"
          />
        )}

        {/* Fret dots */}
        {dots.filter(d => !d.muted && d.fret > 0).map(dot => {
          const cx = stringX(dot.stringNum);
          const cy = dotCY(dot.fret, windowMin);
          const color = INTERVAL_COLORS[dot.interval] ?? '#555';
          return (
            <g key={`dot-${dot.stringNum}`}>
              <circle cx={cx} cy={cy} r={DOT_RADIUS} fill={color} />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={getTextColor()}
                className="dot-label"
              >
                {dot.interval}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
