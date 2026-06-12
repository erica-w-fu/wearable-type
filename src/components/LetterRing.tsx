import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  horizontalStrip,
  stripToImageSide,
  stripToTiltZone,
  type GridDragStrip,
} from '../lib/gridRotate';
import { ringImageUrl, type RingSide } from '../lib/ringImages';

type Props = {
  letter: string;
  side?: RingSide;
  sizePx?: number;
  className?: string;
  variant?: 'grid' | 'key' | 'wordSlot' | 'word';
  /** When set, drives strip/tilt for a non-interactive preview (e.g. animated A tile). */
  demoStrip?: GridDragStrip;
};

function isAlphabetLetter(letter: string) {
  return /^[A-Z]$/.test(letter);
}

export default function LetterRing({
  letter,
  side = 'face',
  sizePx,
  className,
  variant = 'grid',
  demoStrip,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [gridStrip, setGridStrip] = useState<GridDragStrip>('mid');
  const [gridPointerDown, setGridPointerDown] = useState(false);
  const gridDragActiveRef = useRef(false);

  const isDemo = demoStrip !== undefined;
  const activeStrip = isDemo ? demoStrip : gridStrip;

  const normalized = letter.toUpperCase();
  const effectiveSide =
    variant === 'grid' ? stripToImageSide(activeStrip) : side;
  const src = ringImageUrl(normalized, effectiveSide);

  useEffect(() => {
    setImageFailed(false);
  }, [normalized, effectiveSide]);

  useEffect(() => {
    if (variant !== 'grid') {
      setGridStrip('mid');
      setGridPointerDown(false);
      gridDragActiveRef.current = false;
    }
  }, [variant]);

  const onPointerMoveGrid = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (variant !== 'grid' || isDemo || !gridDragActiveRef.current) return;
      setGridStrip(horizontalStrip(e.clientX, e.currentTarget.getBoundingClientRect()));
    },
    [variant, isDemo],
  );

  const onPointerDownGrid = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (variant !== 'grid' || isDemo) return;
      gridDragActiveRef.current = true;
      setGridStrip('mid');
      setGridPointerDown(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [variant, isDemo],
  );

  const endGridGrab = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (variant !== 'grid' || isDemo) return;
      gridDragActiveRef.current = false;
      setGridStrip('mid');
      setGridPointerDown(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [variant, isDemo],
  );

  const onLostPointerCaptureGrid = useCallback(() => {
    if (variant !== 'grid' || isDemo) return;
    gridDragActiveRef.current = false;
    setGridStrip('mid');
    setGridPointerDown(false);
  }, [variant, isDemo]);

  const showImage = Boolean(src) && !imageFailed && isAlphabetLetter(normalized);
  const isPlaceholder = normalized !== '' && !showImage;
  const isGrabbing =
    variant === 'grid' && (isDemo ? activeStrip !== 'mid' : gridPointerDown);

  const style = useMemo(() => {
    if (!sizePx) return undefined;
    return { width: sizePx, height: sizePx } as const;
  }, [sizePx]);

  const gridZoneProps =
    variant === 'grid'
      ? ({
          'data-grid-zone': stripToTiltZone(activeStrip),
        } as const)
      : {};

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
        <img
          className="ringTile__img"
          src={src!}
          alt={normalized}
          draggable={false}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="ringTile__text" aria-hidden="true">
          {normalized}
        </div>
      )}
    </div>
  );
}
