import type { GridColumns } from '../pages/GridView';

export type GridSizeView = 'small' | 'large';

export const DESKTOP_BREAKPOINT = '(min-width: 700px)';

export function gridColumnsForView(view: GridSizeView, isDesktop: boolean): GridColumns {
  if (isDesktop) return view === 'small' ? 4 : 2;
  return view === 'small' ? 2 : 1;
}
