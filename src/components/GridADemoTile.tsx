import React, { useEffect, useState } from 'react';
import {
  GRID_DEMO_DELAY_MS,
  GRID_DEMO_PHASE_SEQUENCE,
  GRID_DEMO_STEP_MS,
  type GridDemoPhase,
} from '../lib/gridRotate';
import { loadRingSides } from '../lib/imageLoading';
import LetterRing from '../components/LetterRing';

const A_TILE_PRIORITY = { loading: 'eager' as const, fetchPriority: 'high' as const };

const DEMO_REST: GridDemoPhase = { cursor: 'mid', image: 'mid', grabbing: false };

const OPEN_HAND_URL = `${import.meta.env.BASE_URL}openhand.svg`;
const CLOSED_HAND_URL = `${import.meta.env.BASE_URL}closedhand.svg`;

function useGridDemoPhaseLoop(active: boolean) {
  const [phase, setPhase] = useState<GridDemoPhase>(DEMO_REST);

  useEffect(() => {
    if (!active) {
      setPhase(DEMO_REST);
      return;
    }

    let step = 0;
    setPhase(GRID_DEMO_PHASE_SEQUENCE[0]!);

    const id = window.setInterval(() => {
      step = (step + 1) % GRID_DEMO_PHASE_SEQUENCE.length;
      setPhase(GRID_DEMO_PHASE_SEQUENCE[step]!);
    }, GRID_DEMO_STEP_MS);

    return () => window.clearInterval(id);
  }, [active]);

  return phase;
}

function DemoCursor({ strip, grabbing }: { strip: GridDemoPhase['cursor']; grabbing: boolean }) {
  return (
    <span
      className={`gridDemoCursor ${grabbing ? 'gridDemoCursor--grabbing' : ''}`}
      data-strip={strip}
      aria-hidden="true"
    >
      <img
        className="gridDemoCursor__icon gridDemoCursor__icon--open"
        src={OPEN_HAND_URL}
        alt=""
        draggable={false}
      />
      <img
        className="gridDemoCursor__icon gridDemoCursor__icon--closed"
        src={CLOSED_HAND_URL}
        alt=""
        draggable={false}
      />
    </span>
  );
}

function NormalATile() {
  return (
    <button type="button" className="gridItem" aria-label="Letter A">
      <LetterRing letter="A" side="face" variant="grid" {...A_TILE_PRIORITY} />
    </button>
  );
}

function GridADemoActive() {
  const { cursor, image, grabbing } = useGridDemoPhaseLoop(true);

  return (
    <div className="gridItem gridItem--demo" aria-label="Letter A — drag left or right to turn the ring">
      <div className="gridDemoWrap">
        <LetterRing letter="A" side="face" variant="grid" demoStrip={image} {...A_TILE_PRIORITY} />
        <DemoCursor strip={cursor} grabbing={grabbing} />
      </div>
    </div>
  );
}

type DemoPhase = 'waiting' | 'playing';

type Props = {
  active: boolean;
};

export default function GridADemoTile({ active }: Props) {
  const [phase, setPhase] = useState<DemoPhase>('waiting');
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    if (!active) {
      setPhase('waiting');
      return;
    }
    let cancelled = false;
    loadRingSides('A').then(() => {
      if (!cancelled) setImagesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!active || phase !== 'waiting' || !imagesReady) return;
    const id = window.setTimeout(() => setPhase('playing'), GRID_DEMO_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [active, phase, imagesReady]);

  if (!active) return <NormalATile />;
  if (phase === 'waiting') return <NormalATile />;
  return <GridADemoActive />;
}
