# Sketch Whiteboard

A web-based interactive whiteboard built from scratch in React — an infinite scrollable canvas where you draw and manipulate elements with a toolbar of tools.

The guiding philosophy: **UI components are thin; all real behavior lives in custom hooks.** No state library, no router, no test runner — plain React 19 state lifted to `App.jsx`, composed through a small hook system, styled with CSS Modules.

---

## Status

Early development. The canvas, tool dispatch, keyboard shortcuts, and a callback-based hook architecture are in place. Drawing tools (rectangle, oval, line, text), a pan tool, and a click-to-select tool work end-to-end.

---

## What works today

- **Infinite scrollable canvas** — dark grid with a center crosshair, scrolled to center on load, grows and shrinks to fit content
- **Move tool** — click-drag to pan (`grab`/`grabbing` cursors); hold **Space** from any tool to pan momentarily, releasing restores the tool you had
- **Select tool** — click an element to select it, click empty canvas to deselect (single-select; the `selected` flag is tracked and stamped as `data-selected`, but there's no visual highlight styling yet)
- **Rectangle / Oval tools** — drag to draw with a live dashed-teal ghost preview; a plain click drops a default 100×100 element
- **Line tool** — drag to draw a straight line (arrowhead metadata is stored per line but not rendered yet)
- **Text tool** — drag (or click) to drop a placeholder text box, then auto-switches back to Select
- **Per-element styling** — every element carries its own `properties` bag (fill, stroke, opacity, …); each component applies its own defaults
- **Element identity** — crypto-random ids (`rect-a1b2c3d4e5`) used as React keys and `data-uuid` attributes
- **Keyboard shortcuts** — sticky tool keys `V` `H` `R` `O` `L` `T`, momentary Space-to-pan, exact modifier matching (a bare `R` won't collide with Ctrl+R), tooltips on toolbar buttons
- **Per-tool cursors** — declared per tool, switchable mid-gesture

---

## Architecture

`App.jsx` is the top-level owner **and the tool dispatcher**: it holds the refs and the `activeTool` string, calls the state hooks, mounts every tool hook with a boolean, and passes plain data down to a presentational `Board.jsx`. All state hooks return **objects** (`{ content, addElement, … }`), so consumers destructure by name.

There are two hook layers.

### Layer 1 — Primitives

**`useMouse(ref, callback)`** — the event bridge. Attaches `mousedown`/`mousemove`/`mouseup`/`click` listeners to `ref.current` while `callback.active` is true and delivers each event to the consumer's callbacks. Returns nothing — it's a sink, not a source.

```js
useMouse(boardRef, {
  active,                                // boolean: listeners attach only while true
  cursor,                                // optional base cursor, applied while active
  onDown:  (mouse, setCursor) => {...},  // optional
  onMove:  (mouse, setCursor) => {...},  // optional, every mousemove
  onUp:    (mouse, setCursor) => {...},  // optional
  onClick: (mouse, setCursor) => {...},  // optional, only when it wasn't a drag
});
```

Each callback receives a `mouse` snapshot — `{ isDown, startX, startY, x, y, hasDragged, target }` in viewport coordinates — plus a `setCursor(type?)` helper (`setCursor('grabbing')` overrides mid-gesture, `setCursor()` resets to the base). `hasDragged` flips true once the mouse moves while down; `onClick` fires only when it stayed false — that's how a click is told apart from the end of a drag. `mouse.target` is the DOM event target (the select tool reads `data-uuid` off it).

*Why callback-based?* Mouse coordinates change ~60×/sec during a drag. Returning them as state would re-render the world on every move; delivering snapshots to callbacks lets each tool decide what (if anything) should render. Internally the hook keeps two refs — live mouse state, and a "latest callback" ref so handlers always see current consumer logic without re-attaching DOM listeners every render.

**`useBoard(boardRef, canvasRef, content)` → `{ boardState, scrollTo, scrollBy }`** — owns board/canvas geometry and the dynamic-resize logic. `scrollTo(x, y)`/`scrollBy(x, y)` mutate the DOM; a scroll listener mirrors the position back into state (one source of truth, synced by subscription). `boardState.canvasSize` (default `5000`) drives the canvas width/height; an effect watching `content` recomputes it from the farthest element extent, and a `useLayoutEffect` scroll-corrects when it changes (see *Dynamic canvas sizing*).

**`usePreview()` → `{ preview, enablePreview, disablePreview }`** — the drag ghost. `enablePreview(type, startX, startY, endX, endY)` stores a ready-to-render dashed-teal `<Shape>`/`<Line>` element; `disablePreview()` clears it; `Board` renders it above the content.

**`useContent(start)` → `{ content, addElement, selectElement, clearContent, encodeContent }`** — the committed elements. Each element is:

```js
{ type: "rectangle" | "oval" | "line" | "text",
  uuid: "rect-a1b2c3d4e5",   // UUID.generate(prefix)
  selected: false,
  properties: { startX, startY, endX, endY, ...style } }
```

| type | geometry | style / data |
|---|---|---|
| `rectangle`, `oval` | `startX startY endX endY` | `fill strokeColor strokeWidth strokeStyle borderRadius opacity` |
| `line` | `startX startY endX endY` | `strokeColor strokeWidth strokeStyle headStart headEnd` *(heads stored, not drawn yet)* |
| `text` | `startX startY endX endY` | `content` |

`addElement(type, uuid, properties)` appends; `selectElement(uuid)` marks one element selected (any non-matching id deselects everything); `encodeContent(content, centerX, centerY)` maps stored elements to rendered `<Shape>`/`<Line>`/`<Text>` components, adding the center back into their coordinates. Geometry and style reach CSS through inline custom properties (`--x`, `--width`, `--fill`, …).

### Layer 2 — Tools

Each tool is a hook composing `useMouse` with the primitives. All five are mounted unconditionally in `App.jsx`; the `active` boolean decides whether listeners exist.

- **`useSelectTool(ref, active, selectElement)`** — on click, reads `data-uuid` off the event target; empty canvas → `selectElement(null)` → deselect all.
- **`useMoveTool(ref, active, scrollTo)`** — on down, snapshots scroll and flips to `grabbing`; on move, scrolls by the inverse mouse delta.
- **`useShapeTool(ref, active, shape, enablePreview, disablePreview, addElement)`** — one hook for rectangle *and* oval; App passes the `activeTool` string through as `shape`.
- **`useLineTool(ref, active, enablePreview, disablePreview, addElement)`** — same lifecycle, hardcoded `"line"`.
- **`useTextTool(ref, active, enablePreview, disablePreview, addElement, setActiveTool)`** — same lifecycle (previews as a rectangle ghost), commits a `"text"` element with placeholder content, then switches back to `"select"`.

The shared drawing-tool lifecycle: `onDown` snapshots the scroll position and canvas center; `onMove` (only once `hasDragged`) shows the preview at absolute coordinates; `onUp` commits via `addElement` at center-relative coordinates with the tool's default style, then hides the preview. A plain click commits a default-sized element instead.

### Data flow

```
      DOM events on the board div (mousedown / mousemove / mouseup / click)
                        │
                     useMouse ─── active? ──no──▶ (listeners detached)
                        │
        onDown / onMove / onUp / onClick   ({ ...mouse }, setCursor)
                        │
             the active tool hook decides
      ┌─────────────────┼──────────────────────┐
enablePreview() /   addElement()          scrollTo() / scrollBy()
disablePreview()        │                        │
      │                 │                  mutates DOM scroll
usePreview state   useContent state              │
      └────────┬────────┘             scroll listener mirrors → boardState
               ▼
      App re-renders → Board renders content + ghost
```

### Coordinate system

Three spaces:

1. **Viewport** — what `mouse.x/y` gives you (`e.clientX/Y`). The board's top-left sits at the viewport origin, so viewport coords double as board coords.
2. **Canvas-absolute** — relative to the canvas div's top-left: `viewport + scroll` (scroll snapshotted at `onDown`).
3. **Center-relative** — relative to the canvas center: `canvas-absolute − center`, where the commit-time center is `scrollWidth / 2` (snapshotted at `onDown`) and the render-time center is `canvasSize / 2`.

**Committed elements are stored center-relative.** The canvas grows and shrinks *symmetrically around its center*, so center-relative coordinates never need rewriting when it resizes — that's the whole trick. `encodeContent` re-adds the center at render time; the subtract-at-commit / add-at-render pair must stay exact inverses.

**The preview is fed absolute coordinates.** It's ephemeral — created during a drag, discarded on release — so it never survives a resize and can skip the center round-trip. The center cancels out (`stored + center` at render equals the absolute preview position), so the committed element appears exactly where the ghost was, with no jump.

### Dynamic canvas sizing

`canvasSize = 5000 + 2 × radius`, where `radius` is the farthest coordinate extent of any element from center — which keeps a constant 2500px of drawable margin beyond the farthest element, with a 5000px floor. The value drives the canvas div's `width`/`height` via the `--canvas-size` CSS variable.

Because growth is symmetric, every rendered point shifts by `delta / 2` when the size changes — so `useBoard` runs a **`useLayoutEffect`** that `scrollBy(delta/2, delta/2)`, landing the correction *before paint* so the resize is visually seamless. The background grid is positioned relative to the canvas center, so gridlines stay locked to the crosshair across resizes.

### Tool dispatch & shortcuts

`activeTool` is a single string in `App.jsx` (`"select" | "move" | "rectangle" | "oval" | "line" | "text"`), mapped to a boolean per tool at the call site:

```js
useMoveTool(boardRef, activeTool === 'move', scrollTo)
useShapeTool(boardRef, activeTool === 'rectangle' || activeTool === 'oval', activeTool, ...)
```

Shortcuts are declared per-tool in `toolset.js` — the toolbar buttons and key bindings both derive from that one array:

- `shortcut` — sticky key that switches and stays (`"v"`, `"h"`, `"r"`, `"o"`, `"l"`, `"t"`)
- `momentary` — key that activates only *while held*, restoring the previous tool on release (`move` has `momentary: " "` — hold Space to pan)

`useShortcuts(activeTool, setActiveTool, actions?)` wires them on `window` with **exact modifier matching**: `"r"` fires only with no modifiers held, `"ctrl+z"` only with exactly Ctrl — undeclared combos fall through to the browser. Non-tool shortcuts (undo/redo/delete, not wired yet) go in the optional `actions` array `[{ shortcut, handler }]` and take priority over tool keys. Keydown handling ignores auto-repeat and typing into inputs.

---

## Adding a new tool

Write a hook that composes `useMouse`:

```js
import { useRef } from 'react';
import useMouse from '../hooks/useMouse';

export default function useXxxTool(ref, active, /* deps */) {
  const snapshot = useRef(null);

  useMouse(ref, {
    active,
    cursor: 'crosshair',
    onDown: (mouse) => { /* snapshot scroll + center from ref.current */ },
    onMove: (mouse) => { if (!mouse.hasDragged) return; /* preview at ABSOLUTE coords */ },
    onUp:   (mouse) => { /* commit at CENTER-RELATIVE coords, clean up */ },
  });
}
```

Then install it in `App.jsx` with a dispatch condition:

```js
useXxxTool(boardRef, activeTool === 'xxx', /* deps */)
```

And add an entry to `toolset.js` (`{ id, icon, shortcut }`, optionally `momentary`) — toolbar button and keyboard shortcut appear automatically.

---

## Tech stack

- React 19
- Vite
- CSS Modules
- lucide-react (icons)

---

## Getting started

```bash
npm install
npm run dev      # dev server
npm run build    # production build
npm run preview  # serve the production build
npm run lint     # eslint
```

There is no test runner configured.

---

## Roadmap

- [x] Select / Move / Rectangle / Oval / Line / Text tools
- [x] Per-element style properties, element ids, live drag preview
- [x] Dynamic canvas sizing, keyboard shortcuts, per-tool cursors
- [ ] Selection highlight (the `selected` flag exists; nothing styles it yet)
- [ ] Pointer Events + pointer capture in `useMouse` (drags that leave the board; touch support)
- [ ] Element movement (drag to reposition)
- [ ] Properties panel (stubbed in `App.jsx`) to edit per-element style
- [ ] Editable text content (currently a fixed placeholder string)
- [ ] Undo / redo / delete (shortcut plumbing ready via `useShortcuts` `actions`)
- [ ] Line arrowheads (`headStart`/`headEnd` are stored, not yet rendered)
- [ ] Zoom (needs a viewport-transform refactor first — see `CLAUDE.md`)
- [ ] Layers panel (array order already is z-order)
- [ ] Tool-key constants module, TypeScript migration
