import { useRef } from 'react';
import usePointer from '../hooks/usePointer';
import UUID from '../methods/UUID'

// This hook is used to implement the "Line" tool.
// It needs a condition to be active.

export default function useLineTool(ref, active, toWorld, enablePreview, disablePreview, addElements, setActiveTool) {
  // World position of the pointerdown — the line's start endpoint.
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
      enablePreview("line", start.current.x, start.current.y, cur.x, cur.y)
    },
    onUp: (p) => {
      const cur = toWorld(p.x, p.y)
      const coords = {
        startX: start.current.x,
        startY: start.current.y,
        endX: p.hasDragged ? cur.x : start.current.x + 100,
        endY: p.hasDragged ? cur.y : start.current.y,
      }

      addElements([{
        type: "line",
        uuid: UUID.generate("line"),
        properties: {
          ...coords,
          strokeColor: "#ffffff",
          strokeWidth: 2,
          strokeStyle: "solid",
          headStart: "none",
          headEnd: "arrow"
        }
      }])
      disablePreview()
      setActiveTool("select")
    }
  })
}
