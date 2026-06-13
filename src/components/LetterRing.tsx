import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { DESKTOP_BREAKPOINT } from '../lib/gridColumns';
import {
  GRID_DRAG_COMMIT_SLOP_PX,
  GRID_DRAG_COMMIT_SLOP_PX_MOBILE,
  GRID_EDGE_STRIP_RATIO,
  GRID_EDGE_STRIP_RATIO_MOBILE,
  horizontalStrip,
  stripToImageSide,
  stripToTiltZone,
  type GridDragStrip,
} from '../lib/gridRotate';
import { prefetchRingSides } from '../lib/imageLoading';
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

function isAlphabetLetter(letter: string) {
  return /^[A-Z]$/.test(letter);
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
  const [gridStrip, setGridStrip] = useState<GridDragStrip>('mid');
  const [gridDragCommitted, setGridDragCommitted] = useState(false);
  const [rotationStackReady, setRotationStackReady] = useState(loading === 'eager');
  const gridDragActiveRef = useRef(false);
  const pointerSessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);

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
    setFailedSides(new Set());
  }, [normalized]);

  useEffect(() => {
    if (!isGridVariant || loading === 'lazy' || !isAlphabetLetter(normalized)) return;
    prefetchRingSides(normalized, [...RING_SIDES]);
    setRotationStackReady(true);
  }, [isGridVariant, loading, normalized]);

  useEffect(() => {
    if (!isGridVariant) {
      setGridStrip('mid');
      setGridDragCommitted(false);
      gridDragActiveRef.current = false;
      pointerSessionRef.current = null;
    }
  }, [isGridVariant]);

  const resetGridDrag = useCallback((target: HTMLDivElement | null, pointerId?: number) => {
    gridDragActiveRef.current = false;
    pointerSessionRef.current = null;
    setGridStrip('mid');
    setGridDragCommitted(false);
    if (target != null && pointerId != null) {
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }
    }
  }, []);

  const commitGridDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (gridDragActiveRef.current) return;
      gridDragActiveRef.current = true;
      setGridDragCommitted(true);
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setGridStrip(
        horizontalStrip(e.clientX, e.currentTarget.getBoundingClientRect(), edgeStripRatio),
      );
    },
    [edgeStripRatio],
  );

  const markSideFailed = useCallback((ringSide: RingSide) => {
    setFailedSides((prev) => {
      if (prev.has(ringSide)) return prev;
      const next = new Set(prev);
      next.add(ringSide);
      return next;
    });
  }, []);

  const onPointerMoveGrid = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isGridVariant || isDemo) return;

      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== e.pointerId) return;

      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;

      if (!gridDragActiveRef.current) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDy > absDx && absDy >= dragCommitSlop) {
          resetGridDrag(null);
          return;
        }
        if (absDx > absDy && absDx >= dragCommitSlop) {
          commitGridDrag(e);
        }
        return;
      }

      e.preventDefault();
      setGridStrip(
        horizontalStrip(e.clientX, e.currentTarget.getBoundingClientRect(), edgeStripRatio),
      );
    },
    [commitGridDrag, dragCommitSlop, edgeStripRatio, isGridVariant, isDemo, resetGridDrag],
  );

  const onPointerDownGrid = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isGridVariant || isDemo) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      prefetchRingSides(normalized, [...RING_SIDES]);
      setRotationStackReady(true);
      pointerSessionRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
      };
      gridDragActiveRef.current = false;
      setGridDragCommitted(false);
      setGridStrip('mid');
    },
    [isGridVariant, isDemo, normalized],
  );

  const endGridGrab = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isGridVariant || isDemo) return;
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== e.pointerId) return;
      resetGridDrag(e.currentTarget, e.pointerId);
    },
    [isGridVariant, isDemo, resetGridDrag],
  );

  const onLostPointerCaptureGrid = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isGridVariant || isDemo) return;
      resetGridDrag(e.currentTarget);
    },
    [isGridVariant, isDemo, resetGridDrag],
  );

  const showImage = isGridVariant
    ? isAlphabetLetter(normalized) && hasLoadableRingImage(normalized, failedSides)
    : Boolean(singleSrc) && !failedSides.has(side) && isAlphabetLetter(normalized);

  const isPlaceholder = normalized !== '' && !showImage;
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

  const renderGridStack = () => {
    const sidesToRender = rotationStackReady ? RING_SIDES : (['face'] as const);
    return (
      <div className="ringTile__imgStack" aria-hidden="true">
        {sidesToRender.map((ringSide) => {
          const url = ringImageUrl(normalized, ringSide);
          if (!url || failedSides.has(ringSide)) return null;
          const isActive = ringSide === activeGridSide;
          return (
            <img
              key={ringSide}
              className={`ringTile__img ringTile__img--stacked ${isActive ? 'ringTile__img--active' : ''}`}
              src={url}
              alt=""
              loading={ringSide === 'face' ? loading : 'eager'}
              decoding="async"
              fetchPriority={ringSide === 'face' ? fetchPriority : 'low'}
              draggable={false}
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
      onPointerMove={isDemo ? undefined : onPointerMoveGrid}
      onPointerCancel={
        isDemo
          ? undefined
          : (e) => {
              endGridGrab(e);
            }
      }
      onPointerDown={isDemo ? undefined : onPointerDownGrid}
      onPointerUp={isDemo ? undefined : endGridGrab}
      onLostPointerCapture={isDemo ? undefined : onLostPointerCaptureGrid}
    >
      {normalized === '' ? null : showImage ? (
        isGridVariant ? (
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
        )
      ) : (
        <div className="ringTile__text" aria-hidden="true">
          {normalized}
        </div>
      )}
    </div>
  );
}
