import React from 'react';
import type { ViewMode } from '../App';

type Props = {
  view: ViewMode;
  onChangeView: (next: ViewMode) => void;
};

export default function Header({ view, onChangeView }: Props) {
  return (
    <header className="hdr">
      <div className="hdrTitle">wearable type</div>

      <nav className="hdrNav" aria-label="Views">
        <button
          type="button"
          className="hdrTab"
          onClick={() => onChangeView('small')}
          disabled={view === 'small'}
          aria-current={view === 'small' ? 'page' : undefined}
        >
          -
        </button>
        <button
          type="button"
          className="hdrTab"
          onClick={() => onChangeView('large')}
          disabled={view === 'large'}
          aria-current={view === 'large' ? 'page' : undefined}
        >
          +
        </button>
        <button
          type="button"
          className={`hdrTab ${view === 'keyboard' ? 'hdrTab--active' : ''}`}
          onClick={() => onChangeView('keyboard')}
          aria-current={view === 'keyboard' ? 'page' : undefined}
        >
          keyboard
        </button>
      </nav>
    </header>
  );
}
