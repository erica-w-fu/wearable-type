import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LetterRing from '../components/LetterRing';

const ROW1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'] as const;
const ROW2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'] as const;
const ROW3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'] as const;

function normalizeLetterKey(key: string) {
  if (!/^[a-zA-Z]$/.test(key)) return null;
  return key.toUpperCase();
}

export default function KeyboardView() {
  const [word, setWord] = useState('');
  const [compactWord, setCompactWord] = useState(false);
  const wordBarRef = useRef<HTMLDivElement | null>(null);
  const wordCharsRef = useRef<HTMLDivElement | null>(null);

  const appendChar = useCallback((ch: string) => {
    setWord((prev) => prev + ch);
  }, []);

  const backspace = useCallback(() => {
    setWord((prev) => prev.slice(0, -1));
  }, []);

  const insertSpace = useCallback(() => appendChar(' '), [appendChar]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Letters
      const letter = normalizeLetterKey(key);
      if (letter) {
        e.preventDefault();
        appendChar(letter);
        return;
      }

      // Backspace
      if (key === 'Backspace') {
        e.preventDefault();
        backspace();
        return;
      }

      // Space
      if (key === ' ' || key === 'Spacebar') {
        e.preventDefault();
        insertSpace();
      }
    };

    const opts: AddEventListenerOptions = { capture: true };
    window.addEventListener('keydown', onKeyDown, opts);
    return () => window.removeEventListener('keydown', onKeyDown, opts);
  }, [appendChar, backspace, insertSpace]);

  const wordChars = useMemo(() => Array.from(word), [word]);

  useEffect(() => {
    const measureOverflow = () => {
      const barEl = wordBarRef.current;
      const charsEl = wordCharsRef.current;
      if (!barEl || !charsEl) return;
      const overflowing = charsEl.scrollHeight > barEl.clientHeight + 1;
      setCompactWord(overflowing);
    };

    // Start at full-size and only shrink after two rows overflow.
    setCompactWord(false);
    const frame = window.requestAnimationFrame(measureOverflow);
    window.addEventListener('resize', measureOverflow);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measureOverflow);
    };
  }, [word]);

  const onKeyClick = (kind: 'letter' | 'backspace' | 'space', payload?: string) => {
    if (kind === 'letter' && payload) appendChar(payload);
    if (kind === 'backspace') backspace();
    if (kind === 'space') insertSpace();
  };

  return (
    <section className="keyboardStage">
      <div className="keyboardLayout">
        <div className="wordAreaWrap">
          <div
            className={`wordBar ${compactWord ? 'wordBar--compact' : ''}`}
            aria-label="Type your word"
            ref={wordBarRef}
          >
            <div className="wordChars" aria-hidden="true" ref={wordCharsRef}>
              {wordChars.map((ch, idx) => {
                if (ch === ' ') {
                  return <span key={idx} className="wordSpace" />;
                }
                return <LetterRing key={idx} letter={ch} side="face" variant="word" />;
              })}
              <span className="wordCaretInline" />
            </div>
          </div>
        </div>

        <div className="keyboardKeys" aria-label="Keyboard">
          <div className="kbRow">
            {ROW1.map((k) => (
              <button
                key={k}
                type="button"
                className="kbKey"
                onClick={() => onKeyClick('letter', k)}
                aria-label={`Key ${k}`}
              >
                <LetterRing letter={k} side="face" variant="key" />
              </button>
            ))}
          </div>

          <div className="kbRow">
            {ROW2.map((k) => (
              <button
                key={k}
                type="button"
                className="kbKey"
                onClick={() => onKeyClick('letter', k)}
                aria-label={`Key ${k}`}
              >
                <LetterRing letter={k} side="face" variant="key" />
              </button>
            ))}
            <button
              type="button"
              className="kbKey kbKey--backspace"
              onClick={() => onKeyClick('backspace')}
              aria-label="Backspace"
            >
              <span className="kbSpecialKey kbSpecialKey--backspace" aria-hidden="true">
                <svg
                  className="kbBackspaceGlyph"
                  viewBox="0 0 64 40"
                  xmlns="http://www.w3.org/2000/svg"
                  role="presentation"
                >
                  <path
                    d="M 20 6 
                    H 60 
                    V 34 
                    H 20 
                    L 6 20 
                    Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinejoin="miter"
                    strokeLinecap="square"
                  />
                  <path
                    d="M30 13L45 28M45 13L30 28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="square"
                  />
                </svg>
              </span>
            </button>
          </div>

          <div className="kbRow">
            {ROW3.map((k) => (
              <button
                key={k}
                type="button"
                className="kbKey"
                onClick={() => onKeyClick('letter', k)}
                aria-label={`Key ${k}`}
              >
                <LetterRing letter={k} side="face" variant="key" />
              </button>
            ))}
          </div>

          <div className="kbRow kbRow--spaceRow">
            <button
              type="button"
              className="kbSpace"
              onClick={() => onKeyClick('space')}
              aria-label="Space"
            >
              <span className="kbSpecialKey kbSpecialKey--space" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

