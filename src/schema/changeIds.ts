/** Shared IDs keep scene objects and source-backed labels in sync. */
export const ABSENT_632_IDS = {
  matsAndCups: 'mats-and-cups',
  emptyHead: 'empty-head',
  footprints: 'footprints',
} as const;

export const ADDED_661_IDS = {
  facingSeat: 'facing-seat',
  sealedLetter: 'sealed-letter',
  coin661: 'coin-661',
  emptyPegs: 'empty-pegs',
  travelThings: 'travel-things',
} as const;

export const MISSING_680_IDS = {
  cleanPatch: 'clean-patch',
  emptyHook: 'empty-hook',
  tallerPalm: 'taller-palm',
} as const;

export type RoomDate = '632' | '661' | '680';
