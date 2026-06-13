import React, { useMemo } from 'react';
import GridADemoTile from '../components/GridADemoTile';
import LetterRing from '../components/LetterRing';
import { gridImagePriority } from '../lib/imageLoading';

export type GridColumns = 1 | 2 | 4;

function buildAlphabetLetters() {
  return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
}

type Props = {
  columns: GridColumns;
};

export default function GridView({ columns }: Props) {
  const letters = useMemo(() => buildAlphabetLetters(), []);

  const colClass =
    columns === 1
      ? 'gridContainer--cols1'
      : columns === 2
        ? 'gridContainer--cols2'
        : 'gridContainer--cols4';

  return (
    <section className="gridStage">
      <div className={`gridContainer ${colClass}`}>
        {letters.map((letter, index) =>
          letter === 'A' ? (
            <GridADemoTile key={letter} />
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
    </section>
  );
}
