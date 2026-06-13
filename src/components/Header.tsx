import React from 'react';
import type { ViewMode } from '../App';

type Props = {
  view: ViewMode;
  onChangeView: (next: ViewMode) => void;
};

function IconMinus() {
  return (
    <svg className="hdrTabIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="hdrTabIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function Header({ view, onChangeView }: Props) {
  return (
    <header className="hdr">
      <div className="hdrTitle">wearable type</div>

      <nav className="hdrNav" aria-label="Views">
        <button
          type="button"
          className="hdrTab hdrTab--icon"
          onClick={() => onChangeView('small')}
          disabled={view === 'small'}
          aria-label="Smaller grid"
          aria-current={view === 'small' ? 'page' : undefined}
        >
          <IconMinus />
        </button>
        <button
          type="button"
          className="hdrTab hdrTab--icon"
          onClick={() => onChangeView('large')}
          disabled={view === 'large'}
          aria-label="Larger grid"
          aria-current={view === 'large' ? 'page' : undefined}
        >
          <IconPlus />
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
