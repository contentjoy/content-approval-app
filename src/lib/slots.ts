export const SLOT_NAMES = [
  'Photos',
  'Videos',
  'Facility Photos',
  'Facility Videos',
] as const;

export type SlotName = typeof SLOT_NAMES[number];
