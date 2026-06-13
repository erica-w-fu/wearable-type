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

/** Fraction of tile width to drag horizontally before showing cw/ccw. */
export const GRID_EDGE_STRIP_RATIO = 0.2;
/** Slightly less drag needed on narrow viewports. */
export const GRID_EDGE_STRIP_RATIO_MOBILE = 0.18;
/** Pointer must move this far horizontally before ring drag takes over scrolling. */
export const GRID_DRAG_COMMIT_SLOP_PX = 8;
export const GRID_DRAG_COMMIT_SLOP_PX_MOBILE = 12;

/** Map horizontal drag distance from press point → left/mid/right strip. */
export function dragDeltaStrip(
  deltaX: number,
  tileWidth: number,
  turnRatio: number = GRID_EDGE_STRIP_RATIO,
): GridDragStrip {
  const threshold = tileWidth > 0 ? tileWidth * turnRatio : 0;
  if (deltaX <= -threshold) return 'left';
  if (deltaX >= threshold) return 'right';
  return 'mid';
}

/** Loop for the A-tile interaction preview (cursor vs ring image are separate). */
export type GridDemoPhase = {
  cursor: GridDragStrip;
  image: GridDragStrip;
  grabbing: boolean;
};

export const GRID_DEMO_PHASE_SEQUENCE: GridDemoPhase[] = [
  { cursor: 'mid', image: 'mid', grabbing: false },
  { cursor: 'mid', image: 'mid', grabbing: true },
  { cursor: 'left', image: 'mid', grabbing: true },
  { cursor: 'left', image: 'left', grabbing: true },
  { cursor: 'left', image: 'left', grabbing: true },
  { cursor: 'mid', image: 'left', grabbing: true },
  { cursor: 'mid', image: 'mid', grabbing: false },
  { cursor: 'mid', image: 'mid', grabbing: true },
  { cursor: 'right', image: 'mid', grabbing: true },
  { cursor: 'right', image: 'right', grabbing: true },
  { cursor: 'right', image: 'right', grabbing: true },
  { cursor: 'mid', image: 'right', grabbing: true },
  { cursor: 'mid', image: 'mid', grabbing: false },
];

export const GRID_DEMO_STEP_MS = 650;
export const GRID_DEMO_DELAY_MS = 2000;
export const GRID_DEMO_SEEN_KEY = 'beaded_grid_a_demo_seen';

export function markGridDemoSeen() {
  try {
    window.sessionStorage.setItem(GRID_DEMO_SEEN_KEY, '1');
  } catch {
    /* private mode / quota */
  }
}

export function hasSeenGridDemo() {
  try {
    return window.sessionStorage.getItem(GRID_DEMO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
