import type { RingSide } from './ringImages';

/** Horizontal strips within a grid tile (pointer X while dragging). */
export type GridDragStrip = 'left' | 'mid' | 'right';

/** Left/right strips → `cw.jpg` / `ccw.jpg` while dragging (`mid` → face). */
export function stripToImageSide(strip: GridDragStrip): RingSide {
  switch (strip) {
    case 'left':
      return 'cw';
    case 'right':
      return 'ccw';
    default:
      return 'face';
  }
}

/** Strip → tilt cue (`data-grid-zone`): left = −Y / right = +Y. */
export function stripToTiltZone(strip: GridDragStrip): RingSide {
  switch (strip) {
    case 'left':
      return 'ccw';
    case 'right':
      return 'cw';
    default:
      return 'face';
  }
}

/** Outer fraction of tile width (each side) that shows cw/ccw while dragging. */
export const GRID_EDGE_STRIP_RATIO = 0.4;
/** Wider edge zones on narrow viewports — less horizontal drag to turn. */
export const GRID_EDGE_STRIP_RATIO_MOBILE = 0.48;

export function horizontalStrip(
  clientX: number,
  rect: DOMRectReadOnly,
  edgeRatio: number = GRID_EDGE_STRIP_RATIO,
): GridDragStrip {
  const x = clientX - rect.left;
  const t = rect.width > 0 ? x / rect.width : 0.5;
  if (t < edgeRatio) return 'left';
  if (t > 1 - edgeRatio) return 'right';
  return 'mid';
}

/** Loop for the A-tile interaction preview. */
export const GRID_DEMO_STRIP_SEQUENCE: GridDragStrip[] = [
  'mid',
  'left',
  'left',
  'mid',
  'right',
  'right',
  'mid',
];

export const GRID_DEMO_STEP_MS = 650;
export const GRID_DEMO_DELAY_MS = 2000;
export const GRID_DEMO_SEEN_KEY = 'beaded_grid_a_demo_seen';
