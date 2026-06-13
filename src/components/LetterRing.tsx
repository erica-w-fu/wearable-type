import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { DESKTOP_BREAKPOINT } from '../lib/gridColumns';
import {
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
  const [gridPointerDown, setGridPointerDown] = useState(false);
  const [rotationStackReady, setRotationStackReady] = useState(loading === 'eager');
  const gridDragActiveRef = useRef(false);

  const isDesktop = useMediaQuery(DESKTOP_BREAKPOINT);
  const edgeStripRatio = isDesktop ? GRID_EDGE_STRIP_RATIO : GRID_EDGE_STRIP_RATIO_MOBILE;

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
      setGridPointerDown(false);
      gridDragActiveRef.current = false;
    }
  }, [isGridVariant]);

  useEffect(() => {
    if (!isGridVariant || !gridPointerDown) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isGridVariant, gridPointerDown]);

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
      if (!isGridVariant || isDemo || !gridDragActiveRef.current) return;
      e.preventDefault();
      setGridStrip(
        horizontalStrip(e.clientX, e.currentTarget.getBoundingClientRect(), edgeStripRatio),
      );
    },
    [edgeStripRatio, isGridVariant, isDemo],
  );

  const onPointerDownGrid = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isGridVariant || isDemo) return;
      e.preventDefault();
      prefetchRingSides(normalized, [...RING_SIDES]);
      setRotationStackReady(true);
      gridDragActiveRef.current = true;
      setGridStrip('mid');
      setGridPointerDown(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [isGridVariant, isDemo, normalized],
  );

  const endGridGrab = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isGridVariant || isDemo) return;
      gridDragActiveRef.current = false;
      setGridStrip('mid');
      setGridPointerDown(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [isGridVariant, isDemo],
  );

  const onLostPointerCaptureGrid = useCallback(() => {
    if (!isGridVariant || isDemo) return;
    gridDragActiveRef.current = false;
    setGridStrip('mid');
    setGridPointerDown(false);
  }, [isGridVariant, isDemo]);

  const showImage = isGridVariant
    ? isAlphabetLetter(normalized) && hasLoadableRingImage(normalized, failedSides)
    : Boolean(singleSrc) && !failedSides.has(side) && isAlphabetLetter(normalized);

  const isPlaceholder = normalized !== '' && !showImage;
  const isGrabbing =
    isGridVariant && (isDemo ? activeStrip !== 'mid' : gridPointerDown);

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
