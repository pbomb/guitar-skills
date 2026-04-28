# Guitar Skills — CLAUDE.md

## App purpose

A guitar chord practice SPA. The user plays along to the metronome, switching between two chords shown on screen. After each chord has been the active (highlighted) chord for 4 measures, the carousel advances: the older chord is retired, the other chord shifts to position 1, and a fresh chord enters at position 2.

Deployed to GitHub Pages at `/guitar-skills/` via `.github/workflows/deploy.yml` (push to `main` triggers build + deploy).

---

## Architecture at a glance

```
App.tsx
├── <Metronome onBeat onStop />       # Web Audio clock; fires onBeat callback each beat
├── <ControlPanel />                  # Chord-type toggles, CAGED toggle, New Round
├── .carousel                         # 4 ChordCards: [prev, slot1, slot2, next]
│   └── <ChordCard isDimmed/isActive/animationClass />
└── <IntervalLegend chords=[slot1,slot2] />

hooks/useChordCycler.ts               # All beat counting + carousel cycling state
logic/chordGenerator.ts               # generateChords / generateOneChord
logic/diagramBuilder.ts               # CAGED shape → FretDot array
data/cagedShapes.ts                   # 15 chord types × 5 CAGED forms, hand-tuned fretOffsets
data/notes.ts                         # Semitone tables, getRootFret, INTERVAL_COLORS
data/chordFormulas.ts                 # 15 ChordType definitions (id, label, intervals[])
types/index.ts                        # All shared TypeScript types
```

---

## Data flow

```
AppSettings (numChords, enabledChordTypeIds, showCAGED)
    │
    ▼
generateChords({ ...settings, numChords: 4 })   ← always 4 for carousel
    │
    ▼
carouselChords[4]   index: 0=prev(dimmed)  1=slot1  2=slot2  3=next(dimmed)
    │
    ├── isPlaying && activeSlot === 1  →  ChordCard[1] isActive
    ├── isPlaying && activeSlot === 2  →  ChordCard[2] isActive
    │
    └── after 8 measures: advance carousel
            ├── slide animation (CSS translateX on 5-card track)
            ├── commitCycle(): [slot1, slot2, next, newChord]
            └── activeSlot resets to 1
```

---

## Metronome timing

`Metronome.tsx` uses the Web Audio API lookahead scheduler pattern:
- Scheduler runs every `SCHEDULER_INTERVAL = 25ms`
- Schedules beats up to `SCHEDULE_AHEAD = 0.1s` ahead using `AudioContext.currentTime`
- A `setTimeout(delay)` per beat fires `onBeat()` and flashes the visual dot at the right wall-clock moment
- `onBeat` and `onStop` callbacks are read through refs (`onBeatRef`, `onStopRef`) so the scheduler's stable `useCallback` closure never goes stale

**Never put beat-counting state in React state** — every beat would cause a re-render. All counters live in refs inside `useChordCycler`.

---

## Carousel state invariants (`useChordCycler.ts`)

- `carouselChords` always has exactly **4 elements**: `[prev, slot1, slot2, next]`
- `activeSlot` is `1` or `2` (which of the two practice chords is highlighted), or `null` when stopped
- Active chord alternates every measure: slot1 → slot2 → slot1 → ... (measureCount % 2)
- Advance triggers after **8 measures** (= 4 plays per slot in 2-slot alternation)
- `isCyclingRef` guards against a second cycle firing during the 380ms CSS animation
- On stop/new-round: all refs reset, `cyclePhase` snaps to `'idle'` (CSS animation aborted)

### Carousel advance animation sequence
1. `setCyclePhase('cycling')` + `setIncomingChord(newChord)` → renders 5-card track
2. `useEffect` in App reads card width via `getBoundingClientRect`, then sets `translateX(-(w+gap))` in a `requestAnimationFrame`
3. CSS `transition: transform 380ms` runs
4. `onTransitionEnd` fires `commitCycle()`: state becomes `[slot1, slot2, next, incoming]`, phase → `'idle'`

---

## CAGED system & shape data

Each chord shape is stored as an array of `ShapeEntry` relative to the **root fret** on the **anchor string**:
- `fretOffset` = absolute_fret − rootFret (can be negative for shapes that extend below the root)
- `interval: null` = muted string
- Anchor strings: `E→str6, A→str5, D→str4, C→str5, G→str6`

`getRootFret(root, stringNum)` returns the fret where a given root note falls on a given string: `(rootSemitone − openSemitone + 12) % 12`.

`buildDiagram` applies the template:
1. Compute `rawFrets = rootFret + fretOffset` for each string
2. If any played string has a negative fret, shift **all** strings +12 (whole shape up an octave)
3. Build `FretDot[]` and compute `minFret`/`maxFret` for the SVG viewport

---

## SVG chord diagram

`ChordDiagram.tsx` renders a fixed-size SVG (no dynamic sizing):
- 6 strings (str6=low E on left, str1=high E on right), 5 fret slots shown
- `windowMin = showNut ? 0 : minFret − 1` — the top of the displayed window
- Dot Y position: `PAD_TOP + (absoluteFret − windowMin − 0.5) × FRET_SPACING`
  (the `−0.5` centers the dot in the slot between fret lines)
- Barre detected when ≥2 dots share the same fret at `windowMin`
- Color per dot comes from `INTERVAL_COLORS` (chromatic spectrum, 12 colors by semitone)

---

## Settings persistence

`AppSettings` is saved to `localStorage` key `'guitarSkillsSettings'` on every change. `enabledChordTypeIds` is a `Set<string>` but serialized as an array.

`numChords` is stored in settings for the ControlPanel UI but the carousel always overrides it to `4` when generating chords — the two active practice chords are always indices 1 and 2.

---

## Key files quick-reference

| Path | Purpose |
|------|---------|
| `src/hooks/useChordCycler.ts` | Beat counting, measure cycling, carousel state |
| `src/components/Metronome/Metronome.tsx` | Web Audio lookahead scheduler |
| `src/logic/diagramBuilder.ts` | Converts CAGED shape template → FretDot[] |
| `src/data/cagedShapes.ts` | 15 chord types × 5 CAGED forms (hand-tuned) |
| `src/data/notes.ts` | Semitone math, open string tuning, interval colors |
| `src/data/chordFormulas.ts` | Chord type definitions (interval arrays) |
| `src/logic/chordGenerator.ts` | Random chord generation with dedup |
| `src/components/ChordDiagram/ChordDiagram.tsx` | SVG fretboard renderer |
| `src/types/index.ts` | All shared types |
| `vite.config.ts` | `base: '/guitar-skills/'` required for GitHub Pages |
