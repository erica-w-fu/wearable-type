import { ringImageUrl, type RingSide } from './ringImages';

export type ImageLoadPriority = {
  loading: 'eager' | 'lazy';
  fetchPriority: 'high' | 'low' | 'auto';
};

/** First row(s) in the alphabet grid load eagerly; the rest lazy. */
export function gridImagePriority(
  index: number,
  columns: number,
  rowsAboveFold = 2,
): ImageLoadPriority {
  const aboveFoldCount = columns * rowsAboveFold;
  if (index >= aboveFoldCount) {
    return { loading: 'lazy', fetchPriority: 'low' };
  }
  if (index < columns) {
    return { loading: 'eager', fetchPriority: 'high' };
  }
  return { loading: 'eager', fetchPriority: 'auto' };
}

export function posedImagePriority(index: number, columns: number): ImageLoadPriority {
  if (index >= columns) {
    return { loading: 'lazy', fetchPriority: 'low' };
  }
  return {
    loading: 'eager',
    fetchPriority: index === 0 ? 'high' : 'auto',
  };
}

const prefetched = new Set<string>();

export function prefetchRingSides(
  letter: string,
  sides: RingSide[] = ['face', 'ccw', 'cw'],
) {
  const normalized = letter.toUpperCase();
  for (const side of sides) {
    const url = ringImageUrl(normalized, side);
    if (!url || prefetched.has(url)) continue;
    prefetched.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}

/** Prefetch and wait until ring sides are decoded (for demo / above-fold tiles). */
export function loadRingSides(
  letter: string,
  sides: RingSide[] = ['face', 'ccw', 'cw'],
): Promise<void> {
  const normalized = letter.toUpperCase();
  const loads = sides.map((side) => {
    const url = ringImageUrl(normalized, side);
    if (!url) return Promise.resolve();
    prefetchRingSides(normalized, [side]);
    return new Promise<void>((resolve) => {
      const img = new Image();
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      img.decoding = 'async';
      img.src = url;
    });
  });
  return Promise.all(loads).then(() => undefined);
}
