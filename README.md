# Sketch Whiteboard

A web-based interactive whiteboard built from scratch in React — an infinite scrollable canvas where you draw and manipulate elements with a toolbar of tools.

The guiding philosophy: **UI components are thin; all real behavior lives in custom hooks.** No state library, no router, no test runner — plain React 19 state lifted to `App.jsx`, composed through a small hook system, styled with CSS Modules.

---

## Status

Early development. The canvas, tool dispatch, keyboard shortcuts, a pointer-event hook with capture, a selection box with resize/move handles, and a live properties panel are in place. Drawing tools (rectangle, oval, line, text), a pan tool, and a click-to-select tool work end-to-end.

---

## What works today

- **Infinite scrollable canvas** — dark grid with a center crosshair, scrolled to center on load, grows and shrinks to fit content
- **Move tool** — click-drag to pan (`grab`/`grabbing` cursors); hold **Space** from any tool to pan momentarily, releasing restores the tool you had
- **Select tool** — click an element to select it, click empty canvas to deselect (single-select)
- **Rectangle / Oval tools** — drag to draw with a live dashed-teal ghost preview; a plain click drops a default 100×100 element
- **Line tool** — drag to draw a straight line (arrowhead metadata is stored per line but not rendered yet)
- **Text tool** — drag (or click) to drop a placeholder text box
- **Draw = select** — a freshly drawn element is auto-selected and the tool flips back to Select
- **Selection box** — resize handles (corners + edges, **Shift** locks aspect ratio, minimum size so it never flips), endpoint handles for lines, and drag-the-body to move the whole element
- **Properties panel** — edit the selected element's geometry and style live (position/size, fill & stroke with an on/off toggle, stroke width/style, corner radius, opacity, text)
- **Per-element styling** — every element carries its own `properties` bag; each component applies its own defaults
- **Element identity** — crypto-random ids (`rect-a1b2c3d4e5`) used as React keys and `data-uuid` attributes
- **Keyboard shortcuts** — sticky tool keys `V` `H` `R` `O` `L` `T`, momentary Space-to-pan, exact modifier matching (a bare `R` won't collide with Ctrl+R), tooltips on toolbar buttons
- **Pointer input** — Pointer Events with `setPointerCapture`, so a drag keeps tracking even when the pointer leaves the element; per-tool cursors, switchable mid-gesture

---

## Architecture

`App.jsx` is the top-level owner **and the tool dispatcher**: it holds the refs and the `activeTool` string, calls the state hooks, mounts every tool hook with a boolean, and passes plain data down to a presentational `Board.jsx`. All state hooks return **objects** (`{ content, addElement, … }`), so consumers destructure by name.

There are two hook layers.

### Layer 1 — Primitives

**`usePointer(ref, callback)`** — the event bridge. Attaches **Pointer Events** (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`/`lostpointercapture`/`click`) to `ref.current` while `callback.active` is true and delivers each to the consumer's callbacks. Returns nothing — it's a sink, not a source.

```js
usePointer(boardRef, {
  active,                                  // boolean: listeners attach only while true
  cursor,                                  // optional base cursor, applied while active
  onDown:  (pointer, setCursor) => {...},  // optional
  onMove:  (pointer, setCursor) => {...},  // optional, every pointermove
  onUp:    (pointer, setCursor) => {...},  // optional
  onClick: (pointer, setCursor) => {...},  // optional, only when it wasn't a drag
});
```

Each callback receives a `pointer` snapshot — `{ isDown, startX, startY, x, y, hasDragged, target, shiftKey }` in viewport coordinates — plus a `setCursor(type?)` helper. Notable behaviors:

- **Pointer capture** (`setPointerCapture` on down) keeps a drag alive when the pointer leaves the element; `handleDown` calls `stopPropagation` so a nested element owns its gesture (a handle doesn't let the board's tools steal capture).
- **4px slop** — `hasDragged` only flips once the pointer travels >4px, so a jittery click isn't read as a drag.
- **Robust gesture end** — a missed pointer-up (`isDown` while `e.buttons === 0`) and `lostpointercapture` both reset state, so a drag can't "resume on hover" without the button held.
- **`onClick`** fires only for a gesture whose `pointerdown` this instance saw *and* that wasn't a drag — so a tool that activates mid-gesture doesn't catch the trailing click with a stale target.

*Why callback-based?* Pointer coordinates change ~60×/sec during a drag. Returning them as state would re-render the world on every move; delivering snapshots to callbacks lets each tool decide what (if anything) should render. Internally the hook keeps refs for live pointer state and a "latest callback" ref, so handlers always see current consumer logic without re-attaching listeners every render.

**`useBoard(boardRef, canvasRef, content)` → `{ boardState, scrollTo, scrollBy }`** — owns board/canvas geometry and the dynamic-resize logic. `scrollTo(x, y)`/`scrollBy(x, y)` mutate the DOM; a scroll listener mirrors the position back into state (one source of truth, synced by subscription). `boardState.canvasSize` (default `5000`) drives the canvas width/height; an effect watching `content` recomputes it from the farthest element extent, and a `useLayoutEffect` scroll-corrects when it changes (see *Dynamic canvas sizing*).

**`usePreview()` → `{ preview, enablePreview, disablePreview }`** — the drag ghost. `enablePreview(type, startX, startY, endX, endY)` stores a ready-to-render dashed-teal `<Shape>`/`<Line>` element; `disablePreview()` clears it; `Board` renders it above the content.

**`useContent(start)` → `{ content, selectedElement, hasElement, getElement, addElement, selectElement, updateElement, clearContent, encodeContent }`** — the committed elements. Each element is:

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

- `addElement(type, uuid, properties)` appends **and auto-selects** the new element (deselecting the rest).
- `selectElement(uuid)` single-selects; any non-matching id (e.g. `null`) deselects everything.
- `getElement` / `hasElement` look up by id; `updateElement(uuid, patch)` **merges** into `properties` (this is what the properties panel and the selection handles call).
- `encodeContent(content, centerX, centerY)` maps stored elements to rendered `<Shape>`/`<Line>`/`<Text>`, adding the center back into their coordinates. Geometry and style reach CSS through inline custom properties (`--x`, `--width`, `--fill`, …).

### Layer 2 — Tools

Each tool is a hook composing `usePointer` with the primitives. All five are mounted unconditionally in `App.jsx`; the `active` boolean decides whether listeners exist.

- **`useSelectTool(ref, active, selectElement)`** — on click, reads `data-uuid` off `pointer.target.closest('[data-uuid]')`; empty canvas → `selectElement(null)` → deselect all.
- **`useMoveTool(ref, active, scrollTo)`** — on down, snapshots scroll and flips to `grabbing`; on move, scrolls by the inverse pointer delta.
- **`useShapeTool(ref, active, shape, enablePreview, disablePreview, addElement, setActiveTool)`** — one hook for rectangle *and* oval; App passes the `activeTool` string through as `shape`.
- **`useLineTool(ref, active, enablePreview, disablePreview, addElement, setActiveTool)`** — same lifecycle, hardcoded `"line"`.
- **`useTextTool(ref, active, enablePreview, disablePreview, addElement, setActiveTool)`** — same lifecycle (previews as a rectangle ghost), commits a `"text"` element with placeholder content.

The shared drawing-tool lifecycle: `onDown` snapshots the scroll position and canvas center; `onMove` (only once `hasDragged`) shows the preview at absolute coordinates; `onUp` commits via `addElement` at center-relative coordinates, hides the preview, then **`setActiveTool("select")`**. Since `addElement` also selects the new element, drawing something leaves it selected under the Select tool. A plain click commits a default-sized element instead.

### Selection & properties

**`SelectionBox`** renders once, for the selected element, inside the canvas. It's *controlled* — it reads `element.properties` and edits through `updateElement`, holding no geometry state of its own. Box elements get 8 resize handles (corners + edges; **Shift** locks aspect ratio; a minimum size stops them flipping); lines get two endpoint handles that move each endpoint directly (preserving direction); dragging the box interior moves the whole element. All dragging is gated to the Select tool, so panning over a selected element pans rather than moving it.

**`Properties`** is a schema-driven panel: a table declares which fields each element type exposes and how to render them, and every input reads from `element.properties` and writes through `updateElement`. `position`/`size` are derived from the stored corners; number inputs keep a draft so negative (center-relative) coordinates are typeable; `fill`/`stroke` have an on/off toggle that stores the CSS keyword `transparent`.

### Data flow

```
      Pointer events on the board div (pointerdown / move / up / click)
                        │
                    usePointer ─── active? ──no──▶ (listeners detached)
                        │
       onDown / onMove / onUp / onClick   ({ ...pointer }, setCursor)
                        │
             the active tool hook decides
      ┌─────────────────┼──────────────────────┐
enablePreview() /   addElement()          scrollTo() / scrollBy()
disablePreview()   selectElement()               │
      │            updateElement()          mutates DOM scroll
usePreview state   useContent state              │
      └────────┬────────┘             scroll listener mirrors → boardState
               ▼
   App re-renders → Board renders content + ghost + SelectionBox
```

### Coordinate system

Three spaces:

1. **Viewport** — what `pointer.x/y` gives you (`e.clientX/Y`). The board's top-left sits at the viewport origin, so viewport coords double as board coords.
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

Write a hook that composes `usePointer`:

```js
import { useRef } from 'react';
import usePointer from '../hooks/usePointer';

export default function useXxxTool(ref, active, /* deps */, setActiveTool) {
  const snapshot = useRef(null);

  usePointer(ref, {
    active,
    cursor: 'crosshair',
    onDown: (pointer) => { /* snapshot scroll + center from ref.current */ },
    onMove: (pointer) => { if (!pointer.hasDragged) return; /* preview at ABSOLUTE coords */ },
    onUp:   (pointer) => { /* commit at CENTER-RELATIVE coords, clean up, setActiveTool("select") */ },
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
- [x] Pointer Events + pointer capture (drags that leave the element; groundwork for touch)
- [x] Selection box — resize (with Shift aspect-lock + min size), line endpoints, body-drag to move
- [x] Properties panel to edit per-element geometry and style
- [ ] Selection highlight on the element itself (the `selected` flag exists; only the box shows it)
- [ ] Editable text content (currently a fixed placeholder string)
- [ ] Undo / redo / delete (shortcut plumbing ready via `useShortcuts` `actions`)
- [ ] Line arrowheads (`headStart`/`headEnd` are stored, not yet rendered)
- [ ] Rotation handles (the selection box is axis-aligned only)
- [ ] Single source of truth for selection (drop the per-element `selected` flag)
- [ ] Zoom (needs a viewport-transform refactor first — see `CLAUDE.md`)
- [ ] Layers panel (array order already is z-order)
- [ ] Tool-key constants module, TypeScript migration
