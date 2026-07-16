# Sketch Whiteboard

A web-based interactive whiteboard built from scratch in React — an infinite, pannable, zoomable canvas where you draw and manipulate elements with a toolbar of tools.

The guiding philosophy: **UI components are thin; all real behavior lives in custom hooks.** No state library, no router, no test runner — plain React 19 state lifted to `App.jsx`, composed through a small hook system, styled with CSS Modules.

---

## Status

Core whiteboard interactions work end-to-end: drawing (rectangle, oval, line, text), click- and marquee-selection of multiple elements, a group selection box with proportional resize and move, a live properties panel, copy/paste/delete, and a camera-based viewport with pan and zoom-to-cursor.

---

## What works today

- **Infinite canvas with a camera** — pan anywhere, zoom 10%–800% anchored at the cursor; grid and origin crosshair track the camera and stay crisp at any zoom
- **Wheel navigation** — wheel pans, Shift+wheel pans horizontally, Ctrl/⌘+wheel (or trackpad pinch) zooms at the cursor
- **Zoom UI** — bottom-right − / readout / + pill (readout click resets to 100%), plus `Ctrl+=` / `Ctrl+-` / `Ctrl+0`
- **Move tool** — click-drag to pan; hold **Space** from any tool to pan momentarily
- **Select tool** — click an element to select it; drag a marquee to select everything it touches; click empty canvas to deselect
- **Multi-select group box** — one selection box around any number of elements: drag the body to move them all, drag handles to scale them proportionally (Shift locks aspect), a lone line gets endpoint handles instead
- **Rotation** — drag the dot above the selection to rotate; Shift snaps to 15°. Shapes and text store a `rotation` (shown in the panel, editable); rotating a group turns everything about the group center — lines included, via their endpoints
- **Drawing tools** — rectangle, oval, line, text; live dashed ghost preview; a plain click drops a default-sized element; a fresh draw is auto-selected and the tool returns to Select
- **Properties panel** — edits the selected element's geometry and style live (position/size, fill & stroke with on/off toggles, stroke width/style, corner radius, opacity, text) — shown when exactly one element is selected
- **Copy / cut / paste / duplicate / delete** — `Ctrl+C` / `Ctrl+X` / `Ctrl+V` (group-aware, pasted set selected) / `Ctrl+D` (duplicate in place, clipboard untouched) / `Delete`/`Backspace`
- **Command registry** — every app verb is declared once (`{ id, label, shortcut, enabled, run }`) and bound everywhere: shortcuts, the zoom bar, and future menus/palette all dispatch the same commands
- **Keyboard shortcuts** — sticky tool keys `V` `H` `R` `O` `L` `T`, momentary Space-pan, exact modifier matching (bare `R` won't collide with Ctrl+R)
- **Element identity & styling** — crypto-random ids as React keys / `data-uuid`; every element carries its own `properties` bag

---

## Architecture

`App.jsx` is the top-level owner **and the tool dispatcher**: it holds the board ref and the `activeTool` string, calls the state hooks, mounts every tool hook with a boolean, wires shortcuts, and passes plain data down to a presentational `Board.jsx`. All state hooks return **objects**; all operations are **plural-only** (arrays) — a single element is a one-element array.

### The camera

`useCamera(boardRef)` owns the viewport: `camera = { x, y, zoom }`, where `screen = world · zoom + pan`. The Board renders a clipping viewport div carrying `--cam-x/--cam-y/--cam-zoom` CSS variables, and inside it a **world div** with `transform: translate(pan) scale(zoom)`. Elements are stored in **world coordinates** and render inside the world div untouched — the browser does all the mapping.

- `toWorld(screenX, screenY)` is the single conversion; tools call it at event time (it reads a live camera ref, so listeners never re-attach).
- `zoomAt` anchors zoom at the cursor: the world point under the pixel stays put (`newPan = cursor − world · newZoom`).
- The wheel listener lives here too: pan / shift-pan / ctrl-zoom, `preventDefault` to suppress browser scroll and page-zoom.
- The grid is a *viewport* background driven by the camera vars (`background-size: 50px × zoom`, `background-position: pan`), so gridlines stay 1px sharp at any zoom.
- **Delta rule:** pointer drag deltas are screen pixels — anything applying them to world geometry divides by `zoom` (the SelectionBox does this for every drag).

### Layer 1 — Primitives

**`usePointer(ref, callback)`** — the event bridge. Pointer Events with capture (`setPointerCapture`), a 4px drag-slop, a missed-pointerup safety net, and gesture ownership (`stopPropagation` on down/click so nested handles don't fight board tools). Callbacks `onDown/onMove/onUp/onClick/onCancel`, each receiving `{ isDown, startX, startY, x, y, hasDragged, target, shiftKey }` in screen coords plus `setCursor`.

**`useCamera(boardRef)` → `{ camera, cameraRef, panBy, zoomAt, zoomTo, toWorld }`** — see above.

**`usePreview()` → `{ preview, enablePreview, disablePreview }`** — state for the drag ghost: plain data `{ mode, startX, startY, endX, endY }` in world coordinates (never JSX). The rendering lives in the **`<Preview mode={...}>`** component — a mode table (`rectangle` / `oval` / `line` / `select` marquee, extensible) that picks the ghost component and its dashed-teal style. Board renders it inside the world div.

**`useContent(start)` → `{ content, selectedElements, hasElement, getElement, addElements, selectElements, updateElements, deleteElements, clearContent, encodeContent }`** — committed elements plus selection, all plural:

```js
{ type: "rectangle" | "oval" | "line" | "text",
  uuid: "rect-a1b2c3d4e5",          // UUID.generate(prefix)
  selected: false,
  properties: { startX, startY, endX, endY, ...style } }   // world coords
```

- `addElements(list)` appends **and selects exactly the new set** — a draw or paste becomes the selection
- `selectElements(uuids)` selects exactly those; `[]` deselects all
- `updateElements(patches)` merges `[{ uuid, properties }]` in one pass
- `deleteElements(uuids)` removes and prunes the selection
- `encodeContent(content)` maps stored elements to `<Shape>`/`<Line>`/`<Text>` — properties pass through untouched (stored = world = render)

### Layer 2 — Tools

All mounted unconditionally in `App.jsx`; the `active` boolean decides whether listeners exist.

- **`useSelectTool(ref, active, content, selectElements, toWorld, enablePreview, disablePreview)`** — click → select one (`closest('[data-uuid]')`); drag → marquee: world-space AABB overlap test, selects everything touched
- **`useMoveTool(ref, active, panBy)`** — drags the camera; content follows the cursor
- **`useShapeTool(ref, active, shape, toWorld, …, addElements, setActiveTool)`** — rectangle *and* oval
- **`useLineTool` / `useTextTool`** — same lifecycle, fixed types

Shared drawing lifecycle: `onDown` snapshots `toWorld(pointer)` as the anchor; `onMove` previews anchor→cursor in world coords; `onUp` commits via `addElements` and flips back to Select. One conversion, no scroll math, no center math.

### Selection

`SelectionBox` renders **once for the whole selection** — one code path for any count (the group box of one element is that element's box). It's controlled: reads `properties`, writes `updateElements`. Body-drag translates all members; handles resize the group box and map every member's raw corners proportionally into it (raw mapping preserves line direction; one element behaves exactly like classic resize). The **rotate dot** above the box turns the selection about the group center: shapes/text accumulate their `rotation` property, lines rotate via their endpoints, Shift snaps to 15°; a lone rotated element rotates its selection chrome too, and resizing it works along its own axes. Handles counter-scale (`1/zoom`) and drag deltas divide by zoom, so the feel is identical at any zoom. All dragging is gated to the Select tool, so panning over a selection pans.

`Properties` receives the same `selectedElements` array and shows itself only when exactly one element is selected.

### Commands & shortcuts

App functions are **commands** — verbs declared once in a registry (`useCommands`: delete, copy, cut, paste, duplicate, zoom ×3) as `{ id, label, shortcut, enabled, run }`. Surfaces never contain behavior: `useShortcuts` binds the `shortcut`s (exact modifier matching, priority over tool keys), the ZoomBar dispatches `runCommand("zoom-in")`, and future menus or a command palette just render the same registry. `enabled` predicates gate execution everywhere (Ctrl+X with nothing selected does nothing). Tool keys stay declared per-tool in `toolset.js` (`shortcut` sticky, `momentary` hold-to-switch) — tools are modes, not commands.

---

## Adding a new tool

```js
import { useRef } from 'react';
import usePointer from '../hooks/usePointer';

export default function useXxxTool(ref, active, toWorld, /* deps */, setActiveTool) {
  const start = useRef(null);

  usePointer(ref, {
    active,
    cursor: 'crosshair',
    onDown: (p) => { start.current = toWorld(p.x, p.y); },
    onMove: (p) => { if (!p.hasDragged) return; /* preview: start → toWorld(p.x, p.y) */ },
    onUp:   (p) => { /* commit world coords via addElements([...]), setActiveTool("select") */ },
  });
}
```

Install in `App.jsx` with a dispatch condition, and add `{ id, icon, shortcut }` to `toolset.js` — the toolbar button and key binding appear automatically.

---

## Tech stack

- React 19
- Vite
- CSS Modules
- lucide-react (icons)

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

- [x] Select / Move / Rectangle / Oval / Line / Text tools
- [x] Multi-select (marquee + group selection box, proportional group resize)
- [x] Properties panel, per-element styling, copy/paste/delete
- [x] Camera viewport: pan, zoom-to-cursor, zoom UI, keyboard zoom
- [x] Pointer Events + capture, keyboard shortcuts, dynamic ghost previews
- [ ] Editable text content (double-click to edit; needs synthesized dblclick)
- [ ] Undo / redo
- [ ] Line arrowheads (`headStart`/`headEnd` stored, not yet rendered)
- [x] Rotation (handle + property, group rotation, 15° Shift snap)
- [ ] Multi-edit in the Properties panel (shared fields, mixed values)
- [ ] Rotation-aware selection bounds & marquee (currently use unrotated footprints)
- [ ] Touch pinch-zoom (trackpad pinch already works)
- [ ] Layers panel (array order already is z-order)
- [ ] Tool-key constants module, TypeScript migration
