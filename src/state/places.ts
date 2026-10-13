export const PLACE_IDS = ['doorway', 'head', 'pegs', 'yard'] as const;
export type PlaceId = typeof PLACE_IDS[number];

export const PLACE_LABELS: Record<PlaceId, string> = {
  doorway: 'Doorway',
  head: 'Head of room',
  pegs: 'By the pegs',
  yard: 'Yard looking back',
};

export const PLACE_ORIENTATIONS: Record<PlaceId, string> = {
  doorway: 'At the doorway, facing into the room. Turn around to see the yard and well.',
  head: 'At the head of the room, facing the doorway and yard.',
  pegs: 'By the door pegs and hooks, facing the right wall.',
  yard: 'In the yard, looking back at the room. The well and palm are to either side.',
};
