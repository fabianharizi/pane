# Sketch Whiteboard

A web-based interactive whiteboard built from scratch in React — an infinite scrollable canvas where you can draw and manipulate shapes using a toolbar of tools.

---

## Status

Early development. Core canvas, tool dispatch system, and a callback-based hook architecture are in place. Drawing tools (rectangle, oval, line) and a pan tool work end-to-end, and the canvas grows/shrinks to fit its content.

---

## What works

- Infinite scrollable canvas that centers on load
- Move tool — click and drag to pan around the canvas
- Rectangle tool — drag to draw a rectangle, with a live preview ghost while dragging
- Oval tool — same flow, different shape
- Line tool — drag to draw a line
- Dynamic canvas — the canvas grows and shrinks around its center to fit content, keeping the view pinned during the resize
- Keyboard shortcuts — sticky tool keys (`V`/`H`/`R`/`O`/`L`), hold **Space** to temporarily pan (restores your previous tool on release), and modifier-aware combos ready for actions like undo/redo. Toolbar buttons show their shortcut as a tooltip.
- Per-tool cursors (e.g. Move shows `grab` / `grabbing`, shape tools show `crosshair`)
- Canvas and board dimensions tracked reactively (resize-aware)

---

## Architecture

The project is built around a custom hook system where each concern is isolated and composable. There are two layers:

### Layer 1 — Primitives

**`useMouse(ref, callback)`**
The event bridge. Attaches `mousedown`/`mousemove`/`mouseup` listeners on `ref.current` while `callback.active` is true, and delivers each event to the consumer's callbacks. Returns nothing — it's a sink, not a source.

The callback object shape:

```js
{
  active,                              // boolean: on / off
  cursor,                             // optional base cursor, applied while active
  onDown: (mouse, setCursor) => {...}, // optional
  onDrag: (mouse, setCursor) => {...}, // optional, only fires while isDown
  onUp:   (mouse, setCursor) => {...}, // optional
}
```

Each callback receives a `mouse` object — `{ isDown, startX, startY, x, y }` (viewport coordinates) — and a `setCursor(type?)` helper. `setCursor('grabbing')` overrides the cursor mid-gesture; `setCursor()` with no argument resets it to the tool's base `cursor`. The base cursor is applied on activate and reset to `default` on deactivate.

Internally `useMouse` uses two refs — one for the live mouse state, one for the "latest callback" — so handlers always see the current consumer logic without re-attaching DOM listeners on every render.

**`useBoard(boardRef, canvasRef)`**
Owns the board's state — visible dimensions, scroll position, and the **canvas size**. `scrollTo`/`scrollBy` mutate the DOM; a scroll-event listener mirrors back into state. `boardState.canvasSize` (default `5000`) drives the canvas width/height, and `setSize(content)` recomputes it from the content's farthest extent from center (`5000 + radius * 2`), so the canvas grows *and* shrinks to fit — with a `5000` floor.

**`usePreview()`**
The drag preview ("ghost") tools show during a drag. It stores a ready-to-render `<Shape>`/`<Line>` element; `enablePreview(...)` builds it, `disablePreview()` clears it.

**`useContent(initial)`**
The list of committed shapes on the canvas. `encodeContent(content, centerX, centerY)` turns the stored (center-relative) shapes into rendered `<Shape>`/`<Line>` elements.

### Layer 2 — Tools

Each tool is its own hook that composes the primitives above. Pattern:

```
useMouse     → DOM events delivered to callbacks
useBoard     → board state + scroll control
useXxxTool   → wires them together to do one specific thing
```

**`useMoveTool(boardRef, active, scrollTo)`**
On mousedown, snapshots the current scroll and flips the cursor to `grabbing`. On drag, scrolls the board by the inverse of the mouse delta — producing the grab-and-drag feel. On release, resets the cursor to its `grab` base.

**`useShapeTool(boardRef, active, shape, enablePreview, disablePreview, addElement)`**
Single hook for all rectangle-like shape drawing. On mousedown, snapshots scroll and canvas center. On drag, calls `enablePreview` to show the ghost. On release, commits the shape via `addElement` (in center-relative coords) and hides the preview. The `shape` param ("rectangle" | "oval") flows straight through.

**`useLineTool(boardRef, active, enablePreview, disablePreview, addElement)`**
Same lifecycle as `useShapeTool`, fixed to the `"line"` type.

### Coordinate system

Three spaces: **viewport** (`e.clientX/Y`), **canvas-absolute** (`viewport + scroll`), and **center-relative** (`canvas-absolute − center`, where `center = canvasSize / 2`). Committed shapes are stored **center-relative**, which keeps them invariant when the canvas resizes symmetrically around its center; `encodeContent` adds the center (`canvasSize / 2`) back at render time. The live preview is fed **absolute** coords — it's ephemeral, so it skips the center round-trip.

Because the canvas resizes to fit content, `Board.jsx` also runs a `useLayoutEffect` that `scrollBy(delta/2)` whenever `canvasSize` changes, pinning the view so the resize is visually seamless.

### Tool dispatch & shortcuts

`activeTool` is a single string in `App.jsx`. `Board.jsx` is the dispatcher — it maps the string to a per-tool boolean and passes that to each tool hook:

```js
useMoveTool(boardRef, activeTool === 'move', scrollTo)
useShapeTool(boardRef, activeTool === 'rectangle' || activeTool === 'oval', activeTool, ...)
```

Each tool always mounts; its `active` flag decides whether it does anything.

Keyboard shortcuts live in `useShortcuts(activeTool, setActiveTool, actions?)`, declared per-tool in `toolset.js` (`shortcut` for sticky keys, `momentary` for hold-to-switch like Space-to-pan). Shortcut strings are modifier-aware with exact matching (`"ctrl+z"` won't fire on a bare `z`, and `"r"` won't fire under Ctrl+R). Non-tool shortcuts are passed as an `actions` array.

---

## Adding a new tool

The pattern is short. Write a hook that composes `useMouse` with a callback object:

```js
import useMouse from './useMouse';

export default function useXxxTool(boardRef, active, /* deps */) {
  useMouse(boardRef, {
    active,
    cursor: 'crosshair',                       // optional base cursor
    onDown: (mouse, setCursor) => { /* snapshot state if needed */ },
    onDrag: (mouse, setCursor) => { /* show preview / update something */ },
    onUp:   (mouse, setCursor) => { /* commit / cleanup */ },
  });
}
```

Then in `Board.jsx`, install it with a dispatch condition:

```js
useXxxTool(boardRef, activeTool === 'xxx', /* deps */)
```

And in `toolset.js`, add an entry (`{ id, icon, shortcut }`) — the toolbar buttons and keyboard shortcuts both derive from that array.

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

---

## Roadmap

- [ ] Select tool
- [x] Rectangle tool
- [x] Oval tool
- [x] Line tool
- [ ] Text tool
- [ ] Zoom in/out
- [ ] Element selection and movement
- [ ] Undo / redo / delete (shortcut plumbing is ready via `useShortcuts`'s `actions`)
- [ ] Layers panel
- [x] Keyboard shortcuts (sticky keys, hold-to-pan, modifier-aware)
- [x] Dynamic canvas that resizes to fit content
- [x] Cursor styling per tool (via `useMouse`'s callback object + `setCursor`)
- [ ] Centralize tool keys into a constants module (`TOOLS.MOVE`, `TOOLS.RECTANGLE`, ...)
