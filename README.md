# Sketch Whiteboard

A web-based interactive whiteboard built from scratch in React. The goal is to replicate the core feel of tools like Figma — an infinite scrollable canvas where you can draw and manipulate shapes using a toolbar of tools.

---

## Status

Early development. Core canvas infrastructure is done. Tool system is actively being built out.

---

## What works

- Infinite scrollable canvas that centers on load
- Move tool — click and drag to pan around the canvas
- Canvas and board dimensions tracked reactively (resize-aware)

---

## Architecture

The project is built around a custom hook system where each concern is isolated and composable. There are three layers:

### Layer 1 — Primitives

**`useMouse(ref)`**
Tracks raw mouse state on any element. Exposes `isDown`, `startX/Y`, `x/y`, and a `setCursor` function that applies the cursor style directly to the element. Uses a ref internally for `isDown` to avoid stale closures inside event handlers.

**`useBoard(boardRef, canvasRef)`**
Owns everything about the board's state — visible dimensions, full scroll dimensions, and current scroll position. Uses a `ResizeObserver` on both the board and the canvas so `scrollWidth/scrollHeight` stay accurate as content grows. Exposes `scrollTo` and `scrollBy` for tools to use.

### Layer 2 — Tools

Each tool is its own hook that composes the primitives above. The pattern is always the same:

```
useMouse     → raw mouse data + cursor control
useBoard     → board state + scroll control
useXxxTool   → wires them together to do one specific thing
```

**`useMoveTool(boardRef, scrollTo, active)`**
Activates when `active` is true. Captures the board's scroll position on mousedown, then offsets it as the mouse moves — creating the grab-and-drag feel. Manages its own cursor states (`grab` → `grabbing`) through `useMouse`.

### Adding a new tool

Every new tool follows the same structure:

```js
export default function useXxxTool(boardRef, active, /* whatever else it needs */) {
  const [mouse, onMouseDown, onMouseMove, onMouseUp, setCursor] = useMouse(boardRef);

  useEffect(() => {
    if (!active) return;
    const board = boardRef.current;

    // attach listeners
    board.addEventListener('mousedown', onMouseDown);
    board.addEventListener('mousemove', onMouseMove);
    board.addEventListener('mouseup', onMouseUp);

    return () => {
      // detach on deactivate
      board.removeEventListener('mousedown', onMouseDown);
      board.removeEventListener('mousemove', onMouseMove);
      board.removeEventListener('mouseup', onMouseUp);
    };
  }, [active]);

  useEffect(() => {
    // react to mouse state and do something
  }, [mouse.x, mouse.y]);
}
```

---

## Tech stack

- React
- CSS Modules

---

## Getting started

```bash
npm install
npm run dev
```

---

## Roadmap

- [ ] Select tool
- [ ] Rectangle tool
- [ ] Oval tool
- [ ] Text tool
- [ ] Zoom in/out
- [ ] Element selection and movement
- [ ] Layers panel