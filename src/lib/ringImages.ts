export const RING_SIDES = ['face', 'ccw', 'cw'] as const;
export type RingSide = (typeof RING_SIDES)[number];

const IMAGE_EXT = '.jpg';

export function ringImageUrl(letter: string, side: RingSide = 'face'): string | null {
  const normalized = letter.toUpperCase();
  if (!/^[A-Z]$/.test(normalized)) return null;
  return `${import.meta.env.BASE_URL}lettersToned/${normalized}/${side}${IMAGE_EXT}`;
}

export function ringSideAtIndex(index: number): RingSide {
  const i = ((index % 3) + 3) % 3;
  return RING_SIDES[i]!;
}
