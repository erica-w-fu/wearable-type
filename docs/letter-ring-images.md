# Letter ring images

Static assets for alphabet letter rings live under `public/lettersToned/`. Vite serves them at `/lettersToned/...` in the app.

## Folder layout

Each letter **A–Z** has its own directory with exactly three orientation images:

```text
public/lettersToned/
  A/
    face.jpg    # letter facing the viewer (default)
    ccw.jpg     # ring rotated 90° counter-clockwise
    cw.jpg      # ring rotated 90° clockwise
  B/
    face.jpg
    ccw.jpg
    cw.jpg
  ...
  Z/
    face.jpg
    ccw.jpg
    cw.jpg
```

### Side names

| Filename | Meaning | Use when |
|----------|---------|----------|
| `face` | Front / letter face visible | Grid, keyboard keys, default word display |
| `ccw` | Counter-clockwise 90° | User rotates ring left |
| `cw` | Clockwise 90° | User rotates ring right |

Use these names in code (`RingSide`), not “left” or “right”, to avoid ambiguity about whose perspective is meant.

### File format

Images are **JPEG** with the `.jpg` extension. Keep naming lowercase (`face.jpg`, not `Face.jpg`).

## URL pattern

```text
/lettersToned/{LETTER}/{side}.jpg
```

Examples:

- `public/lettersToned/A/face.jpg` → `/lettersToned/A/face.jpg`
- `public/lettersToned/R/cw.jpg` → `/lettersToned/R/cw.jpg`

## Code

- **`src/lib/ringImages.ts`** — `RING_SIDES`, `RingSide`, `ringImageUrl(letter, side)`, `ringSideAtIndex(index)` for rotation UI.
- **`src/components/LetterRing.tsx`** — Renders a ring; accepts optional `side` (defaults to `'face'`). Missing or broken images fall back to the letter text placeholder (`onError`).

### Usage

```ts
import { ringImageUrl, type RingSide } from '../lib/ringImages';

const src = ringImageUrl('A', 'face'); // "/lettersToned/A/face.jpg"
```

```tsx
<LetterRing letter="A" side="face" variant="grid" />
```

Grid and keyboard views pass `side="face"` explicitly. Word slots can pass `ccw` / `cw` when rotation is implemented.

### Rotation index

When storing rotation as `0 | 1 | 2`:

```ts
import { RING_SIDES, ringSideAtIndex } from '../lib/ringImages';

const side = ringSideAtIndex(rotationIndex); // face → ccw → cw → face …
```

- Rotate clockwise: `(index + 1) % 3`
- Rotate counter-clockwise: `(index + 2) % 3`

## Incomplete assets

Not every letter has all three files yet. The app still requests the URL for any A–Z letter; if the file is missing, the image fails to load and `LetterRing` shows the same text placeholder as before.

When adding assets, prefer completing all three sides for a letter in one go so rotation stays consistent.

## Checklist for new letters

1. Create `public/lettersToned/{LETTER}/`.
2. Add `face.jpg`, `ccw.jpg`, and `cw.jpg` (same dimensions and framing as siblings).
3. No code changes required if filenames match this doc.
