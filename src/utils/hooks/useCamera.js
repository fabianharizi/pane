import { useState, useRef, useEffect } from "react";

// The camera owns the viewport: pan (x, y) and zoom. The world div is rendered
// with `translate(x, y) scale(zoom)`, so:
//
//   screen = world * zoom + pan        world = (screen - pan) / zoom
//
// Elements are stored in world coordinates; this hook is the only place that
// converts between the two spaces.

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;
const WHEEL_ZOOM_SPEED = 0.002;   // exp(-deltaY * k): ~1.22x per wheel notch

const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

export default function useCamera(boardRef) {
  const [camera, setCameraState] = useState({ x: 0, y: 0, zoom: 1 });

  // Live mirror for event handlers (wheel, pointer) — render uses the state,
  // handlers read the ref. The single writer below keeps them in sync.
  const cameraRef = useRef(camera);
  const setCamera = (next) => {
    cameraRef.current = typeof next === "function" ? next(cameraRef.current) : next;
    setCameraState(cameraRef.current);
  };

  // Screen (viewport) point -> world point, using the live camera.
  const toWorld = (sx, sy) => {
    const cam = cameraRef.current;
    return { x: (sx - cam.x) / cam.zoom, y: (sy - cam.y) / cam.zoom };
  };

  const panBy = (dx, dy) => setCamera(cam => ({ ...cam, x: cam.x + dx, y: cam.y + dy }));

  // Multiply zoom by `factor`, anchored at a screen point: the world point under
  // that pixel stays under it (pan is re-derived from the new zoom).
  const zoomAt = (sx, sy, factor) => setCamera(cam => {
    const zoom = clampZoom(cam.zoom * factor);
    const wx = (sx - cam.x) / cam.zoom;
    const wy = (sy - cam.y) / cam.zoom;
    return { zoom, x: sx - wx * zoom, y: sy - wy * zoom };
  });

  // Absolute zoom, anchored at the viewport center (buttons / shortcuts / reset).
  const zoomTo = (zoom) => {
    const board = boardRef.current;
    zoomAtPoint(board.offsetWidth / 2, board.offsetHeight / 2, zoom);
  };

  const zoomAtPoint = (sx, sy, zoom) => setCamera(cam => {
    const z = clampZoom(zoom);
    const wx = (sx - cam.x) / cam.zoom;
    const wy = (sy - cam.y) / cam.zoom;
    return { zoom: z, x: sx - wx * z, y: sy - wy * z };
  });

  // Start with the world origin (0,0) at the viewport center — where the old
  // scroll model centered its canvas, so existing content appears in place.
  useEffect(() => {
    const board = boardRef.current;
    setCamera({ x: board.offsetWidth / 2, y: board.offsetHeight / 2, zoom: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel: plain = pan, shift = horizontal pan, ctrl/meta = zoom at the cursor
  // (browsers deliver trackpad pinch as ctrl+wheel). Non-passive so we can
  // suppress the browser's own scroll/page-zoom.
  useEffect(() => {
    const board = boardRef.current;

    const handleWheel = (e) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * WHEEL_ZOOM_SPEED));
      } else if (e.shiftKey) {
        // Mouse wheels only report deltaY; trackpads report deltaX directly.
        panBy(-(e.deltaX || e.deltaY), 0);
      } else {
        panBy(-e.deltaX, -e.deltaY);
      }
    };

    board.addEventListener("wheel", handleWheel, { passive: false });
    return () => board.removeEventListener("wheel", handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    "camera": camera,
    "cameraRef": cameraRef,
    "panBy": panBy,
    "zoomAt": zoomAt,
    "zoomTo": zoomTo,
    "toWorld": toWorld
  };
}
