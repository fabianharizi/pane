import { useRef } from 'react';
import usePointer from '../hooks/usePointer';
import UUID from '../methods/UUID'

// This hook is used to implement the "Line" tool. 
// It needs a condition to be active

export default function useLineTool(ref, active, enablePreview, disablePreview, addElement) {
  const boardPos = useRef({
    x: 0, 
    y: 0,
    centerX: 0,
    centerY: 0,
  })

  usePointer(ref, {
    active: active,
    cursor: "crosshair",
    onDown: (p) => {
      boardPos.current = {
        x: ref.current.scrollLeft, 
        y: ref.current.scrollTop,
        centerX: ref.current.scrollWidth / 2,
        centerY: ref.current.scrollHeight / 2,
      }
    },
    onMove: (p) => {
      if(!p.hasDragged) return;
      
      enablePreview(
        "line", 
        p.startX + boardPos.current.x, 
        p.startY + boardPos.current.y, 
        p.x + boardPos.current.x, 
        p.y + boardPos.current.y
      )
    },
    onUp: (p) => {
      const coords = {
        startX: p.startX + boardPos.current.x - boardPos.current.centerX, 
        startY: p.startY + boardPos.current.y - boardPos.current.centerY, 
        endX: (p.hasDragged) 
                ? p.x + boardPos.current.x - boardPos.current.centerX 
                : p.startX + boardPos.current.x - boardPos.current.centerX + 100, 
        endY: (p.hasDragged) 
                ? p.y + boardPos.current.y - boardPos.current.centerY 
                : p.startY + boardPos.current.y - boardPos.current.centerY, 
      }
      
      addElement(
        "line", 
        UUID.generate("line"),
        {
          ...coords,
          strokeColor: "#ffffff",
          strokeWidth: 2,
          strokeStyle: "solid",
          headStart: "none",
          headEnd: "arrow"
        }
      )
      disablePreview()
    }
  })
}