import React, { useCallback, useEffect, useState } from 'react';
import {
  GRID_DEMO_DELAY_MS,
  GRID_DEMO_SEEN_KEY,
  GRID_DEMO_STEP_MS,
  GRID_DEMO_STRIP_SEQUENCE,
  type GridDragStrip,
} from '../lib/gridRotate';
import LetterRing from '../components/LetterRing';

function markDemoSeen() {
  try {
    window.sessionStorage.setItem(GRID_DEMO_SEEN_KEY, '1');
  } catch {
    /* private mode / quota */
  }
}

function hasSeenDemo() {
  try {
    return window.sessionStorage.getItem(GRID_DEMO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function useGridDemoStripOnce(active: boolean, onComplete: () => void) {
  const [strip, setStrip] = useState<GridDragStrip>('mid');

  useEffect(() => {
    if (!active) return;

    let step = 0;
    setStrip(GRID_DEMO_STRIP_SEQUENCE[0]!);

    const id = window.setInterval(() => {
      step += 1;
      if (step >= GRID_DEMO_STRIP_SEQUENCE.length) {
        window.clearInterval(id);
        onComplete();
        return;
      }
      setStrip(GRID_DEMO_STRIP_SEQUENCE[step]!);
    }, GRID_DEMO_STEP_MS);

    return () => window.clearInterval(id);
  }, [active, onComplete]);

  return strip;
}

function DemoCursor({ strip }: { strip: GridDragStrip }) {
  return (
    <span
      className={`gridDemoCursor ${strip !== 'mid' ? 'gridDemoCursor--grabbing' : ''}`}
      data-strip={strip}
      aria-hidden="true"
    >
      <svg className="gridDemoCursor__svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5.5 3.5L5.5 18.5L9.5 14.5L12.5 21.5L14.5 20.5L11.5 13.5L16.5 13.5Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function NormalATile() {
  return (
    <button type="button" className="gridItem" aria-label="Letter A">
      <LetterRing letter="A" side="face" variant="grid" />
    </button>
  );
}

function GridADemoActive({ onFinish }: { onFinish: () => void }) {
  const demoStrip = useGridDemoStripOnce(true, onFinish);

  return (
    <button
      type="button"
      className="gridItem gridItem--demo"
      aria-label="Letter A — drag left or right to turn the ring"
      onPointerDown={onFinish}
    >
      <div className="gridDemoWrap">
        <LetterRing letter="A" side="face" variant="grid" demoStrip={demoStrip} />
        <DemoCursor strip={demoStrip} />
      </div>
    </button>
  );
}

type DemoPhase = 'waiting' | 'playing' | 'done';

export default function GridADemoTile() {
  const [phase, setPhase] = useState<DemoPhase>(() => (hasSeenDemo() ? 'done' : 'waiting'));

  const finish = useCallback(() => {
    markDemoSeen();
    setPhase('done');
  }, []);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const id = window.setTimeout(() => setPhase('playing'), GRID_DEMO_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  if (phase === 'done') return <NormalATile />;
  if (phase === 'waiting') return <NormalATile />;
  return <GridADemoActive onFinish={finish} />;
}
