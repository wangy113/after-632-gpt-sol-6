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
} as const;

export type RoomDate = '632' | '661';
