import { useRef } from 'react';
import usePointer from '../hooks/usePointer';
import UUID from '../methods/UUID'
import { bindTargetAt } from '../methods/hitTest'

// This hook is used to implement the "Line" tool. Lines are connectors: a draw
// that starts or ends on a bindable element snaps to that element's nearest
// side and commits with the binding, so the finished line tracks the element.
// It needs a condition to be active.

export default function useLineTool(ref, active, content, toWorld, enablePreview, disablePreview, addElements, setActiveTool) {
  // World position of the pointerdown — the line's start endpoint, snapped to
  // the bind anchor when the press lands on a bindable element.
  const start = useRef({ x: 0, y: 0 })
  const startBinding = useRef(null)

  usePointer(ref, {
    active: active,
    cursor: "crosshair",
    onDown: (p) => {
      const w = toWorld(p.x, p.y)
      const hit = bindTargetAt(content, w)
      startBinding.current = hit ? { uuid: hit.uuid, side: hit.side } : null
      start.current = hit ? hit.anchor : w
    },
    onMove: (p) => {
      if(!p.hasDragged) return;
      const cur = toWorld(p.x, p.y)
      enablePreview("line", start.current.x, start.current.y, cur.x, cur.y)
    },
    onUp: (p) => {
      const cur = toWorld(p.x, p.y)
      // Click-no-drag commits a default stub; only a real drag can bind the end.
      const endHit = p.hasDragged ? bindTargetAt(content, cur) : null
      const end = endHit ? endHit.anchor
        : p.hasDragged ? cur
        : { x: start.current.x + 100, y: start.current.y }

      addElements([{
        type: "line",
        uuid: UUID.generate("line"),
        properties: {
          startX: start.current.x,
          startY: start.current.y,
          endX: end.x,
          endY: end.y,
          startBinding: startBinding.current,
          endBinding: endHit ? { uuid: endHit.uuid, side: endHit.side } : null,
          routing: "straight",
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
