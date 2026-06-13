import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LetterRing from '../components/LetterRing';
import type { ImageLoadPriority } from '../lib/imageLoading';

const ROW1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'] as const;
const ROW2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'] as const;
const ROW3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'] as const;

const KB_ROW_PRIORITY: Record<1 | 2 | 3, ImageLoadPriority> = {
  1: { loading: 'eager', fetchPriority: 'high' },
  2: { loading: 'eager', fetchPriority: 'auto' },
  3: { loading: 'lazy', fetchPriority: 'low' },
};

export default function KeyboardView() {
  const [word, setWord] = useState('');
  const [compactWord, setCompactWord] = useState(false);
  const wordBarRef = useRef<HTMLDivElement | null>(null);
  const wordCharsRef = useRef<HTMLDivElement | null>(null);
  const wordInputRef = useRef<HTMLInputElement | null>(null);

  const appendChar = useCallback((ch: string) => {
    setWord((prev) => prev + ch);
  }, []);

  const backspace = useCallback(() => {
    setWord((prev) => prev.slice(0, -1));
  }, []);

  const insertSpace = useCallback(() => appendChar(' '), [appendChar]);

  useEffect(() => {
    const focusInput = () => wordInputRef.current?.focus();
    const frame = window.requestAnimationFrame(focusInput);
    const timeout = window.setTimeout(focusInput, 150);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  const keepInputFocused = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
  }, []);

  const onKeyClick = (kind: 'letter' | 'backspace' | 'space', payload?: string) => {
    if (kind === 'letter' && payload) appendChar(payload);
    if (kind === 'backspace') backspace();
    if (kind === 'space') insertSpace();
    wordInputRef.current?.focus();
  };

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

  return (
    <section className="keyboardStage">
      <div className="keyboardLayout">
        <div className="wordAreaWrap">
          <div
            className={`wordBar ${compactWord ? 'wordBar--compact' : ''}`}
            ref={wordBarRef}
          >
            <input
              ref={wordInputRef}
              type="text"
              className="wordInput"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              aria-label="Type your word"
            />
            <div className="wordChars" aria-hidden="true" ref={wordCharsRef}>
              {wordChars.map((ch, idx) => {
                if (ch === ' ') {
                  return <span key={idx} className="wordSpace" />;
                }
                return <LetterRing key={idx} letter={ch} side="face" variant="word" loading="eager" fetchPriority="auto" />;
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
                onPointerDown={keepInputFocused}
                onClick={() => onKeyClick('letter', k)}
                aria-label={`Key ${k}`}
              >
                <LetterRing letter={k} side="face" variant="key" {...KB_ROW_PRIORITY[1]} />
              </button>
            ))}
          </div>

          <div className="kbRow">
            {ROW2.map((k) => (
              <button
                key={k}
                type="button"
                className="kbKey"
                onPointerDown={keepInputFocused}
                onClick={() => onKeyClick('letter', k)}
                aria-label={`Key ${k}`}
              >
                <LetterRing letter={k} side="face" variant="key" {...KB_ROW_PRIORITY[2]} />
              </button>
            ))}
            <button
              type="button"
              className="kbKey kbKey--backspace"
              onPointerDown={keepInputFocused}
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
                onPointerDown={keepInputFocused}
                onClick={() => onKeyClick('letter', k)}
                aria-label={`Key ${k}`}
              >
                <LetterRing letter={k} side="face" variant="key" {...KB_ROW_PRIORITY[3]} />
              </button>
            ))}
          </div>

          <div className="kbRow kbRow--spaceRow">
            <button
              type="button"
              className="kbSpace"
              onPointerDown={keepInputFocused}
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

