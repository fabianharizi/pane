# Pane

A spatial canvas where AI generates **live, interactive widgets** — called *panes* — directly onto the canvas. Describe the widget you want ("a pomodoro timer", "a unit converter", "a kanban column") and it appears as a real, working piece of UI you can move, resize, and use in place.

Pane is **not** a whiteboard or a drawing tool. Nothing on the canvas is a picture of a thing — everything *is* the thing.

---

## The core idea

Traditional canvas apps render to SVG or `<canvas>`: great for drawing, but everything on the surface is dead ink. Pane's canvas is built from **native DOM elements**. Every object is a real web component with its own markup, styles, and script — buttons click, inputs type, timers tick — while still living on an infinite, pannable, zoomable surface.

That one decision is the technical differentiator: the canvas isn't a rendering target, it's a **layout of live documents**.

## How it works

1. You describe a widget in plain language.
2. The app sends the request to Claude (**Anthropic API**).
3. Claude returns a **self-contained HTML/CSS/JS document** as plain text.
4. The app injects it into a **sandboxed iframe** and places it on the canvas as a new pane — positioned, sized, and persisted like any other canvas node.

Because each pane is isolated in its own iframe, generated code can be fully interactive without touching the host app.

---

## Status

**Built and working today** — the canvas foundation:

- **Infinite canvas with a camera** — pan anywhere, zoom 10%–800% anchored at the cursor; wheel pans, Shift+wheel pans horizontally, Ctrl/⌘+wheel (or trackpad pinch) zooms; grid and origin crosshair stay crisp at any zoom
- **DOM-based elements** — every canvas object is a real DOM node in a transformed "world" div; the browser does all the coordinate mapping
- **Selection** — click- and marquee-select any number of elements; one group selection box with move, proportional resize (Shift locks aspect), and rotation (Shift snaps to 15°)
- **Properties panel** — live editing of the selected element's geometry and style
- **Command registry** — every app verb (`delete`, `copy`, `cut`, `paste`, `duplicate`, zoom ×3) declared once as `{ id, label, shortcut, enabled, run }` and bound everywhere: keyboard shortcuts, the zoom bar, and future menus/palette dispatch the same commands
- **Placeholder element types** — rectangle, oval, line, text, drawn with toolbar tools; these exercise the canvas machinery and will be joined (and largely replaced) by panes

**Designed, not yet built:**

- The pane generation pipeline (prompt → Claude → sandboxed iframe on the canvas)

## Keyboard shortcuts

**Tools** — `V` select · `H` move · `R` rectangle · `O` oval · `L` line · `T` text · hold `Space` to pan momentarily, releasing returns to the previous tool

**Commands** — `Delete`/`Backspace` delete · `Ctrl+C` copy · `Ctrl+X` cut · `Ctrl+V` paste · `Ctrl+D` duplicate · `Ctrl+=` / `Ctrl+-` / `Ctrl+0` zoom in / out / reset to 100%

---

## Architecture

React 19 + Vite, no state library, no router, CSS Modules. The guiding philosophy: **UI components are thin; all real behavior lives in custom hooks.**

- **Camera viewport** — `useCamera` owns `{ x, y, zoom }`; the Board is a clipping viewport div containing a world div with `transform: translate(pan) scale(zoom)`. Elements are stored in world coordinates and render untouched. `toWorld(screenX, screenY)` is the single conversion; drag deltas divide by zoom.
- **`usePointer`** — the event bridge: Pointer Events with capture, drag slop, gesture ownership; callbacks only ever fire for gestures that started on their own element.
- **`useContent`** — committed elements + selection; all operations are **plural-only** (arrays) — a single element is a one-element array.
- **`useCommands`** — the command registry described above; surfaces never contain behavior.

## Tech stack

- React 19 + Vite
- CSS Modules
- lucide-react (icons)
- Anthropic API (Claude) — pane generation (planned)

---

## Running locally

```bash
npm install
npm run dev      # vite dev server
npm run build    # production build
npm run preview  # serve the production build
npm run lint     # eslint
```

---

## Roadmap

- [x] Canvas foundation: camera viewport, DOM elements, multi-select, resize/rotate, properties panel, command registry
- [ ] Pane node type: sandboxed iframe rendering of stored HTML/CSS/JS content
- [ ] Generation flow: prompt input → Claude → new pane on the canvas
- [ ] Pane lifecycle: regenerate, edit prompt, pin/resize behaviors
- [ ] Canvas persistence (save / load)
- [ ] Undo / redo
