import { useRef } from 'react';
import usePointer from '../hooks/usePointer';
import UUID from '../methods/UUID'

// This hook is used to implement the "Shape" tool (rectangle AND oval — App
// passes the active tool string as `shape`). It needs a condition to be active.

export default function useShapeTool(ref, active, shape, toWorld, enablePreview, disablePreview, addElements, setActiveTool) {
  // World position of the pointerdown — the shape's anchored corner.
  const start = useRef({ x: 0, y: 0 })

  usePointer(ref, {
    active: active,
    cursor: "crosshair",
    onDown: (p) => {
      start.current = toWorld(p.x, p.y)
    },
    onMove: (p) => {
      if(!p.hasDragged) return;
      const cur = toWorld(p.x, p.y)
      enablePreview(shape, start.current.x, start.current.y, cur.x, cur.y)
    },
    onUp: (p) => {
      const cur = toWorld(p.x, p.y)
      const coords = {
        startX: start.current.x,
        startY: start.current.y,
        endX: p.hasDragged ? cur.x : start.current.x + 100,
        endY: p.hasDragged ? cur.y : start.current.y + 100,
      }

      addElements([{
        type: shape,
        uuid: UUID.generate(shape.slice(0, 4)),
        properties: {
          ...coords,
          fill: "transparent",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          strokeStyle: "solid",
          borderRadius: 0,
          opacity: 1
        }
      }])
      disablePreview()
      setActiveTool("select")
    }
  })
}
