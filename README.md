# Sketch Whiteboard

A web-based interactive whiteboard built from scratch in React — an infinite scrollable canvas where you can draw and manipulate shapes using a toolbar of tools.

---

## Status

Early development. Core canvas, tool dispatch system, and a callback-based hook architecture are in place. Drawing tools (rectangle, oval) and a pan tool work end-to-end.

---

## What works

- Infinite scrollable canvas that centers on load
- Move tool — click and drag to pan around the canvas
- Rectangle tool — drag to draw a rectangle, with a live preview area while dragging
- Oval tool — same flow, different shape
- Hold Space to temporarily switch to the Move tool
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
Owns the board's state — visible dimensions, full scroll dimensions, and current scroll position. A `ResizeObserver` on both the board and the canvas keeps `scrollWidth/scrollHeight` accurate as content grows. `scrollTo`/`scrollBy` mutate the DOM; a scroll-event listener mirrors back into state.

**`useArea()`**
The rubber-band preview rectangle that tools show during a drag.

**`useContent(initial)`**
The list of committed shapes on the canvas.

### Layer 2 — Tools

Each tool is its own hook that composes the primitives above. Pattern:

```
useMouse     → DOM events delivered to callbacks
useBoard     → board state + scroll control
useXxxTool   → wires them together to do one specific thing
```

**`useMoveTool(boardRef, active, scrollTo)`**
On mousedown, snapshots the current scroll and flips the cursor to `grabbing`. On drag, scrolls the board by the inverse of the mouse delta — producing the grab-and-drag feel. On release, resets the cursor to its `grab` base.

**`useShapeTool(boardRef, active, shape, enableArea, disableArea, addElement)`**
Single hook for all rectangle-like shape drawing. On drag, calls `enableArea` to show the preview. On release, commits the shape via `addElement` (translating viewport coords to canvas coords) and hides the preview. The `shape` param ("rectangle" | "oval") is passed straight through to `enableArea`/`addElement`.

### Coordinate system

Mouse events deliver **viewport** coordinates (`e.clientX/Y`). The canvas is scrollable, so when a shape is committed the tool adds the board's `scrollLeft/Top` to translate into canvas space. The preview `Area` lives inside the scrollable canvas, so its coords are offset by `boardState.x/y` at render time in `Board.jsx`.

### Tool dispatch

`activeTool` is a single string in `App.jsx`. `Board.jsx` is the dispatcher — it maps the string to a per-tool boolean and passes that to each tool hook:

```js
useMoveTool(boardRef, activeTool === 'move', scrollTo)
useShapeTool(boardRef, activeTool === 'rectangle' || activeTool === 'oval', activeTool, ...)
```

Each tool always mounts; its `active` flag decides whether it does anything.

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

And in `Toolbar.jsx`, add it to the `tools` array so the user can select it.

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
- [ ] Text tool
- [ ] Zoom in/out
- [ ] Element selection and movement
- [ ] Layers panel
- [x] Cursor styling per tool (via `useMouse`'s callback object + `setCursor`)
- [ ] Centralize tool keys into a constants module (`TOOLS.MOVE`, `TOOLS.RECTANGLE`, ...)
