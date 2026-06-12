import React, { useCallback, useMemo, useState } from 'react';
import Header from './components/Header.tsx';
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import { DESKTOP_BREAKPOINT, gridColumnsForView } from './lib/gridColumns.ts';
import GridView from './pages/GridView.tsx';
import KeyboardView from './pages/KeyboardView.tsx';

export type ViewMode = 'small' | 'large' | 'keyboard';

export default function App() {
  const [view, setView] = useState<ViewMode>('small');
  const isDesktop = useMediaQuery(DESKTOP_BREAKPOINT);

  const onChangeView = useCallback((next: ViewMode) => setView(next), []);

  const gridColumns = useMemo(() => {
    if (view === 'keyboard') return null;
    return gridColumnsForView(view, isDesktop);
  }, [view, isDesktop]);

  return (
    <div className="appRoot">
      <Header view={view} onChangeView={onChangeView} />

      <main className="appMain">
        {gridColumns !== null && <GridView columns={gridColumns} />}
        {view === 'keyboard' && <KeyboardView />}
      </main>
    </div>
  );
}
