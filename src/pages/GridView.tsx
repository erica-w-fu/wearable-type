import React, { useCallback, useEffect, useMemo, useState } from 'react';
import GridADemoTile from '../components/GridADemoTile';
import LetterRing from '../components/LetterRing';
import { GridTurnContext } from '../contexts/GridTurnContext';
import { gridImagePriority, prefetchRingSides } from '../lib/imageLoading';
import { hasSeenGridDemo, markGridDemoSeen } from '../lib/gridRotate';

export type GridColumns = 1 | 2 | 4;

function buildAlphabetLetters() {
  return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
}

type Props = {
  columns: GridColumns;
};

export default function GridView({ columns }: Props) {
  const letters = useMemo(() => buildAlphabetLetters(), []);
  const [demoActive, setDemoActive] = useState(() => !hasSeenGridDemo());

  const dismissDemo = useCallback(() => {
    setDemoActive((playing) => {
      if (!playing) return playing;
      markGridDemoSeen();
      return false;
    });
  }, []);

  useEffect(() => {
    const aboveFoldCount = columns * 2;
    for (let i = 0; i < aboveFoldCount && i < letters.length; i++) {
      prefetchRingSides(letters[i]!);
    }
  }, [columns, letters]);

  const colClass =
    columns === 1
      ? 'gridContainer--cols1'
      : columns === 2
        ? 'gridContainer--cols2'
        : 'gridContainer--cols4';

  return (
    <section className="gridStage">
      <GridTurnContext.Provider value={demoActive ? dismissDemo : null}>
        <div className={`gridContainer ${colClass}`}>
          {letters.map((letter, index) =>
            letter === 'A' ? (
              <GridADemoTile key={letter} active={demoActive} />
            ) : (
              <button
                key={letter}
                type="button"
                className="gridItem"
                aria-label={`Letter ${letter}`}
              >
                <LetterRing
                  letter={letter}
                  side="face"
                  variant="grid"
                  {...gridImagePriority(index, columns)}
                />
              </button>
            ),
          )}
        </div>
      </GridTurnContext.Provider>
    </section>
  );
}
