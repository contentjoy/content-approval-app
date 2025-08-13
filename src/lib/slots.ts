export const SLOT_NAMES = [
  'Photos',
  'Videos',
  'Facility Videos',
  'Facility Video',
] as const;

export type SlotName = typeof SLOT_NAMES[number];
