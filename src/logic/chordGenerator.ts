import type { AppSettings, CAGEDForm, RenderedChord } from '../types';
import { CHROMATIC_NOTES } from '../data/notes';
import { CHORD_TYPES } from '../data/chordFormulas';
import { CAGED_FORMS } from '../data/cagedShapes';
import { buildDiagram } from './diagramBuilder';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickForm(settings: AppSettings): CAGEDForm {
  const forms = CAGED_FORMS.filter(f => settings.enabledCAGEDForms.has(f));
  return pick(forms.length > 0 ? forms : CAGED_FORMS);
}

export function generateOneChord(
  settings: AppSettings,
  excludeKeys: Set<string>,
): RenderedChord | null {
  const enabledTypes = CHORD_TYPES.filter(ct => settings.enabledChordTypeIds.has(ct.id));
  if (enabledTypes.length === 0) return null;
  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    const root = pick(CHROMATIC_NOTES);
    const chordType = pick(enabledTypes);
    const key = `${root}-${chordType.id}`;
    if (excludeKeys.has(key)) continue;
    const cagedForm: CAGEDForm = pickForm(settings);
    const { dots, minFret, maxFret, isOpen } = buildDiagram(root, chordType, cagedForm);
    return { root, chordType, cagedForm, dots, minFret, maxFret, isOpen };
  }
  return null;
}

export function generateChords(settings: AppSettings): RenderedChord[] {
  const enabledTypes = CHORD_TYPES.filter(ct => settings.enabledChordTypeIds.has(ct.id));
  if (enabledTypes.length === 0) return [];

  const results: RenderedChord[] = [];
  const usedKeys = new Set<string>();

  let attempts = 0;
  while (results.length < settings.numChords && attempts < 200) {
    attempts++;
    const root = pick(CHROMATIC_NOTES);
    const chordType = pick(enabledTypes);
    const key = `${root}-${chordType.id}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);

    const cagedForm: CAGEDForm = pickForm(settings);
    const { dots, minFret, maxFret, isOpen } = buildDiagram(root, chordType, cagedForm);

    results.push({ root, chordType, cagedForm, dots, minFret, maxFret, isOpen });
  }

  return results;
}
