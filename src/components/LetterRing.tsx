import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGridTurnDismiss } from '../contexts/GridTurnContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { DESKTOP_BREAKPOINT } from '../lib/gridColumns';
import {
  GRID_DRAG_COMMIT_SLOP_PX,
  GRID_DRAG_COMMIT_SLOP_PX_MOBILE,
  GRID_EDGE_STRIP_RATIO,
  GRID_EDGE_STRIP_RATIO_MOBILE,
  dragDeltaStrip,
  stripToImageSide,
  stripToTiltZone,
  type GridDragStrip,
} from '../lib/gridRotate';
import { loadRingSides } from '../lib/imageLoading';
import { ringImageUrl, RING_SIDES, type RingSide } from '../lib/ringImages';

type Props = {
  letter: string;
  side?: RingSide;
  sizePx?: number;
  className?: string;
  variant?: 'grid' | 'key' | 'wordSlot' | 'word';
  /** When set, drives strip/tilt for a non-interactive preview (e.g. animated A tile). */
  demoStrip?: GridDragStrip;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
};

type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  target: HTMLDivElement;
};

const COMING_SOON_TEXT = 'coming soon';

function isAlphabetLetter(letter: string) {
  return /^[A-Z]$/.test(letter);
}

function pickVisibleSide(
  activeSide: RingSide,
  loadedSides: Set<RingSide>,
  failedSides: Set<RingSide>,
): RingSide {
  if (loadedSides.has(activeSide)) return activeSide;
  if (failedSides.has(activeSide)) {
    if (loadedSides.has('face')) return 'face';
    for (const side of RING_SIDES) {
      if (loadedSides.has(side)) return side;
    }
    return 'face';
  }
  if (loadedSides.has('face')) return 'face';
  for (const side of RING_SIDES) {
    if (loadedSides.has(side)) return side;
  }
  return activeSide;
}

function hasLoadableRingImage(letter: string, failedSides: Set<RingSide>) {
  return RING_SIDES.some((side) => {
    const url = ringImageUrl(letter, side);
    return Boolean(url) && !failedSides.has(side);
  });
}

export default function LetterRing({
  letter,
  side = 'face',
  sizePx,
  className,
  variant = 'grid',
  demoStrip,
  loading = 'eager',
  fetchPriority = 'auto',
}: Props) {
  const [failedSides, setFailedSides] = useState<Set<RingSide>>(() => new Set());
  const [loadedSides, setLoadedSides] = useState<Set<RingSide>>(() => new Set());
  const [gridStrip, setGridStrip] = useState<GridDragStrip>('mid');
  const [gridDragCommitted, setGridDragCommitted] = useState(false);
  const [rotationStackReady, setRotationStackReady] = useState(loading === 'eager');
  const sessionRef = useRef<DragSession | null>(null);
  const committedRef = useRef(false);
  const cleanupListenersRef = useRef<(() => void) | null>(null);
  const edgeStripRatioRef = useRef(GRID_EDGE_STRIP_RATIO);
  const dragCommitSlopRef = useRef(GRID_DRAG_COMMIT_SLOP_PX);
  const onGridTurnRef = useRef<(() => void) | null>(null);
  const notifiedTurnRef = useRef(false);

  const onGridTurn = useGridTurnDismiss();

  const isDesktop = useMediaQuery(DESKTOP_BREAKPOINT);
  const edgeStripRatio = isDesktop ? GRID_EDGE_STRIP_RATIO : GRID_EDGE_STRIP_RATIO_MOBILE;
  const dragCommitSlop = isDesktop ? GRID_DRAG_COMMIT_SLOP_PX : GRID_DRAG_COMMIT_SLOP_PX_MOBILE;

  const isDemo = demoStrip !== undefined;
  const activeStrip = isDemo ? demoStrip : gridStrip;
  const isGridVariant = variant === 'grid';

  const normalized = letter.toUpperCase();
  const activeGridSide = stripToImageSide(activeStrip);
  const singleSrc = ringImageUrl(normalized, side);

  useEffect(() => {
    edgeStripRatioRef.current = edgeStripRatio;
  }, [edgeStripRatio]);

  useEffect(() => {
    dragCommitSlopRef.current = dragCommitSlop;
  }, [dragCommitSlop]);

  useEffect(() => {
    onGridTurnRef.current = onGridTurn;
  }, [onGridTurn]);

  useEffect(() => {
    setFailedSides(new Set());
    setLoadedSides(new Set());
  }, [normalized]);

  useEffect(() => {
    if (!isGridVariant || !isAlphabetLetter(normalized)) return;
    if (loading === 'lazy') return;
    let cancelled = false;
    loadRingSides(normalized, [...RING_SIDES]).then(() => {
      if (!cancelled) setRotationStackReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isGridVariant, loading, normalized]);

  useEffect(() => {
    if (isDemo && isAlphabetLetter(normalized)) {
      loadRingSides(normalized, [...RING_SIDES]).then(() => setRotationStackReady(true));
    }
  }, [isDemo, normalized]);

  useEffect(() => {
    if (!isGridVariant) {
      sessionRef.current = null;
      committedRef.current = false;
      setGridStrip('mid');
      setGridDragCommitted(false);
    }
  }, [isGridVariant]);

  useEffect(() => {
    return () => cleanupListenersRef.current?.();
  }, []);

  const detachWindowListeners = useCallback(() => {
    cleanupListenersRef.current?.();
    cleanupListenersRef.current = null;
  }, []);

  const endDragSession = useCallback(
    (pointerId: number) => {
      const session = sessionRef.current;
      if (!session || session.pointerId !== pointerId) return;

      detachWindowListeners();
      try {
        session.target.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }

      sessionRef.current = null;
      committedRef.current = false;
      setGridStrip('mid');
      setGridDragCommitted(false);
    },
    [detachWindowListeners],
  );

  const attachWindowListeners = useCallback(() => {
    detachWindowListeners();

    const onMove = (e: PointerEvent) => {
      const session = sessionRef.current;
      if (!session || session.pointerId !== e.pointerId) return;

      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;

      if (!committedRef.current) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDy > absDx && absDy >= dragCommitSlopRef.current) {
          endDragSession(e.pointerId);
          return;
        }
        if (!(absDx > absDy && absDx >= dragCommitSlopRef.current)) return;

        committedRef.current = true;
        setGridDragCommitted(true);
        try {
          session.target.setPointerCapture(e.pointerId);
        } catch {
          /* capture may fail on some browsers */
        }
      }

      e.preventDefault();
      const strip = dragDeltaStrip(
        dx,
        session.target.getBoundingClientRect().width,
        edgeStripRatioRef.current,
      );
      setGridStrip(strip);
      if (strip !== 'mid' && !notifiedTurnRef.current) {
        notifiedTurnRef.current = true;
        onGridTurnRef.current?.();
      }
    };

    const onEnd = (e: PointerEvent) => {
      endDragSession(e.pointerId);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    cleanupListenersRef.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [detachWindowListeners, endDragSession]);

  const markSideLoaded = useCallback((ringSide: RingSide) => {
    setLoadedSides((prev) => {
      if (prev.has(ringSide)) return prev;
      const next = new Set(prev);
      next.add(ringSide);
      return next;
    });
  }, []);

  const markSideFailed = useCallback((ringSide: RingSide) => {
    setFailedSides((prev) => {
      if (prev.has(ringSide)) return prev;
      const next = new Set(prev);
      next.add(ringSide);
      return next;
    });
  }, []);

  const onPointerEnterGrid = useCallback(() => {
    if (!isGridVariant || isDemo || !isAlphabetLetter(normalized)) return;
    setRotationStackReady(true);
    void loadRingSides(normalized, [...RING_SIDES]);
  }, [isGridVariant, isDemo, normalized]);

  const onPointerDownGrid = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isGridVariant || isDemo) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      setRotationStackReady(true);
      void loadRingSides(normalized, [...RING_SIDES]);

      committedRef.current = false;
      setGridDragCommitted(false);
      setGridStrip('mid');
      notifiedTurnRef.current = false;
      sessionRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        target: e.currentTarget,
      };
      attachWindowListeners();
    },
    [attachWindowListeners, isGridVariant, isDemo, normalized],
  );

  const showImage = isGridVariant
    ? isAlphabetLetter(normalized) && hasLoadableRingImage(normalized, failedSides)
    : Boolean(singleSrc) && !failedSides.has(side) && isAlphabetLetter(normalized);

  const sideSettled = (ringSide: RingSide) => loadedSides.has(ringSide) || failedSides.has(ringSide);

  const showTurnPlaceholder =
    isGridVariant &&
    !isDemo &&
    activeStrip !== 'mid' &&
    sideSettled(activeGridSide) &&
    !loadedSides.has(activeGridSide);

  const showComingSoon = normalized !== '' && (!showImage || showTurnPlaceholder);
  const isPlaceholder = showComingSoon;
  const isGrabbing =
    isGridVariant && (isDemo ? activeStrip !== 'mid' : gridDragCommitted);

  const style = useMemo(() => {
    if (!sizePx) return undefined;
    return { width: sizePx, height: sizePx } as const;
  }, [sizePx]);

  const gridZoneProps =
    isGridVariant
      ? ({
          'data-grid-zone': stripToTiltZone(activeStrip),
        } as const)
      : {};

  const stackFetchPriority = isDemo || fetchPriority === 'high' ? 'high' : fetchPriority;

  const visibleGridSide = pickVisibleSide(activeGridSide, loadedSides, failedSides);

  const renderGridStack = () => {
    const sidesToRender = rotationStackReady ? RING_SIDES : (['face'] as const);
    return (
      <div className="ringTile__imgStack" aria-hidden="true">
        {sidesToRender.map((ringSide) => {
          const url = ringImageUrl(normalized, ringSide);
          if (!url || failedSides.has(ringSide)) return null;
          const isActive = ringSide === visibleGridSide;
          return (
            <img
              key={ringSide}
              className={`ringTile__img ringTile__img--stacked ${isActive ? 'ringTile__img--active' : ''}`}
              src={url}
              alt=""
              loading={ringSide === 'face' ? loading : 'eager'}
              decoding="sync"
              fetchPriority={ringSide === 'face' ? fetchPriority : stackFetchPriority === 'high' ? 'high' : 'low'}
              draggable={false}
              ref={(el) => {
                if (el?.complete) markSideLoaded(ringSide);
              }}
              onLoad={() => markSideLoaded(ringSide)}
              onError={() => markSideFailed(ringSide)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`ringTile ringTile--${variant} ${isGrabbing ? 'ringTile--grabbing' : ''} ${isDemo ? 'ringTile--demo' : ''} ${isPlaceholder ? 'ringTile--placeholder' : ''} ${className ?? ''}`}
      style={style}
      {...gridZoneProps}
      onPointerDown={isDemo ? undefined : onPointerDownGrid}
      onPointerEnter={isDemo ? undefined : onPointerEnterGrid}
    >
      {normalized === '' ? null : showComingSoon ? (
        <div className="ringTile__text" aria-hidden="true">
          {COMING_SOON_TEXT}
        </div>
      ) : isGridVariant ? (
        renderGridStack()
      ) : (
        <img
          className="ringTile__img"
          src={singleSrc!}
          alt={normalized}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          draggable={false}
          onError={() => markSideFailed(side)}
        />
      )}
    </div>
  );
}
