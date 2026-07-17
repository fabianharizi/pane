# Pane

A spatial canvas where AI generates **live, interactive widgets** — called *panes* — directly onto the canvas. Describe the widget you want ("a pomodoro timer", "a unit converter", "a kanban column") and it appears as a real, working piece of UI you can move, resize, and use in place.

Pane is **not** a whiteboard or a drawing tool. Nothing on the canvas is a picture of a thing — everything *is* the thing.

---

## The core idea

Traditional canvas apps render to SVG or `<canvas>`: great for drawing, but everything on the surface is dead ink. Pane's canvas is built from **native DOM elements**. Every object is a real web component with its own markup, styles, and script — buttons click, inputs type, timers tick — while still living on an infinite, pannable, zoomable surface.

That one decision is the technical differentiator: the canvas isn't a rendering target, it's a **layout of live documents**.

## How it works

1. You describe a widget in plain language.
2. The app sends the request to the **Anthropic API**.
3. Claude returns a **self-contained HTML/CSS/JS document** as plain text.
4. The app injects it into a **sandboxed iframe** and places it on the canvas as a new pane — positioned, sized, and persisted like any other canvas node.

Because each pane is isolated in its own iframe, generated code can be fully interactive without touching the host app.

## Data model

```
users → canvases → canvas nodes
```

A **canvas node** stores position, size, type, and a JSON `content` payload (for a pane: the generated document; other node types carry their own content shape).

---

## Status

**Built and working today** — the canvas foundation (this repo):

- **Infinite canvas with a camera** — pan anywhere, zoom 10%–800% anchored at the cursor; wheel pans, Shift+wheel pans horizontally, Ctrl/⌘+wheel (or trackpad pinch) zooms; grid and origin crosshair stay crisp at any zoom
- **DOM-based elements** — every canvas object is a real DOM node in a transformed "world" div; the browser does all the coordinate mapping
- **Selection** — click- and marquee-select any number of elements; one group selection box with move, proportional resize (Shift locks aspect), and rotation (Shift snaps to 15°)
- **Properties panel** — live editing of the selected element's geometry and style
- **Command registry** — every app verb (`delete`, `copy`, `cut`, `paste`, `duplicate`, zoom ×3) declared once as `{ id, label, shortcut, enabled, run }` and bound everywhere: keyboard shortcuts, the zoom bar, and future menus/palette dispatch the same commands
- **Placeholder element types** — rectangle, oval, line, text, drawn with toolbar tools; these exercise the canvas machinery and will be joined (and largely replaced) by panes

**Designed, not yet built:**

- The pane generation pipeline (prompt → backend → sandboxed iframe on the canvas)
- The backend itself — Express + PostgreSQL + auth — which lives in a **separate repository**; this repo stays frontend-only and talks to it over HTTP

---

## Architecture

### Frontend (this repo)

React 19 + Vite, no state library, no router, CSS Modules. The guiding philosophy: **UI components are thin; all real behavior lives in custom hooks.**

- **Camera viewport** — `useCamera` owns `{ x, y, zoom }`; the Board is a clipping viewport div containing a world div with `transform: translate(pan) scale(zoom)`. Elements are stored in world coordinates and render untouched. `toWorld(screenX, screenY)` is the single conversion; drag deltas divide by zoom.
- **`usePointer`** — the event bridge: Pointer Events with capture, drag slop, gesture ownership.
- **`useContent`** — committed elements + selection; all operations are **plural-only** (arrays) — a single element is a one-element array.
- **`useCommands`** — the command registry described above; surfaces never contain behavior.

**Backend-ready by design.** The backend lives elsewhere, so this app is built to swap in remote persistence without touching canvas code: element state is plain serializable JSON (already matching the canvas-node shape), ids are client-minted, and all content mutations flow through the single `useContent` API — the seam where a sync/API layer plugs in. AI calls and persistence will go behind one thin client service module, never scattered `fetch`es in components.

### Backend (separate repository)

Express + **PostgreSQL**, deployed on **Railway**:

- `/generate` — proxies widget prompts to the Anthropic API and returns the pane document (the key stays server-side)
- CRUD for users / canvases / canvas nodes
- Auth: TBD

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React 19, CSS Modules, lucide-react (this repo) |
| AI | Anthropic API (Claude) |
| Backend | Express (separate repo) |
| Database | PostgreSQL (separate repo) |
| Hosting | Railway |
| Auth | not decided yet |

---

## Running locally

This repo is the frontend app and runs standalone:

```bash
npm install
npm run dev      # vite dev server
npm run build    # production build
npm run preview  # serve the production build
npm run lint     # eslint
```

Once wired to the backend (separate repo), the API base URL will be configured via an env var (e.g. `VITE_API_URL`); the app should keep working standalone without it.

---

## Roadmap

- [x] Canvas foundation: camera viewport, DOM elements, multi-select, resize/rotate, properties panel, command registry
- [ ] Pane node type: sandboxed iframe rendering of stored HTML/CSS/JS content
- [ ] Client API/service layer: single seam for generation + persistence calls to the backend repo
- [ ] Generation flow: prompt input → backend `/generate` → new pane on the canvas
- [ ] Persistence: load/save canvases through the backend (users → canvases → canvas nodes)
- [ ] Railway deployment
- [ ] Auth
- [ ] Pane lifecycle: regenerate, edit prompt, pin/resize behaviors
- [ ] Undo / redo
