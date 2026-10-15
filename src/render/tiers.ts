/** Explicit rendering previews. Automatic device selection is not implemented yet. */
export const renderTiers = {
  baseline: { maxPixelRatio: 1.5 },
  low: { maxPixelRatio: 1 },
} as const;

export type RenderTier = keyof typeof renderTiers;

export function renderTierFromSearch(search: string): RenderTier {
  return new URLSearchParams(search).get('tier') === 'low' ? 'low' : 'baseline';
}
