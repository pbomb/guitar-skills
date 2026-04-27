# Guitar Skills

Webpages to learn and practice guitar exercises.

## Chord Practice Tool

A React + TypeScript SPA for practicing chord identification and CAGED-system voicings, deployed via GitHub Pages.

### Features

- Randomly generates 2–4 chords (configurable) from 12 root notes × 15 chord types
- CAGED form shapes (E/A/D/C/G) with fret-accurate SVG chord diagrams
- Color-coded interval dots with labels (root=1, b3, 5, b7, etc.)
- Chord type pill toggles — 5 defaults (Major, Minor, 7, Maj7, Min7) + 10 optional extras
- Optional CAGED form badge per chord; individual and reveal-all buttons
- Settings persisted to localStorage

### Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

Deploys automatically to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`.
Requires **Settings → Pages → Source → GitHub Actions** to be enabled in the repository.
